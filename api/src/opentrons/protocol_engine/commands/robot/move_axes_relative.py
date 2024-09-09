from typing import Literal, Type, Optional, TYPE_CHECKING

from pydantic import BaseModel, Field
from opentrons.types import AxisMapType
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.protocols.types import FlexRobotType

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)
from ...errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import MovementHandler


MoveAxesRelativeCommandType = Literal["robot/moveAxesRelative"]


class MoveAxesRelativeParams(BaseModel):
    """Payload required to move axes relative to position."""

    axis_map: AxisMapType = Field(..., description="A dictionary mapping axes to relative movements in mm.")
    speed: float


class MoveAxesRelativeResult(BaseModel):
    """Result data from the execution of a MoveAxesRelative command."""

    pass


class MoveAxesRelativeImplementation(
    AbstractCommandImpl[
        MoveAxesRelativeParams, SuccessData[MoveAxesRelativeResult, None]
    ]
):
    """MoveAxesRelative command implementation."""

    def __init__(self, hardware_api: HardwareControlAPI, **kwargs: object) -> None:
        self._hardware_api = hardware_api

    async def execute(
        self, params: MoveAxesRelativeParams
    ) -> SuccessData[MoveAxesRelativeResult, None]:
        if self._hardware_api.get_robot_type() == FlexRobotType:
            self._movement.move_axes(axis_map=params.axis_map, speed=params.speed, relative_move=True)
        else:
            self._movement.move_relative(axis_map=params.axis_map, speed=params.speed)


class MoveAxesRelative(
    BaseCommand[MoveAxesRelativeParams, MoveAxesRelativeResult, ErrorOccurrence]
):
    """MoveAxesRelative command model."""

    commandType: MoveAxesRelativeCommandType = "robot/moveAxesRelative"
    params: MoveAxesRelativeParams
    result: Optional[MoveAxesRelativeResult]

    _ImplementationCls: Type[
        MoveAxesRelativeImplementation
    ] = MoveAxesRelativeImplementation


class MoveAxesRelativeCreate(BaseCommandCreate[MoveAxesRelativeParams]):
    """MoveAxesRelative command request model."""

    commandType: MoveAxesRelativeCommandType = "robot/moveAxesRelative"
    params: MoveAxesRelativeParams

    _CommandCls: Type[MoveAxesRelative] = MoveAxesRelative
