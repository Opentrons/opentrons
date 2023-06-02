"""Calibration Move To Maintenance Location command payload, result, and implementation models."""
from __future__ import annotations

import logging
import enum
from typing import TYPE_CHECKING, Type, Optional
from typing_extensions import Literal

from pydantic import BaseModel, Field

from opentrons.types import MountType, Point
from opentrons.hardware_control.types import OT3Axis
from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware

if TYPE_CHECKING:
    from opentrons.hardware_control import HardwareControlAPI
    from ...state import StateView


logger = logging.getLogger(__name__)

# These offsets supplied from HW
_ATTACH_POINT = Point(x=0, y=100)
# These offsets are by eye
_INSTRUMENT_ATTACH_Z_POINT = 400.0
_PLATE_ATTACH_Z_POINT = 300

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
        if params.maintenancePosition == MaintenancePosition.AttachInstrument:
            mount_to_axis = OT3Axis.by_mount(params.mount.to_hw_mount())
            logger.info(f"mount_to_axis {mount_to_axis}")
            # NOTE(bc, 2023-05-10): this is a direct diagonal movement, an arc movement would be safer
            await ot3_api.move_axes(
                {
                    OT3Axis.Y: _ATTACH_POINT.y,
                    OT3Axis.X: _ATTACH_POINT.x,
                    mount_to_axis: _INSTRUMENT_ATTACH_Z_POINT,
                }
            )
        else:
            # TODO (tz, 6-2-2023): Change this to one call to move_axes with both
            #  Z_L and Z_R once head firmware allows moving both mounts the the same time
            await ot3_api.move_axes(
                {
                    OT3Axis.Y: _ATTACH_POINT.y,
                    OT3Axis.X: _ATTACH_POINT.x,
                    OT3Axis.Z_L: _PLATE_ATTACH_Z_POINT,
                }
            )
            await ot3_api.move_axes(
                {
                    OT3Axis.Y: _ATTACH_POINT.y,
                    OT3Axis.X: _ATTACH_POINT.x,
                    OT3Axis.Z_R: _PLATE_ATTACH_Z_POINT,
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
