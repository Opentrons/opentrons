"""Pause protocol command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Type
from typing_extensions import Literal

from .command import AbstractCommandImpl, BaseCommand, BaseCommandRequest


PauseCommandType = Literal["pause"]


class PauseData(BaseModel):
    """Data required to pause the protocol."""

    message: Optional[str] = Field(
        None,
        description="A user-facing message associated with the pause",
    )


class PauseResult(BaseModel):
    """Result data from the execution of a Pause command."""

    pass


class PauseImplementation(AbstractCommandImpl[PauseData, PauseResult]):
    """Pause command implementation."""

    async def execute(self, data: PauseData) -> PauseResult:
        """Dispatch a PauseAction to the store to pause the protocol."""
        await self._run_control.pause()
        return PauseResult()


class Pause(BaseCommand[PauseData, PauseResult]):
    """Pause command model."""

    commandType: PauseCommandType = "pause"
    data: PauseData
    result: Optional[PauseResult]

    _ImplementationCls: Type[PauseImplementation] = PauseImplementation


class PauseRequest(BaseCommandRequest[PauseData]):
    """Pause command request model."""

    commandType: PauseCommandType = "pause"
    data: PauseData

    _CommandCls: Type[Pause] = Pause
