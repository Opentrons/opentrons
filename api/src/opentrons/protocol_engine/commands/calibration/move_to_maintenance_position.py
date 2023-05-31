"""Calibration Move To Maintenance Location command payload, result, and implementation models."""
from __future__ import annotations

import logging
import enum
from typing import TYPE_CHECKING, Type, Optional
from typing_extensions import Literal

from pydantic import BaseModel, Field

from opentrons.types import MountType, Point
from opentrons.hardware_control.types import CriticalPoint, OT3Axis
from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware
from opentrons.hardware_control.ot3api import OT3API

if TYPE_CHECKING:
    from opentrons.hardware_control import HardwareControlAPI
    from ...state import StateView


logger = logging.getLogger(__name__)

# These offsets are based on testing attach flows with 8/1 channel pipettes
_ATTACH_OFFSET = Point(x=-13.775, y=84)
_INSTRUMENT_ATTACH_Z_OFFSET = 400.0
_PLATE_ATTACH_Z_OFFSET = 260.0

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
        ot3_api = ensure_ot3_hardware(
            self._hardware_api,
        )
        logger.info(f"is instance OT3API: {isinstance(self._hardware_api, OT3API)}")
        if params.maintenancePosition == MaintenancePosition.AttachInstrument:

            # NOTE(bc, 2023-05-10): this is a direct diagonal movement, an arc movement would be safer
            await ot3_api.move_axes(
                {
                    OT3Axis.X: _ATTACH_OFFSET.x,
                    OT3Axis.Y: _ATTACH_OFFSET.y,
                    OT3Axis.by_mount(
                        params.mount.to_hw_mount()
                    ): _INSTRUMENT_ATTACH_Z_OFFSET,
                }
            )
        else:
            await ot3_api.move_axes(
                {
                    OT3Axis.X: _ATTACH_OFFSET.x,
                    OT3Axis.Y: _ATTACH_OFFSET.y,
                    OT3Axis.Z_L: _PLATE_ATTACH_Z_OFFSET,
                    OT3Axis.Z_R: _PLATE_ATTACH_Z_OFFSET,
                }
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
