"""Home command payload, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Sequence, Type
from typing_extensions import Literal

from ..types import MotorAxis
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import MovementHandler


HomeCommandType = Literal["home"]


class HomeParams(BaseModel):
    """Payload required for a Home command."""

    axes: Optional[Sequence[MotorAxis]] = Field(
        None,
        description=(
            "Axes to return to their home positions. If omitted,"
            " will home all motors. Extra axes may be implicitly homed"
            " to ensure accurate homing of the explicitly specified axes."
        ),
    )


class HomeResult(BaseModel):
    """Result data from the execution of a Home command."""


class HomeImplementation(AbstractCommandImpl[HomeParams, HomeResult]):
    """Home command implementation."""

    def __init__(self, movement: MovementHandler, **kwargs: object) -> None:
        self._movement = movement

    async def execute(self, params: HomeParams) -> HomeResult:
        """Home some or all motors to establish positional accuracy."""
        await self._movement.home(axes=params.axes)
        return HomeResult()


class Home(BaseCommand[HomeParams, HomeResult]):
    """Command to send some (or all) motors to their home positions.

    Homing a motor re-establishes positional accuracy the first time a motor
    is used, or any time the motor "loses" its position, for example, after
    a halt or after a collision.
    """

    commandType: HomeCommandType = "home"
    params: HomeParams
    result: Optional[HomeResult]

    _ImplementationCls: Type[HomeImplementation] = HomeImplementation


class HomeCreate(BaseCommandCreate[HomeParams]):
    """Data to create a Home command."""

    commandType: HomeCommandType = "home"
    params: HomeParams

    _CommandCls: Type[Home] = Home
