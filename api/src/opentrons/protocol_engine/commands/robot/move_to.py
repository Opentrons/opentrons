from typing import Literal, Type, Optional, TYPE_CHECKING

from pydantic import BaseModel, Field
from opentrons.types import MountType
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.protocols.types import FlexRobotType

from ..pipetting_common import DestinationPositionResult
from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)
from opentrons.protocol_engine.types import DeckPoint
from opentrons.protocol_engine.errors.error_occurrence import ErrorOccurrence


if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import MovementHandler


MoveToCommandType = Literal["robot/moveTo"]


class MoveToParams(BaseModel):
    """Payload required to move to a destination position."""

    mount: MountType
    destination: DeckPoint = Field(
        ...,
        description="X, Y and Z coordinates in mm from deck's origin location (left-front-bottom corner of work space)",
    )
    speed: float


class MoveToResult(DestinationPositionResult):
    """Result data from the execution of a MoveTo command."""

    pass


class MoveToImplementation(
    AbstractCommandImpl[MoveToParams, SuccessData[MoveToResult, None]]
):
    """MoveTo command implementation."""

    def __init__(self, movement: MovementHandler, hardware_api: HardwareControlAPI, **kwargs: object) -> None:
        self._movement = movement
        self._hardware_api = hardware_api

    async def execute(self, params: MoveToParams) -> SuccessData[MoveToResult, None]:
        if self._hardware_api.get_robot_type() == FlexRobotType:
            x, y, z =  self._movement.move_axes(axis_map=params.axis_map, speed=params.speed, relative_move=True)
        else:
            x, y, z = self._movement.move_to(mount=params.mount, speed=params.speed)
        # x, y, z = self._hardware_api.move_to(
        #     params.mount, params.destination, params.velocity
        # )
        return SuccessData(
            public=MoveToResult(position=DeckPoint(x=x, y=y, z=z)),
            private=None,
        )


class MoveTo(BaseCommand[MoveToParams, MoveToResult, ErrorOccurrence]):
    """MoveTo command model."""

    commandType: MoveToCommandType = "robot/moveTo"
    params: MoveToParams
    result: Optional[MoveToResult]

    _ImplementationCls: Type[MoveToImplementation] = MoveToImplementation


class MoveToCreate(BaseCommandCreate[MoveToParams]):
    """MoveTo command request model."""

    commandType: MoveToCommandType = "robot/moveTo"
    params: MoveToParams

    _CommandCls: Type[MoveTo] = MoveTo
