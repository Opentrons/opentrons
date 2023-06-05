"""Calibration Move To Maintenance Location command payload, result, and implementation models."""
from __future__ import annotations

import enum
from typing import TYPE_CHECKING, Type, Optional
from typing_extensions import Literal

from pydantic import BaseModel, Field

from opentrons.types import MountType, Point, Mount
from opentrons.hardware_control.types import OT3Axis, CriticalPoint
from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware

if TYPE_CHECKING:
    from opentrons.hardware_control import HardwareControlAPI
    from ...state import StateView


# These offsets supplied from HW
_ATTACH_POINT = Point(x=0, y=100)
# These offsets are by eye measuring
_INSTRUMENT_ATTACH_Z_POINT = 400.0
_PLATE_ATTACH_Z_LEFT_POINT = 295
# Move the right mount a bit higher than the left so the user won't forget to unscrew
_PLATE_ATTACH_Z_RIGHT_POINT = 320

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
        current_position = await ot3_api.gantry_position(Mount.LEFT)
        max_travel_z = ot3_api.get_instrument_max_height(Mount.LEFT)
        way_points = self._state_view.motion.get_movement_waypoints_to_coords(
            origin=current_position,
            dest=_ATTACH_POINT,
            max_travel_z=max_travel_z,
            direct=False,
            additional_min_travel_z=None,
        )

        for waypoint in way_points:
            await ot3_api.move_to(
                mount=Mount.LEFT,
                abs_position=Point(
                    x=waypoint.position.x, y=waypoint.position.y, z=current_position.z
                ),
                critical_point=CriticalPoint.MOUNT,
            )

        if params.maintenancePosition == MaintenancePosition.AttachInstrument:
            mount_to_axis = OT3Axis.by_mount(params.mount.to_hw_mount())
            await ot3_api.move_axes(
                {
                    mount_to_axis: _INSTRUMENT_ATTACH_Z_POINT,
                }
            )
        else:
            await ot3_api.move_axes(
                {
                    OT3Axis.Z_L: _PLATE_ATTACH_Z_LEFT_POINT,
                    OT3Axis.Z_R: _PLATE_ATTACH_Z_RIGHT_POINT,
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
