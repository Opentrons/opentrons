"""Wait for duration command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import RunControlHandler


WaitForDurationCommandType = Literal["waitForDuration"]


class WaitForDurationParams(BaseModel):
    """Payload required to pause the protocol."""

    seconds: float = Field(..., description="Duration, in seconds, to wait for.")
    message: Optional[str] = Field(
        None,
        description="A user-facing message associated with the pause",
    )


class WaitForDurationResult(BaseModel):
    """Result data from the execution of a wait for duration command."""


class WaitForDurationImplementation(
    AbstractCommandImpl[WaitForDurationParams, WaitForDurationResult]
):
    """Wait for duration command implementation."""

    def __init__(self, run_control: RunControlHandler, **kwargs: object) -> None:
        self._run_control = run_control

    async def execute(self, params: WaitForDurationParams) -> WaitForDurationResult:
        """Wait for a duration of time."""
        await self._run_control.wait_for_duration(params.seconds)
        return WaitForDurationResult()


class WaitForDuration(BaseCommand[WaitForDurationParams, WaitForDurationResult]):
    """Wait for duration command model."""

    commandType: WaitForDurationCommandType = "waitForDuration"
    params: WaitForDurationParams
    result: Optional[WaitForDurationResult]

    _ImplementationCls: Type[
        WaitForDurationImplementation
    ] = WaitForDurationImplementation


class WaitForDurationCreate(BaseCommandCreate[WaitForDurationParams]):
    """Wait for duration command request model."""

    commandType: WaitForDurationCommandType = "waitForDuration"
    params: WaitForDurationParams

    _CommandCls: Type[WaitForDuration] = WaitForDuration
