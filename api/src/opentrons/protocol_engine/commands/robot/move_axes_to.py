from typing import Literal, Dict, Optional, Type, TYPE_CHECKING
from pydantic import Field, BaseModel

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.protocols.types import FlexRobotType
  
from ..pipetting_common import DestinationPositionResult
from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)
from ...errors.error_occurrence import ErrorOccurrence
from ...types import DeckPoint

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution.movement import MovementHandler


MoveAxesToCommandType = Literal["robot/moveAxesTo"]


class MoveAxesToParams(BaseModel):
    """Payload required to move axes to absolute position."""

    axis_map: Dict[str, float] = Field(
        ..., description="The specified axes to move to an absolute deck position with."
    )
    critical_point: Dict[str, float] = Field(
        ..., description="The critical point to move the mount with."
    )
    velocity: Optional[float] = Field(
        default=None,
        description="The max velocity to move the axes at. Will fall to hardware defaults if none provided.",
    )


class MoveAxesToResult(DestinationPositionResult):
    """Result data from the execution of a MoveAxesTo command."""

    pass


class MoveAxesToImplementation(
    AbstractCommandImpl[MoveAxesToParams, SuccessData[MoveAxesToResult, None]]
):
    """MoveAxesTo command implementation."""

    def __init__(
        self,
        # movement: MovementHandler,
        hardware_api: HardwareControlAPI,
        **kwargs: object
    ) -> None:
        # self._movement = movement
        self._hardware_api = hardware_api

    async def execute(
        self, params: MoveAxesToParams
    ) -> SuccessData[MoveAxesToResult, None]:
        if self._hardware_api.get_robot_type() == FlexRobotType:
            self._movement.move_axes(axis_map=params.axis_map, speed=params.speed, relative_move=True)
        else:
            self._movement.move_to(mount=params.mount, speed=params.speed)
        # x, y, z = self._movement.move_to_with_mount(
        #     params.axis_map, params.critical_point, params.velocity
        # )
        x, y, z = (0, 0, 0)
        return SuccessData(
            public=MoveAxesToResult(position=DeckPoint(x=x, y=y, z=z)),
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
