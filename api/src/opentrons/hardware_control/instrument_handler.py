"""Shared code for managing pipette configuration and storage."""
from dataclasses import dataclass
import logging
from typing import Dict, Optional, Tuple, overload, Sequence, Any, cast, Union

from opentrons_shared_data.pipette.dev_types import UlPerMmAction

from opentrons import types as top_types
from .types import (
    CriticalPoint,
    HardwareAction,
    TipAttachedError,
    NoTipAttachedError,
    PipettePair,
    PairedPipetteConfigValueError,
    Axis,
)
from .robot_calibration import load_pipette_offset
from .dev_types import PipetteDict
from .pipette import Pipette

InstrumentsByMount = Dict[top_types.Mount, Optional[Pipette]]
PipetteHandlingData = Tuple[Pipette, top_types.Mount]

MOD_LOG = logging.getLogger(__name__)


class InstrumentHandlerProvider:
    IHP_LOG = MOD_LOG.getChild("InstrumentHandler")

    def __init__(self):
        self._attached_instruments: InstrumentsByMount = {
            top_types.Mount.LEFT: None,
            top_types.Mount.RIGHT: None,
        }
        self._ihp_log = InstrumentHandlerProvider.IHP_LOG.getChild(str(id(self)))

    def reset_instrument(self, mount: top_types.Mount = None):
        """
        Reset the internal state of a pipette by its mount, without doing
        any lower level reconfiguration. This is useful to make sure that no
        settings changes from a protocol persist.

        :param mount: If specified, reset that mount. If not specified,
                      reset both
        """

        def _reset(m: top_types.Mount):
            self._ihp_log.info(f"Resetting configuration for {m}")
            p = self._attached_instruments[m]
            if not p:
                return
            new_p = Pipette(
                p._config, load_pipette_offset(p.pipette_id, m), p.pipette_id
            )
            new_p.act_as(p.acting_as)
            self._attached_instruments[m] = new_p

        if not mount:
            for m in top_types.Mount:
                _reset(m)
        else:
            _reset(mount)

    # TODO(mc, 2022-01-11): change returned map value type to `Optional[PipetteDict]`
    # instead of potentially returning an empty dict
    def get_attached_instruments(self) -> Dict[top_types.Mount, PipetteDict]:
        """Get the status dicts of the cached attached instruments.

        Also available as :py:meth:`get_attached_instruments`.

        This returns a dictified version of the
        :py:class:`hardware_control.pipette.Pipette` as a dict keyed by
        the :py:class:`top_types.Mount` to which the pipette is attached.
        If no pipette is attached on a given mount, the mount key will
        still be present but will have the value ``None``.

        Note that this is only a query of a cached value; to actively scan
        for changes, use :py:meth:`cache_instruments`. This process deactivates
        the motors and should be used sparingly.
        """
        return {
            m: self.get_attached_instrument(m)
            for m in (top_types.Mount.LEFT, top_types.Mount.RIGHT)
        }

    # TODO(mc, 2022-01-11): change return type to `Optional[PipetteDict]` instead
    # of potentially returning an empty dict
    def get_attached_instrument(self, mount: top_types.Mount) -> PipetteDict:
        instr = self._attached_instruments[mount]
        result: Dict[str, Any] = {}
        if instr:
            configs = [
                "name",
                "min_volume",
                "max_volume",
                "channels",
                "aspirate_flow_rate",
                "dispense_flow_rate",
                "pipette_id",
                "current_volume",
                "display_name",
                "tip_length",
                "model",
                "blow_out_flow_rate",
                "working_volume",
                "tip_overlap",
                "available_volume",
                "return_tip_height",
                "default_aspirate_flow_rates",
                "default_blow_out_flow_rates",
                "default_dispense_flow_rates",
                "back_compat_names",
            ]

            instr_dict = instr.as_dict()
            # TODO (spp, 2021-08-27): Revisit this logic. Why do we need to build
            #  this dict newly every time? Any why only a few items are being updated?
            for key in configs:
                result[key] = instr_dict[key]
            result["has_tip"] = instr.has_tip
            result["tip_length"] = instr.current_tip_length
            result["aspirate_speed"] = self.plunger_speed(
                instr, instr.aspirate_flow_rate, "aspirate"
            )
            result["dispense_speed"] = self.plunger_speed(
                instr, instr.dispense_flow_rate, "dispense"
            )
            result["blow_out_speed"] = self.plunger_speed(
                instr, instr.blow_out_flow_rate, "dispense"
            )
            result["ready_to_aspirate"] = instr.ready_to_aspirate
            result["default_blow_out_speeds"] = {
                alvl: self.plunger_speed(instr, fr, "dispense")
                for alvl, fr in instr.config.default_aspirate_flow_rates.items()
            }
            result["default_dispense_speeds"] = {
                alvl: self.plunger_speed(instr, fr, "dispense")
                for alvl, fr in instr.config.default_dispense_flow_rates.items()
            }
            result["default_aspirate_speeds"] = {
                alvl: self.plunger_speed(instr, fr, "aspirate")
                for alvl, fr in instr.config.default_aspirate_flow_rates.items()
            }
        return cast(PipetteDict, result)

    @property
    def attached_instruments(self) -> Dict[top_types.Mount, PipetteDict]:
        return self.get_attached_instruments()

    @property
    def hardware_instruments(self) -> InstrumentsByMount:
        """Do not write new code that uses this."""
        return self._attached_instruments

    def set_current_tiprack_diameter(
        self, mount: Union[top_types.Mount, PipettePair], tiprack_diameter: float
    ):
        instruments = self.instruments_for(mount)
        for instr in instruments:
            assert instr[0]
            self._ihp_log.info(
                "Updating tip rack diameter on pipette mount: "
                f"{instr[1]}, tip diameter: {tiprack_diameter} mm"
            )
            instr[0].current_tiprack_diameter = tiprack_diameter

    def set_working_volume(
        self, mount: Union[top_types.Mount, PipettePair], tip_volume: int
    ):
        instruments = self.instruments_for(mount)
        for instr in instruments:
            assert instr[0]
            self._ihp_log.info(
                "Updating working volume on pipette mount:"
                f"{instr[1]}, tip volume: {tip_volume} ul"
            )
            instr[0].working_volume = tip_volume

        # Pipette config api

    def calibrate_plunger(
        self,
        mount: top_types.Mount,
        top: Optional[float] = None,
        bottom: Optional[float] = None,
        blow_out: Optional[float] = None,
        drop_tip: Optional[float] = None,
    ):
        """
        Set calibration values for the pipette plunger.
        This can be called multiple times as the user sets each value,
        or you can set them all at once.
        :param top: Touching but not engaging the plunger.
        :param bottom: Must be above the pipette's physical hard-stop, while
        still leaving enough room for 'blow_out'
        :param blow_out: Plunger is pushed down enough to expel all liquids.
        :param drop_tip: Position that causes the tip to be released from the
        pipette
        """
        instr = self._attached_instruments[mount]
        if not instr:
            raise top_types.PipetteNotAttachedError(
                "No pipette attached to {} mount".format(mount.name)
            )

        pos_dict: Dict = {
            "top": instr.config.top,
            "bottom": instr.config.bottom,
            "blow_out": instr.config.blow_out,
            "drop_tip": instr.config.drop_tip,
        }
        if top is not None:
            pos_dict["top"] = top
        if bottom is not None:
            pos_dict["bottom"] = bottom
        if blow_out is not None:
            pos_dict["blow_out"] = blow_out
        if bottom is not None:
            pos_dict["drop_tip"] = drop_tip
        for key in pos_dict.keys():
            instr.update_config_item(key, pos_dict[key])

    def set_flow_rate(self, mount, aspirate=None, dispense=None, blow_out=None):
        this_pipette = self._attached_instruments[mount]
        if not this_pipette:
            raise top_types.PipetteNotAttachedError(
                "No pipette attached to {} mount".format(mount)
            )
        if aspirate:
            this_pipette.aspirate_flow_rate = aspirate
        if dispense:
            this_pipette.dispense_flow_rate = dispense
        if blow_out:
            this_pipette.blow_out_flow_rate = blow_out

    def set_pipette_speed(self, mount, aspirate=None, dispense=None, blow_out=None):
        this_pipette = self._attached_instruments[mount]
        if not this_pipette:
            raise top_types.PipetteNotAttachedError(
                "No pipette attached to {} mount".format(mount)
            )
        if aspirate:
            this_pipette.aspirate_flow_rate = self.plunger_flowrate(
                this_pipette, aspirate, "aspirate"
            )
        if dispense:
            this_pipette.dispense_flow_rate = self.plunger_flowrate(
                this_pipette, dispense, "dispense"
            )
        if blow_out:
            this_pipette.blow_out_flow_rate = self.plunger_flowrate(
                this_pipette, blow_out, "dispense"
            )

    def instrument_max_height(
        self,
        mount: top_types.Mount,
        retract_distance: float,
        critical_point: Optional[CriticalPoint],
    ) -> float:
        """Return max achievable height of the attached instrument
        based on the current critical point
        """
        pip = self._attached_instruments[mount]
        assert pip
        cp = self.critical_point_for(mount, critical_point)

        max_height = pip.config.home_position - retract_distance + cp.z

        return max_height

    async def reset(self) -> None:
        self._attached_instruments = {
            k: None for k in self._attached_instruments.keys()
        }

    async def add_tip(self, mount: top_types.Mount, tip_length: float):
        instr = self._attached_instruments[mount]
        attached = self.attached_instruments
        instr_dict = attached[mount]
        if instr and not instr.has_tip:
            instr.add_tip(tip_length=tip_length)
            # TODO (spp, 2021-08-27): These items are being updated in a local copy
            #  of the PipetteDict, which gets thrown away. Fix this.
            instr_dict["has_tip"] = True
            instr_dict["tip_length"] = tip_length
        else:
            self._ihp_log.warning("attach tip called while tip already attached")

    async def remove_tip(self, mount: top_types.Mount):
        instr = self._attached_instruments[mount]
        attached = self.attached_instruments
        instr_dict = attached[mount]
        if instr and instr.has_tip:
            instr.remove_tip()
            # TODO (spp, 2021-08-27): These items are being updated in a local copy
            #  of the PipetteDict, which gets thrown away. Fix this.
            instr_dict["has_tip"] = False
            instr_dict["tip_length"] = 0.0
        else:
            self._ihp_log.warning("detach tip called with no tip")

    def critical_point_for(
        self, mount: top_types.Mount, cp_override: CriticalPoint = None
    ) -> top_types.Point:
        """Return the current critical point of the specified mount.

        The mount's critical point is the position of the mount itself, if no
        pipette is attached, or the pipette's critical point (which depends on
        tip status).

        If `cp_override` is specified, and that critical point actually exists,
        it will be used instead. Invalid `cp_override`s are ignored.
        """
        pip = self._attached_instruments[mount]
        if pip is not None and cp_override != CriticalPoint.MOUNT:
            return pip.critical_point(cp_override)
        else:
            # This offset is required because the motor driver coordinate system is
            # configured such that the end of a p300 single gen1's tip is 0.
            return top_types.Point(0, 0, 30)

    @overload
    def instruments_for(self, mount: top_types.Mount) -> Tuple[PipetteHandlingData]:
        ...

    @overload
    def instruments_for(
        self, mount: PipettePair
    ) -> Tuple[PipetteHandlingData, PipetteHandlingData]:
        ...

    def instruments_for(self, mount):
        if isinstance(mount, PipettePair):
            primary_mount = mount.primary
            secondary_mount = mount.secondary
            instr1 = self._attached_instruments[primary_mount]
            instr2 = self._attached_instruments[secondary_mount]
            return ((instr1, primary_mount), (instr2, secondary_mount))
        else:
            primary_mount = mount
            instr1 = self._attached_instruments[primary_mount]
            return ((instr1, primary_mount),)

    def ready_for_pick_up_tip(self, targets: Sequence[PipetteHandlingData]):
        for pipettes in targets:
            if not pipettes[0]:
                raise top_types.PipetteNotAttachedError(
                    f"No pipette attached to {pipettes[1].name} mount"
                )
            if pipettes[0].has_tip:
                raise TipAttachedError("Cannot pick up tip with a tip attached")
            self._ihp_log.debug(f"Picking up tip on {pipettes[0].name}")

    def ready_for_tip_action(
        self, targets: Sequence[PipetteHandlingData], action: HardwareAction
    ):
        for pipettes in targets:
            if not pipettes[0]:
                raise top_types.PipetteNotAttachedError(
                    f"No pipette attached to {pipettes[1].name} mount"
                )
            if not pipettes[0].has_tip:
                raise NoTipAttachedError(
                    f"Cannot perform {action} without a tip attached"
                )
            if (
                action == HardwareAction.ASPIRATE
                and pipettes[0].current_volume == 0
                and not pipettes[0].ready_to_aspirate
            ):
                raise RuntimeError("Pipette not ready to aspirate")
            self._ihp_log.debug(f"{action} on {pipettes[0].name}")

    def plunger_position(
        self, instr: Pipette, ul: float, action: "UlPerMmAction"
    ) -> float:
        mm = ul / instr.ul_per_mm(ul, action)
        position = mm + instr.config.bottom
        return round(position, 6)

    def plunger_speed(
        self, instr: Pipette, ul_per_s: float, action: "UlPerMmAction"
    ) -> float:
        mm_per_s = ul_per_s / instr.ul_per_mm(instr.config.max_volume, action)
        return round(mm_per_s, 6)

    def plunger_flowrate(
        self, instr: Pipette, mm_per_s: float, action: "UlPerMmAction"
    ) -> float:
        ul_per_s = mm_per_s * instr.ul_per_mm(instr.config.max_volume, action)
        return round(ul_per_s, 6)

    @dataclass(frozen=True)
    class AspirateSpec:
        axis: Axis
        volume: float
        plunger_distance: float
        speed: float
        instr: Pipette
        current: float

    def plan_check_aspirate(
        self,
        mount: Union[top_types.Mount, PipettePair],
        volume: Optional[float],
        rate: float,
    ) -> Sequence["InstrumentHandlerProvider.AspirateSpec"]:
        """Check preconditions for aspirate, parse args, and calculate positions.

        While the mechanics of issuing an aspirate move itself are left to child
        classes, determining things like aspiration volume from the allowed argument
        types is invariant between machines, and this method gathers that functionality.

        Coalesce
        - Optional volumes
        - Pair/single aspiration

        Check
        - Aspiration volumes compared to max and remaining

        Calculate
        - Plunger distances (possibly calling an overridden plunger_volume)
        """
        instruments = self.instruments_for(mount)
        self.ready_for_tip_action(instruments, HardwareAction.ASPIRATE)
        if volume is None:
            self._ihp_log.debug(
                "No aspirate volume defined. Aspirating up to "
                "max_volume for the pipette"
            )
            asp_vol = tuple(instr[0].available_volume for instr in instruments)
        else:
            asp_vol = tuple(volume for instr in instruments)

        if all([vol == 0 for vol in asp_vol]):
            return []
        elif 0 in asp_vol:
            raise PairedPipetteConfigValueError("Cannot only aspirate from one pipette")

        for instr, vol in zip(instruments, asp_vol):
            assert instr[0].ok_to_add_volume(
                vol
            ), "Cannot aspirate more than pipette max volume"

        dist = tuple(
            self.plunger_position(instr[0], instr[0].current_volume + vol, "aspirate")
            for instr, vol in zip(instruments, asp_vol)
        )
        speed = min(
            self.plunger_speed(instr[0], instr[0].aspirate_flow_rate * rate, "aspirate")
            for instr in instruments
        )
        return [
            self.AspirateSpec(
                axis=Axis.of_plunger(instr[1]),
                volume=this_vol,
                plunger_distance=this_dist,
                speed=speed,
                instr=instr[0],
                current=instr[0].config.plunger_current,
            )
            for instr, this_dist, this_vol in zip(instruments, dist, asp_vol)
        ]
