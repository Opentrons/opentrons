"""Command models for moving any robot axis to an absolute position."""
from __future__ import annotations
from typing import Literal, Optional, Type, TYPE_CHECKING
from pydantic import Field, BaseModel

from opentrons.protocol_engine.types import MotorAxis
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.resources import ensure_ot3_hardware

from .common import MotorAxisMapType, DestinationRobotPositionResult
from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)
from ...errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import GantryMover


MoveAxesToCommandType = Literal["robot/moveAxesTo"]


class MoveAxesToParams(BaseModel):
    """Payload required to move axes to absolute position."""

    axis_map: MotorAxisMapType = Field(
        ..., description="The specified axes to move to an absolute deck position with."
    )
    critical_point: Optional[MotorAxisMapType] = Field(
        default=None, description="The critical point to move the mount with."
    )
    speed: Optional[float] = Field(
        default=None,
        description="The max velocity to move the axes at. Will fall to hardware defaults if none provided.",
    )


class MoveAxesToResult(DestinationRobotPositionResult):
    """Result data from the execution of a MoveAxesTo command."""

    pass


class MoveAxesToImplementation(
    AbstractCommandImpl[MoveAxesToParams, SuccessData[MoveAxesToResult, None]]
):
    """MoveAxesTo command implementation."""

    def __init__(
        self,
        gantry_mover: GantryMover,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._gantry_mover = gantry_mover
        self._hardware_api = hardware_api

    async def execute(
        self, params: MoveAxesToParams
    ) -> SuccessData[MoveAxesToResult, None]:
        # TODO (lc 08-16-2024) implement `move_axes` for OT 2 hardware controller
        # and then we can remove this validation.
        ensure_ot3_hardware(self._hardware_api)
        current_position = await self._gantry_mover.move_axes(
            axis_map=params.axis_map,
            speed=params.speed,
            critical_point={MotorAxis.X: 0.0, MotorAxis.Y: 0.0, MotorAxis.Z_L: 0.0},
        )
        return SuccessData(
            public=MoveAxesToResult(position=current_position),
            private=None,
        )


class MoveAxesTo(BaseCommand[MoveAxesToParams, MoveAxesToResult, ErrorOccurrence]):
    """MoveAxesTo command model."""

    commandType: MoveAxesToCommandType = "robot/moveAxesTo"
    params: MoveAxesToParams
    result: Optional[MoveAxesToResult]

    _ImplementationCls: Type[MoveAxesToImplementation] = MoveAxesToImplementation


class MoveAxesToCreate(BaseCommandCreate[MoveAxesToParams]):
    """MoveAxesTo command request model."""

    commandType: MoveAxesToCommandType = "robot/moveAxesTo"
    params: MoveAxesToParams

    _CommandCls: Type[MoveAxesTo] = MoveAxesTo
