"""Calibration Move To Maintenance Location command payload, result, and implementation models."""
from __future__ import annotations

from typing import TYPE_CHECKING, Type, Optional
from typing_extensions import Literal

from pydantic import BaseModel, Field

from opentrons.types import MountType, Point
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)

if TYPE_CHECKING:
    from opentrons.hardware_control import HardwareControlAPI
    from ...state import StateView


# Question (spp): Does this offset work for gripper mount too?
# These offsets are based on testing attach flows with 8/1 channel pipettes
_INSTRUMENT_ATTACH_OFFSET = Point(y=10, z=400)

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
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api

    async def execute(
        self, params: MoveToMaintenancePositionParams
    ) -> MoveToMaintenancePositionResult:
        """Move the requested mount to a maintenance deck slot."""
        hardware_mount = params.mount.to_hw_mount()

        calibration_coordinates = self._state_view.labware.get_calibration_coordinates(
            offset=_INSTRUMENT_ATTACH_OFFSET
        )

        # NOTE(bc, 2023-05-10): this is a direct diagonal movement, an arc movement would be safer
        await self._hardware_api.move_to(
            mount=hardware_mount,
            abs_position=calibration_coordinates,
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
