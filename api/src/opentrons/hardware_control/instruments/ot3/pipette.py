import logging
import functools

from typing import Any, List, Dict, Optional, Set, Tuple, Union, cast
from typing_extensions import Final

from opentrons.types import Point

from opentrons.config import ot3_pipette_config
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteConfigurations,
    PipetteTipType,
    PlungerPositions,
    MotorConfigurations,
    SupportedTipsDefinition,
    TipHandlingConfigurations,
    PipetteModelType,
    PipetteChannelType,
)
from ..instrument_abc import AbstractInstrument
from .instrument_calibration import (
    save_pipette_offset_calibration,
    load_pipette_offset,
    PipetteOffsetByPipetteMount,
)
from opentrons_shared_data.pipette.dev_types import (
    UlPerMmAction,
    PipetteName,
    PipetteModel,
)
from opentrons.hardware_control.types import CriticalPoint, OT3Mount
from opentrons.hardware_control.errors import InvalidMoveError

mod_log = logging.getLogger(__name__)

# TODO (lc 12-2-2022) We should move this to the geometry configurations
INTERNOZZLE_SPACING_MM: Final[float] = 9


def piecewise_volume_conversion(
    ul: float, sequence: List[Tuple[float, float, float]]
) -> float:
    """
    Takes a volume in microliters and a sequence representing a piecewise
    function for the slope and y-intercept of a ul/mm function, where each
    sub-list in the sequence contains:

      - the max volume for the piece of the function (minimum implied from the
        max of the previous item or 0
      - the slope of the segment
      - the y-intercept of the segment

    :return: the ul/mm value for the specified volume
    """
    # pick the first item from the seq for which the target is less than
    # the bracketing element
    for x in sequence:
        if ul <= x[0]:
            # use that element to calculate the movement distance in mm
            return x[1] * ul + x[2]

    # Compatibility with previous implementation of search.
    #  list(filter(lambda x: ul <= x[0], sequence))[0]
    raise IndexError()


