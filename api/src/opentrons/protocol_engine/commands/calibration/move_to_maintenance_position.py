"""Calibration Move To Maintenance Location command payload, result, and implementation models."""
from __future__ import annotations

import enum
from typing import TYPE_CHECKING, Type, Optional
from typing_extensions import Literal

from pydantic import BaseModel, Field

from opentrons.types import Point, MountType
from opentrons.hardware_control.types import CriticalPoint, OT3Mount
from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)

if TYPE_CHECKING:
    from opentrons.hardware_control import HardwareControlAPI
    from ...state import StateView


# These offsets are based on testing attach flows with 8/1 channel pipettes
_ATTACH_Y_OFFSET = 10
_INSTRUMENT_ATTACH_Z_OFFSET = 400
_PLATE_ATTACH_Z_OFFSET = 260

MoveToMaintenancePositionCommandType = Literal["calibration/moveToMaintenancePosition"]


class MaintenancePosition(str, enum.Enum):
    """Maintenance position options."""

    AttachPlate = "attachPlate"
    AttachInstrument = "attachInstrument"


class MoveToMaintenancePositionParams(BaseModel):
    """Calibration set up position command parameters."""

    mount: MountType = Field(
        ...,
        description="Gantry mount to move maintenance position.",
    )

    maintenancePosition: MaintenancePosition = Field(
        MaintenancePosition.AttachInstrument,
        description="The position the gantry mount needs to move to.",
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
        if params.maintenancePosition == MaintenancePosition.AttachInstrument:
            hardware_mount = OT3Mount.from_mount(params.mount)
            attach_offset = Point(y=_ATTACH_Y_OFFSET, z=_INSTRUMENT_ATTACH_Z_OFFSET)
        else:
            hardware_mount = OT3Mount.BOTH
            attach_offset = Point(y=_ATTACH_Y_OFFSET, z=_PLATE_ATTACH_Z_OFFSET)

        calibration_coordinates = self._state_view.labware.get_calibration_coordinates(
            offset=attach_offset
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
