"""Shared code for managing pipette configuration and storage."""
from dataclasses import dataclass
import logging
from typing import (
    Callable,
    Dict,
    Generic,
    Optional,
    Tuple,
    Any,
    cast,
    List,
    Sequence,
    Iterator,
    TypeVar,
    overload,
)
import numpy

from opentrons_shared_data.errors.exceptions import (
    UnexpectedTipRemovalError,
    UnexpectedTipAttachError,
)
from opentrons_shared_data.pipette.dev_types import UlPerMmAction
from opentrons_shared_data.pipette.types import Quirks
from opentrons_shared_data.errors.exceptions import CommandPreconditionViolated

from opentrons import types as top_types
from opentrons.hardware_control.types import (
    CriticalPoint,
    HardwareAction,
    Axis,
    OT3Mount,
)
from opentrons.hardware_control.constants import (
    SHAKE_OFF_TIPS_SPEED,
    SHAKE_OFF_TIPS_PICKUP_DISTANCE,
    DROP_TIP_RELEASE_DISTANCE,
    SHAKE_OFF_TIPS_DROP_DISTANCE,
)

from opentrons.hardware_control.dev_types import PipetteDict
from .pipette import Pipette

from .pipette_handler import PipetteHandlerProvider
from .gripper_handler import GripperHandlerProvider