class Pipette(AbstractInstrument[PipetteConfigurations]):
    """A class to gather and track pipette state and configs.

    This class should not touch hardware or call back out to the hardware
    control API. Its only purpose is to gather state.
    """

    DictType = Dict[str, Union[str, float, bool]]
    #: The type of this data class as a dict

    def __init__(
        self,
        config: PipetteConfigurations,
        pipette_offset_cal: PipetteOffsetByPipetteMount,
        pipette_id: Optional[str] = None,
    ) -> None:
        self._config = config
        self._config_as_dict = config.dict()
        self._plunger_positions = config.plunger_positions_configurations
        self._plunger_motor_current = config.plunger_motor_configurations
        self._pick_up_configurations = config.pick_up_tip_configurations
        self._drop_configurations = config.drop_tip_configurations
        self._pipette_offset = pipette_offset_cal
        self._pipette_type = self._config.pipette_type
        self._pipette_version = self._config.version
        self._max_channels = self._config.channels
        self._backlash_distance = config.backlash_distance

        # TODO (lc 12-05-2022) figure out how we can safely deprecate "name" and "model"
        self._pipette_name = ot3_pipette_config.PipetteNameType(
            pipette_type=config.pipette_type,
            pipette_channels=config.channels,
            pipette_generation=config.display_category,
        )
        self._acting_as = self._pipette_name
        self._pipette_model = ot3_pipette_config.PipetteModelVersionType(
            pipette_type=config.pipette_type,
            pipette_channels=config.channels,
            pipette_version=config.version,
        )
        self._nozzle_offset = self._config.nozzle_offset
        self._current_volume = 0.0
        self._working_volume = float(self._config.max_volume)
        self._current_tip_length = 0.0
        self._current_tiprack_diameter = 0.0
        self._has_tip = False
        self._pipette_id = pipette_id
        self._log = mod_log.getChild(
            self._pipette_id if self._pipette_id else "<unknown>"
        )
        self._log.info(
            "loaded: {}, pipette offset: {}".format(
                self._pipette_model, self._pipette_offset.offset
            )
        )
        self.ready_to_aspirate = False
        #: True if ready to aspirate
        self._active_tip_settings = self._config.supported_tips[
            PipetteTipType(self._working_volume)
        ]
        self._fallback_tip_length = self._active_tip_settings.default_tip_length
        self._aspirate_flow_rate = self._active_tip_settings.default_aspirate_flowrate
        self._dispense_flow_rate = self._active_tip_settings.default_dispense_flowrate
        self._blow_out_flow_rate = self._active_tip_settings.default_blowout_flowrate

        # TODO (lc 12-6-2022) When we switch over to sending pipette state, we
        # we should also try to make sure the python api isn't reaching into
        # Pipette interals. For now, we want to make sure the shape of
        # tip overlap matches the shape of OT2 pipettes. We'll also need
        # to revisit some liquid configurations for tiprack types.
        self._tip_overlap = {"default": self._active_tip_settings.default_tip_overlap}

    @property
    def config(self) -> PipetteConfigurations:
        return self._config

    @property
    def channels(self) -> PipetteChannelType:
        return self._max_channels

    @property
    def backlash_distance(self) -> float:
        return self._backlash_distance

    @property
    def tip_overlap(self) -> Dict[str, float]:
        return self._tip_overlap

    @property
    def nozzle_offset(self) -> List[float]:
        return self._nozzle_offset

    @property
    def pipette_offset(self) -> PipetteOffsetByPipetteMount:
        return self._pipette_offset

    @property
    def plunger_positions(self) -> PlungerPositions:
        return self._plunger_positions

    @property
    def plunger_motor_current(self) -> MotorConfigurations:
        return self._plunger_motor_current

    @property
    def pick_up_configurations(self) -> TipHandlingConfigurations:
        return self._pick_up_configurations

    @pick_up_configurations.setter
    def pick_up_configurations(
        self, pick_up_configs: TipHandlingConfigurations
    ) -> None:
        self._pick_up_configurations = pick_up_configs

    @property
    def drop_configurations(self) -> TipHandlingConfigurations:
        return self._drop_configurations

    @property
    def active_tip_settings(self) -> SupportedTipsDefinition:
        return self._active_tip_settings

    def act_as(self, name: PipetteName) -> None:
        """Reconfigure to act as ``name``. ``name`` must be either the
        actual name of the pipette, or a name in its back-compatibility
        config.
        """
        raise NotImplementedError(
            "Backwards compatibility is not supported at this time."
        )

    def update_config_item(self, elem_name: str, elem_val: Any) -> None:
        raise NotImplementedError("Update config is not supported at this time.")

    @property
    def acting_as(self) -> PipetteName:
        return cast(PipetteName, f"{self._acting_as}")

    def reload_configurations(self) -> None:
        self._config = ot3_pipette_config.load_ot3_pipette(self._pipette_model)
        self._config_as_dict = self._config.dict()

    def reset_state(self) -> None:
        self._current_volume = 0.0
        self._working_volume = float(self._config.max_volume)
        self._current_tip_length = 0.0
        self._current_tiprack_diameter = 0.0
        self._has_tip = False
        self.ready_to_aspirate = False
        #: True if ready to aspirate
        self._active_tip_settings = self._config.supported_tips[
            PipetteTipType(self._working_volume)
        ]
        self._fallback_tip_length = self._active_tip_settings.default_tip_length
        self._aspirate_flow_rate = self._active_tip_settings.default_aspirate_flowrate
        self._dispense_flow_rate = self._active_tip_settings.default_dispense_flowrate
        self._blow_out_flow_rate = self._active_tip_settings.default_blowout_flowrate

        self._tip_overlap = {"default": self._active_tip_settings.default_tip_overlap}

    def reset_pipette_offset(self, mount: OT3Mount, to_default: bool) -> None:
        """Reset the pipette offset to system defaults."""
        if to_default:
            self._pipette_offset = load_pipette_offset(pip_id=None, mount=mount)
        else:
            self._pipette_offset = load_pipette_offset(self._pipette_id, mount)

    def save_pipette_offset(
        self, mount: OT3Mount, offset: Point
    ) -> PipetteOffsetByPipetteMount:
        """Update the pipette offset to a new value."""
        save_pipette_offset_calibration(self._pipette_id, mount, offset)
        self._pipette_offset = load_pipette_offset(self._pipette_id, mount)
        return self._pipette_offset

    @property
    def name(self) -> PipetteName:
        return cast(PipetteName, f"{self._pipette_name}")

    @property
    def model(self) -> PipetteModel:
        return cast(PipetteModel, f"{self._pipette_model}")

    @property
    def pipette_type(self) -> PipetteModelType:
        return self._pipette_type

    @property
    def pipette_id(self) -> Optional[str]:
        return self._pipette_id

    def critical_point(self, cp_override: Optional[CriticalPoint] = None) -> Point:
        """
        The vector from the pipette's origin to its critical point. The
        critical point for a pipette is the end of the nozzle if no tip is
        attached, or the end of the tip if a tip is attached.

        If `cp_override` is specified and valid - so is either
        :py:attr:`CriticalPoint.NOZZLE` or :py:attr:`CriticalPoint.TIP` when
        we have a tip, or :py:attr:`CriticalPoint.XY_CENTER` - the specified
        critical point will be used.
        """
        instr = Point(*self._pipette_offset.offset)
        offsets = self.nozzle_offset
        # Temporary solution for the 96 channel critical point locations.
        # We should instead record every channel "critical point" in
        # the pipette configurations.
        X_DIRECTION_VALUE = 1
        Y_DIVISION = 2
        if self.channels.value == 96:
            NUM_ROWS = 12
            NUM_COLS = 8
            X_DIRECTION_VALUE = -1
        elif self.channels.value == 8:
            NUM_ROWS = 1
            NUM_COLS = 8
        else:
            NUM_ROWS = 1
            NUM_COLS = 1

        x_offset_to_right_nozzle = (
            X_DIRECTION_VALUE * INTERNOZZLE_SPACING_MM * (NUM_ROWS - 1)
        )
        y_offset_to_front_nozzle = INTERNOZZLE_SPACING_MM * (NUM_COLS - 1)

        if cp_override in [
            CriticalPoint.GRIPPER_JAW_CENTER,
            CriticalPoint.GRIPPER_FRONT_CALIBRATION_PIN,
            CriticalPoint.GRIPPER_REAR_CALIBRATION_PIN,
        ]:
            raise InvalidMoveError(
                f"Critical point {cp_override.name} is not valid for a pipette"
            )
        if not self.has_tip or cp_override == CriticalPoint.NOZZLE:
            cp_type = CriticalPoint.NOZZLE
            tip_length = 0.0
        else:
            cp_type = CriticalPoint.TIP
            tip_length = self.current_tip_length
        if cp_override == CriticalPoint.XY_CENTER:
            mod_offset_xy = [
                offsets[0] - x_offset_to_right_nozzle / 2,
                offsets[1] - y_offset_to_front_nozzle / Y_DIVISION,
                offsets[2],
            ]
            cp_type = CriticalPoint.XY_CENTER
        elif cp_override == CriticalPoint.FRONT_NOZZLE:
            # front left nozzle of the 96 channel and
            # front nozzle of the 8 channel
            mod_offset_xy = [
                offsets[0],
                offsets[1] - y_offset_to_front_nozzle,
                offsets[2],
            ]
            cp_type = CriticalPoint.FRONT_NOZZLE
        else:
            mod_offset_xy = list(offsets)
        mod_and_tip = Point(
            mod_offset_xy[0], mod_offset_xy[1], mod_offset_xy[2] - tip_length
        )

        cp = mod_and_tip + instr

        if self._log.isEnabledFor(logging.DEBUG):
            info_str = "cp: {}{}: {} (from: ".format(
                cp_type, " (from override)" if cp_override else "", cp
            )
            info_str += "model offset: {} + instrument offset: {}".format(
                mod_offset_xy, instr
            )
            info_str += " - tip_length: {}".format(tip_length)
            info_str += ")"
            self._log.debug(info_str)

        return cp

    @property
    def current_volume(self) -> float:
        """The amount of liquid currently aspirated"""
        return self._current_volume

    @property
    def current_tip_length(self) -> float:
        """The length of the current tip attached (0.0 if no tip)"""
        return self._current_tip_length

    @current_tip_length.setter
    def current_tip_length(self, tip_length: float) -> None:
        self._current_tip_length = tip_length

    @property
    def current_tiprack_diameter(self) -> float:
        """The diameter of the current tip rack (0.0 if no tip)"""
        return self._current_tiprack_diameter

    @current_tiprack_diameter.setter
    def current_tiprack_diameter(self, diameter: float) -> None:
        self._current_tiprack_diameter = diameter

    @property
    def aspirate_flow_rate(self) -> float:
        """Current active flow rate (not config value)"""
        return self._aspirate_flow_rate

    @aspirate_flow_rate.setter
    def aspirate_flow_rate(self, new_flow_rate: float) -> None:
        assert new_flow_rate > 0
        self._aspirate_flow_rate = new_flow_rate

    @property
    def dispense_flow_rate(self) -> float:
        """Current active flow rate (not config value)"""
        return self._dispense_flow_rate

    @dispense_flow_rate.setter
    def dispense_flow_rate(self, new_flow_rate: float) -> None:
        assert new_flow_rate > 0
        self._dispense_flow_rate = new_flow_rate

    @property
    def blow_out_flow_rate(self) -> float:
        """Current active flow rate (not config value)"""
        return self._blow_out_flow_rate

    @blow_out_flow_rate.setter
    def blow_out_flow_rate(self, new_flow_rate: float) -> None:
        assert new_flow_rate > 0
        self._blow_out_flow_rate = new_flow_rate

    @property
    def working_volume(self) -> float:
        """The working volume of the pipette"""
        return self._working_volume

    @working_volume.setter
    def working_volume(self, tip_volume: float) -> None:
        """The working volume is the current tip max volume"""
        self._working_volume = min(self.config.max_volume, tip_volume)
        self._active_tip_settings = self._config.supported_tips[
            PipetteTipType(int(self._working_volume))
        ]
        self._fallback_tip_length = self._active_tip_settings.default_tip_length
        self._tip_overlap = {"default": self._active_tip_settings.default_tip_overlap}

    @property
    def available_volume(self) -> float:
        """The amount of liquid possible to aspirate"""
        return self.working_volume - self.current_volume

    def set_current_volume(self, new_volume: float) -> None:
        assert new_volume >= 0
        assert new_volume <= self.working_volume
        self._current_volume = new_volume

    def add_current_volume(self, volume_incr: float) -> None:
        assert self.ok_to_add_volume(volume_incr)
        self._current_volume += volume_incr

    def remove_current_volume(self, volume_incr: float) -> None:
        assert self._current_volume >= volume_incr
        self._current_volume -= volume_incr

    def ok_to_add_volume(self, volume_incr: float) -> bool:
        return self.current_volume + volume_incr <= self.working_volume

    def add_tip(self, tip_length: float) -> None:
        """
        Add a tip to the pipette for position tracking and validation
        (effectively updates the pipette's critical point)

        :param tip_length: a positive, non-zero float presenting the distance
            in Z from the end of the pipette nozzle to the end of the tip
        :return:
        """
        assert tip_length > 0.0, "tip_length must be greater than 0"
        assert not self.has_tip
        self._has_tip = True
        self._current_tip_length = tip_length

    def remove_tip(self) -> None:
        """
        Remove the tip from the pipette (effectively updates the pipette's
        critical point)
        """
        assert self.has_tip
        self._has_tip = False
        self._current_tip_length = 0.0

    @property
    def has_tip(self) -> bool:
        return self._has_tip

    # Cache max is chosen somewhat arbitrarily. With a float is input we don't
    # want this to unbounded.
    @functools.lru_cache(maxsize=100)
    def ul_per_mm(
        self, ul: float, action: UlPerMmAction, specific_tip: str = "default"
    ) -> float:
        if action == "aspirate":
            sequence = self._active_tip_settings.aspirate[specific_tip]
        elif action == "blowout":
            return self._config.shaft_ul_per_mm
        else:
            sequence = self._active_tip_settings.dispense[specific_tip]
        return piecewise_volume_conversion(ul, sequence)

    def __str__(self) -> str:
        return "{} current volume {}ul critical point: {} at {}".format(
            self._config.display_name,
            self.current_volume,
            "tip end" if self.has_tip else "nozzle end",
            0,
        )

    def __repr__(self) -> str:
        return "<{}: {} {}>".format(
            self.__class__.__name__, self._config.display_name, id(self)
        )

    def as_dict(self) -> "Pipette.DictType":
        # TODO (lc 12-05-2022) Kill this code ASAP
        self._config_as_dict.update(
            {
                "current_volume": self.current_volume,
                "available_volume": self.available_volume,
                "name": self.name,
                "model": self.model,
                "pipette_id": self.pipette_id,
                "has_tip": self.has_tip,
                "working_volume": self.working_volume,
                "aspirate_flow_rate": self.aspirate_flow_rate,
                "dispense_flow_rate": self.dispense_flow_rate,
                "blow_out_flow_rate": self.blow_out_flow_rate,
                "default_aspirate_flow_rates": self.active_tip_settings.default_aspirate_flowrate,
                "default_blow_out_flow_rates": self.active_tip_settings.default_blowout_flowrate,
                "default_dispense_flow_rates": self.active_tip_settings.default_dispense_flowrate,
                "tip_length": self.current_tip_length,
                "return_tip_height": self.active_tip_settings.default_return_tip_height,
                "tip_overlap": self.tip_overlap,
                "back_compat_names": self._config.pipette_backcompat_names,
            }
        )
        return self._config_as_dict


