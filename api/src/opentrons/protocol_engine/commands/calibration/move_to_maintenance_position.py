"""Calibration Move To Maintenance Location command payload, result, and implementation models."""
from __future__ import annotations

from typing import TYPE_CHECKING, Type, Optional
from typing_extensions import Literal

from pydantic import BaseModel, Field

from opentrons.types import MountType, Point, Mount
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)

if TYPE_CHECKING:
    from opentrons.hardware_control import HardwareControlAPI
    from ...state import StateView
    from ...execution import MovementHandler


# Question (spp): Does this offset work for gripper mount too?
# These offsets are based on testing attach flows with 8/1 channel pipettes
_INSTRUMENT_ATTACH_POINT = Point(x=-13.775, y=84)
_INSTRUMENT_ATTACH_Z_HEIGHT = 400

MoveToMaintenancePositionCommandType = Literal["calibration/moveToMaintenancePosition"]


class MoveToMaintenancePositionParams(BaseModel):
    """Calibration set up position command parameters."""

    mount: MountType = Field(
        ...,
        description="Gantry mount to move maintenance position.",
    )


class MoveToMaintenancePositionResult(BaseModel):
    """Result data from the execution of a MoveToMaintenancePosition command."""


class MoveToMaintenancePositionImplementation(
    AbstractCommandImpl[
        MoveToMaintenancePositionParams, MoveToMaintenancePositionResult
    ]
):
    """Calibration set up position command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_view: StateView,
        movement: MovementHandler,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api
        self._movement = movement

    async def execute(
        self, params: MoveToMaintenancePositionParams
    ) -> MoveToMaintenancePositionResult:
        """Move the requested mount to a maintenance deck slot."""
        hardware_mount = params.mount.to_hw_mount()

        current_position = await self._hardware_api.gantry_position(Mount.LEFT)
        max_travel_z = self._hardware_api.get_instrument_max_height(Mount.LEFT)
        way_points = self._state_view.motion.get_movement_waypoints_to_coords(
            origin=current_position,
            dest=_INSTRUMENT_ATTACH_POINT,
            max_travel_z=max_travel_z,
            direct=False,
            additional_min_travel_z=None,
        )

        for waypoint in way_points:
            await self._hardware_api.move_to(
                mount=Mount.LEFT,
                abs_position=Point(
                    x=waypoint.position.x, y=waypoint.position.y, z=current_position.z
                ),
                critical_point=CriticalPoint.MOUNT,
            )

        current_position = await self._hardware_api.gantry_position(hardware_mount)

        await self._hardware_api.move_to(
            mount=hardware_mount,
            abs_position=Point(
                x=current_position.x,
                y=current_position.y,
                z=_INSTRUMENT_ATTACH_Z_HEIGHT,
            ),
            critical_point=CriticalPoint.MOUNT,
        )

        return MoveToMaintenancePositionResult()


class MoveToMaintenancePosition(
    BaseCommand[MoveToMaintenancePositionParams, MoveToMaintenancePositionResult]
):
    """Calibration set up position command model."""

    commandType: MoveToMaintenancePositionCommandType = (
        "calibration/moveToMaintenancePosition"
    )
    params: MoveToMaintenancePositionParams
    result: Optional[MoveToMaintenancePositionResult]

    _ImplementationCls: Type[
        MoveToMaintenancePositionImplementation
    ] = MoveToMaintenancePositionImplementation


class MoveToMaintenancePositionCreate(
    BaseCommandCreate[MoveToMaintenancePositionParams]
):
    """Calibration set up position command creation request model."""

    commandType: MoveToMaintenancePositionCommandType = (
        "calibration/moveToMaintenancePosition"
    )
    params: MoveToMaintenancePositionParams

    _CommandCls: Type[MoveToMaintenancePosition] = MoveToMaintenancePosition
