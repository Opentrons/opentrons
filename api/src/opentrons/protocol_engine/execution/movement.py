"""Movement command handling."""
from __future__ import annotations

from typing import Dict, Optional, Sequence
from dataclasses import dataclass

from opentrons.types import Point
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import (
    CriticalPoint,
    Axis as HardwareAxis,
    MustHomeError as HardwareMustHomeError,
)

from ..types import WellLocation, DeckPoint, MovementAxis, MotorAxis
from ..state import StateStore, CurrentWell
from ..errors import MustHomeError
from ..resources import ModelUtils
from .thermocycler_movement_flagger import ThermocyclerMovementFlagger


MOTOR_AXIS_TO_HARDWARE_AXIS: Dict[MotorAxis, HardwareAxis] = {
    MotorAxis.X: HardwareAxis.X,
    MotorAxis.Y: HardwareAxis.Y,
    MotorAxis.LEFT_Z: HardwareAxis.Z,
    MotorAxis.RIGHT_Z: HardwareAxis.A,
    MotorAxis.LEFT_PLUNGER: HardwareAxis.B,
    MotorAxis.RIGHT_PLUNGER: HardwareAxis.C,
}


@dataclass(frozen=True)
class SavedPositionData:
    """The result of a save position procedure."""

    positionId: str
    position: DeckPoint


@dataclass(frozen=True)
class MoveRelativeData:
    """The result of a relative movement procedure."""

    position: DeckPoint


class MovementHandler:
    """Implementation logic for gantry movement."""

    _state_store: StateStore
    _hardware_api: HardwareControlAPI
    _model_utils: ModelUtils

    def __init__(
        self,
        state_store: StateStore,
        hardware_api: HardwareControlAPI,
        model_utils: Optional[ModelUtils] = None,
        thermocycler_movement_flagger: Optional[ThermocyclerMovementFlagger] = None,
    ) -> None:
        """Initialize a MovementHandler instance."""
        self._state_store = state_store
        self._hardware_api = hardware_api
        self._model_utils = model_utils or ModelUtils()
        self._tc_movement_flagger = (
            thermocycler_movement_flagger
            or ThermocyclerMovementFlagger(
                state_store=self._state_store, hardware_api=self._hardware_api
            )
        )

    async def move_to_well(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: Optional[WellLocation] = None,
        current_well: Optional[CurrentWell] = None,
    ) -> None:
        """Move to a specific well."""
        await self._tc_movement_flagger.raise_if_labware_in_non_open_thermocycler(
            labware_id=labware_id
        )

        # get the pipette's mount and current critical point, if applicable
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
            current_well=current_well,
        )
        hw_mount = pipette_location.mount.to_hw_mount()
        origin_cp = pipette_location.critical_point

        # get the origin of the movement from the hardware controller
        origin = await self._hardware_api.gantry_position(
            mount=hw_mount,
            critical_point=origin_cp,
        )
        max_travel_z = self._hardware_api.get_instrument_max_height(mount=hw_mount)

        # calculate the movement's waypoints
        waypoints = self._state_store.motion.get_movement_waypoints(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            origin=origin,
            origin_cp=origin_cp,
            max_travel_z=max_travel_z,
            current_well=current_well,
        )

        # move through the waypoints
        for wp in waypoints:
            await self._hardware_api.move_to(
                mount=hw_mount,
                abs_position=wp.position,
                critical_point=wp.critical_point,
            )

    async def move_relative(
        self,
        pipette_id: str,
        axis: MovementAxis,
        distance: float,
    ) -> MoveRelativeData:
        """Move a given pipette a relative amount in millimeters."""
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
        )
        pip_cp = pipette_location.critical_point
        hw_mount = pipette_location.mount.to_hw_mount()
        delta = Point(
            x=distance if axis == MovementAxis.X else 0,
            y=distance if axis == MovementAxis.Y else 0,
            z=distance if axis == MovementAxis.Z else 0,
        )

        try:
            await self._hardware_api.move_rel(
                mount=hw_mount,
                delta=delta,
                fail_on_not_homed=True,
            )
            point = await self._hardware_api.gantry_position(
                mount=hw_mount,
                critical_point=pip_cp,
                fail_on_not_homed=True,
            )

        except HardwareMustHomeError as e:
            raise MustHomeError(str(e)) from e

        return MoveRelativeData(
            position=DeckPoint(x=point.x, y=point.y, z=point.z),
        )

    async def save_position(
        self,
        pipette_id: str,
        position_id: Optional[str],
    ) -> SavedPositionData:
        """Get the pipette position and save to state."""
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
        )

        hw_mount = pipette_location.mount.to_hw_mount()
        pip_cp = pipette_location.critical_point
        if pip_cp is None:
            hw_pipette = self._state_store.pipettes.get_hardware_pipette(
                pipette_id=pipette_id,
                attached_pipettes=self._hardware_api.attached_instruments,
            )
            if hw_pipette.config.get("tip_length"):
                pip_cp = CriticalPoint.TIP
            else:
                pip_cp = CriticalPoint.NOZZLE

        try:
            point = await self._hardware_api.gantry_position(
                mount=hw_mount,
                critical_point=pip_cp,
                fail_on_not_homed=True,
            )
        except HardwareMustHomeError as e:
            raise MustHomeError(str(e)) from e

        position_id = position_id or self._model_utils.generate_id()

        return SavedPositionData(
            positionId=position_id,
            position=DeckPoint(x=point.x, y=point.y, z=point.z),
        )

    async def home(self, axes: Optional[Sequence[MotorAxis]]) -> None:
        """Send the requested axes to their "home" positions.

        If axes is `None`, will home all motors.
        """
        hardware_axes = None
        if axes is not None:
            hardware_axes = [MOTOR_AXIS_TO_HARDWARE_AXIS[a] for a in axes]

        await self._hardware_api.home(axes=hardware_axes)