class InstrumentHandlerProvider(Generic[MountType]):
    # Take in optional inheritance
    def __init__(self, attached_instruments: InstrumentsByMount[MountType]):
        self._attached_instruments: InstrumentsByMount[MountType] = attached_instruments
        self._ihp_log = InstrumentHandlerProvider.IHP_LOG.getChild(str(id(self)))
        PipetteHandlerProvider.__init__(
            self, attached_instruments
        )
        if isinstance(list(attached_instruments.keys())[0], OT3Mount):
            GripperHandlerProvider.__init__(self, attached_instruments[OT3Mount.GRIPPER])

    def get_instrument(self, mount: MountType) -> Pipette:
        instr = self._attached_instruments[mount]
        if not instr:
            raise top_types.PipetteNotAttachedError(
                f"No pipette attached to {mount.name} mount"
            )
        return instr

    @overload
    def critical_point_for(self, mount: top_types.Mount, cp_override: Optional[CriticalPoint] = None) -> top_types.Point:
        ...
    
    @overload
    def critical_point_for(self, mount: OT3Mount, cp_override: Optional[CriticalPoint] = None) -> top_types.Point:
        ...

    def critical_point_for(
        self, mount, cp_override = None
    ) -> top_types.Point:
        """Return the current critical point of the specified mount.

        The mount's critical point is the position of the mount itself, if no
        pipette is attached, or the pipette's critical point (which depends on
        tip status).

        If `cp_override` is specified, and that critical point actually exists,
        it will be used instead. Invalid `cp_override`s are ignored.
        """
        instr = self._attached_instruments[mount]
        if instr is not None and cp_override != CriticalPoint.MOUNT:
            return instr.critical_point(cp_override)
        else:
            if isinstance(mount, top_types.Mount):
                # This offset is required because the motor driver coordinate system is
                # configured such that the end of a p300 single gen1's tip is 0.
                return top_types.Point(0, 0, 30)
            else:
                return top_types.Point(0, 0, 0)

    def instrument_max_height(
        self,
        mount: MountType,
        retract_distance: float,
        critical_point: Optional[CriticalPoint],
    ) -> float:
        """Return max achievable height of the attached instrument
        based on the current critical point
        """
        pip = self.get_instrument(mount)
        cp = self.critical_point_for(mount, critical_point)

        max_height = (
            pip.config.mount_configurations.homePosition - retract_distance + cp.z
        )

        return max_height

    async def reset(self) -> None:
            self._attached_instruments = {
                k: None for k in self._attached_instruments.keys()
            }

    def reset_instrument(self, mount: Optional[MountType] = None) -> None:
        """
        Reset the internal state of a pipette by its mount, without doing
        any lower level reconfiguration. This is useful to make sure that no
        settings changes from a protocol persist.

        :param mount: If specified, reset that mount. If not specified,
                      reset both
        """

        def _reset(m: MountType) -> None:
            if isinstance(m, top_types.Mount) and m not in top_types.Mount.ot2_mounts():
                self._ihp_log.warning(
                    "Received a non OT2 mount for resetting. Skipping"
                )
                return
            self._ihp_log.info(f"Resetting configuration for {m}")
            p = self._attached_instruments[m]
            if not p:
                return
            if isinstance(m, OT3Mount):
                # This is to satisfy lint. Code will be cleaner once
                # we can combine the pipette handler for OT2 and OT3
                # pipettes again.
                p.reset_pipette_offset(m.to_mount(), to_default=False)
            else:
                p.reset_pipette_offset(m, to_default=False)
            p.reload_configurations()
            p.reset_state()

        if not mount:
            for m in type(list(self._attached_instruments.keys())[0]):
                _reset(m)
        else:
            _reset(mount)

    def reset_instrument_offset(self, mount: MountType, to_default: bool) -> None:
        """
        Temporarily reset the pipette offset to default values.
        :param mount: Modify the given mount.
        """
        if isinstance(mount, OT3Mount):
            # This is to satisfy lint. Code will be cleaner once
            # we can combine the pipette handler for OT2 and OT3
            # pipettes again.
            pipette = self.get_instrument(mount)
            pipette.reset_pipette_offset(mount.to_mount(), to_default)
        else:
            pipette = self.get_instrument(mount)
            pipette.reset_pipette_offset(mount, to_default)

    def save_instrument_offset(self, mount: MountType, delta: top_types.Point) -> None:
        """
        Save a new instrument offset the pipette offset to a particular value.
        :param mount: Modify the given mount.
        :param delta: The offset to set for the pipette.
        """
        if isinstance(mount, OT3Mount):
            # This is to satisfy lint. Code will be cleaner once
            # we can combine the pipette handler for OT2 and OT3
            # pipettes again.
            pipette = self.get_instrument(mount)
            pipette.save_pipette_offset(mount.to_mount(), delta)
        else:
            pipette = self.get_instrument(mount)
            pipette.save_pipette_offset(mount, delta)

    # TODO(mc, 2022-01-11): change returned map value type to `Optional[PipetteDict]`
    # instead of potentially returning an empty dict
    def get_attached_instruments(self) -> Dict[MountType, PipetteDict]:
        """Get the status dicts of the cached attached instruments.

        Also available as :py:meth:`get_attached_instruments`.

        This returns a dictified version of the
        :py:class:`hardware_control.instruments.pipette.Pipette` as a dict keyed by
        the :py:class:`top_types.Mount` to which the pipette is attached.
        If no pipette is attached on a given mount, the mount key will
        still be present but will have the value ``None``.

        Note that this is only a query of a cached value; to actively scan
        for changes, use :py:meth:`cache_instruments`. This process deactivates
        the motors and should be used sparingly.
        """
        return {
            m: self.get_attached_instrument(m)
            for m in self._attached_instruments.keys()
        }

    # TODO(mc, 2022-01-11): change return type to `Optional[PipetteDict]` instead
    # of potentially returning an empty dict
    def get_attached_instrument(self, mount: MountType) -> PipetteDict:
        instr = self._attached_instruments[mount]
        result: Dict[str, Any] = {}
        if instr:
            configs = [
                "name",
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
                "supported_tips",
            ]

            instr_dict = instr.as_dict()
            # TODO (spp, 2021-08-27): Revisit this logic. Why do we need to build
            #  this dict newly every time? Any why only a few items are being updated?
            for key in configs:
                result[key] = instr_dict[key]
            result["current_nozzle_map"] = instr.nozzle_manager.current_configuration
            result["min_volume"] = instr.liquid_class.min_volume
            result["max_volume"] = instr.liquid_class.max_volume
            result["channels"] = instr.channels
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
            # TODO (12-5-2022) figure out why this is using default aspirate flow rate
            # rather than default dispense flow rate.
            result["default_blow_out_speeds"] = {
                alvl: self.plunger_speed(instr, fr, "blowout")
                for alvl, fr in instr.blow_out_flow_rates_lookup.items()
            }

            result["default_dispense_speeds"] = {
                alvl: self.plunger_speed(instr, fr, "dispense")
                for alvl, fr in instr.dispense_flow_rates_lookup.items()
            }
            result["default_aspirate_speeds"] = {
                alvl: self.plunger_speed(instr, fr, "aspirate")
                for alvl, fr in instr.aspirate_flow_rates_lookup.items()
            }
        return cast(PipetteDict, result)

    @property
    def attached_instruments(self) -> Dict[MountType, PipetteDict]:
        return self.get_attached_instruments()

    @property
    def attached_pipettes(self) -> Dict[MountType, PipetteDict]:
        return self.get_attached_instruments()

    @property
    def get_attached_pipettes(self) -> Dict[MountType, PipetteDict]:
        return self.get_attached_instruments()

    @property
    def hardware_instruments(self) -> InstrumentsByMount[MountType]:
        """Do not write new code that uses this."""
        return self._attached_instruments