def _reload_and_check_skip(
    new_config: PipetteConfigurations,
    attached_instr: Pipette,
    pipette_offset: PipetteOffsetByPipetteMount,
) -> Tuple[Pipette, bool]:
    # Once we have determined that the new and attached pipettes
    # are similar enough that we might skip, see if the configs
    # match closely enough.
    # Returns a pipette object and True if we may skip hw reconfig
    # TODO this can potentially be removed in a follow-up refactor.
    if (
        new_config == attached_instr.config
        and pipette_offset == attached_instr._pipette_offset
    ):
        # Same config, good enough
        return attached_instr, True
    else:
        newdict = new_config.dict()
        olddict = attached_instr.config.dict()
        changed: Set[str] = set()
        for k in newdict.keys():
            if newdict[k] != olddict[k]:
                changed.add(k)
        if changed.intersection("quirks"):
            # Something has changed that requires reconfig
            p = Pipette(new_config, pipette_offset, attached_instr._pipette_id)
            p.act_as(attached_instr.acting_as)
            return p, False
        # Good to skip, just need to update calibration offset and update_info
        attached_instr._pipette_offset = pipette_offset
        return attached_instr, True


def load_from_config_and_check_skip(
    config: Optional[PipetteConfigurations],
    attached: Optional[Pipette],
    requested: Optional[PipetteName],
    serial: Optional[str],
    pipette_offset: PipetteOffsetByPipetteMount,
) -> Tuple[Optional[Pipette], bool]:
    """
    Given the pipette config for an attached pipette (if any) freshly read
    from disk, and any attached instruments,

    - Compare the new and configured pipette configs
    - Load the new configs if they differ
    - Return a bool indicating whether hardware reconfiguration may be
      skipped
    """

    if not config and not attached:
        # nothing attached now, nothing used to be attached, nothing
        # to reconfigure
        return attached, True

    if config and attached:
        # something was attached and something is attached. are they
        # the same? we can tell by comparing serials
        if serial == attached.pipette_id:
            if requested:
                # if there is an explicit instrument request, in addition
                # to checking if the old and new responses are the same
                # we also have to make sure the old pipette is properly
                # configured to the request
                if requested == attached.acting_as:
                    # similar enough to check
                    return _reload_and_check_skip(
                        config,
                        attached,
                        pipette_offset,
                    )
            else:
                # if there is no request, make sure that the old pipette
                # did not have backcompat applied
                if attached.acting_as == attached.name:
                    # similar enough to check
                    return _reload_and_check_skip(
                        config,
                        attached,
                        pipette_offset,
                    )

    if config:
        return Pipette(config, pipette_offset, serial), False
    else:
        return None, False
