"""Retract Axis command payload, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, List, Type
from typing_extensions import Literal

from ..types import MotorAxis
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import MovementHandler

RetractAxisCommandType = Literal["retractAxis"]


class RetractAxisParams(BaseModel):
    """Payload required for a Retract Axis command."""

    axes: Optional[List[MotorAxis]] = Field(
        None,
        description=(
            "Axes to retract to their home positions."
            " If ommitted, will retract all motors."
            " The difference between retracting an axis and homing an axis using the"
            " home command is that a home will move the axis (slowly) until it finds"
            " the home limit switch, while retraction attempts to move the axis"
            " either to the previously recorded home position in case of the Flex,"
            " or a safe distance away from the previously recorded home position"
            " in the case of the OT-2."
        )
    )


class RetractAxisResult(BaseModel):
    """Result data from the execution of a Rectract Axis command."""


class RetractAxisImplementation(AbstractCommandImpl[RetractAxisParams, RetractAxisResult]):
    """Retract Axis command implementation."""

    def __init__(self, movement: MovementHandler, **kwargs: object) -> None:
        self._movement = movement

    async def execute(self, params: RetractAxisParams) -> RetractAxisResult:
        """Retract some or all axes."""
        await self._movement.retract_axis(axes=params.axes)
        return RetractAxisResult()

class RetractAxis(BaseCommand[RetractAxisParams, RetractAxisResult]):
    """Command to retract some or all axes near their home positions."""

    commandType = RetractAxisCommandType = "retractAxis"
    params = RetractAxisParams
    result = Optional[RetractAxisResult]

    _ImplementationCls: Type[RetractAxisImplementation] = RetractAxisImplementation


class RetractAxisCreate(BaseCommandCreate[RetractAxisParams]):
    """Data to create a Retract Axis command."""

    commandType = RetractAxisCommandType = "retractAxis"
    params = RetractAxisParams

    _CommandCls: Type[RetractAxis] = RetractAxis
