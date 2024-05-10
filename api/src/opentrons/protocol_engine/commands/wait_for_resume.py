"""Wait for resume command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..execution import RunControlHandler


# NOTE: multiple values accepted for backwards compatibility
# with the 6.0.0-beta.0 release, which used `pause`
WaitForResumeCommandType = Literal["waitForResume", "pause"]


class WaitForResumeParams(BaseModel):
    """Payload required to pause the protocol."""

    message: Optional[str] = Field(
        None,
        description="A user-facing message associated with the pause",
    )


class WaitForResumeResult(BaseModel):
    """Result data from the execution of a WaitForResume command."""


class WaitForResumeImplementation(
    AbstractCommandImpl[WaitForResumeParams, SuccessData[WaitForResumeResult, None]]
):
    """Wait for resume command implementation."""

    def __init__(self, run_control: RunControlHandler, **kwargs: object) -> None:
        self._run_control = run_control

    async def execute(
        self, params: WaitForResumeParams
    ) -> SuccessData[WaitForResumeResult, None]:
        """Dispatch a PauseAction to the store to pause the protocol."""
        await self._run_control.wait_for_resume()
        return SuccessData(public=WaitForResumeResult(), private=None)


class WaitForResume(
    BaseCommand[WaitForResumeParams, WaitForResumeResult, ErrorOccurrence]
):
    """Wait for resume command model."""

    commandType: WaitForResumeCommandType = "waitForResume"
    params: WaitForResumeParams
    result: Optional[WaitForResumeResult]

    _ImplementationCls: Type[WaitForResumeImplementation] = WaitForResumeImplementation


class WaitForResumeCreate(BaseCommandCreate[WaitForResumeParams]):
    """Wait for resume command request model."""

    commandType: WaitForResumeCommandType = "waitForResume"
    params: WaitForResumeParams

    _CommandCls: Type[WaitForResume] = WaitForResume
