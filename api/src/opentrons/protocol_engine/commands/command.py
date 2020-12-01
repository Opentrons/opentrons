"""Base command data model and type definitions."""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from pydantic import BaseModel
from typing import TYPE_CHECKING, Generic, TypeVar

from ..errors import ProtocolEngineError

# convenience type alias to work around type-only circular dependency
if TYPE_CHECKING:
    from ..execution import CommandHandlers
else:
    CommandHandlers = None

ReqT = TypeVar("ReqT", bound=BaseModel)
ResT = TypeVar("ResT", bound=BaseModel)


@dataclass(frozen=True)
class CompletedCommand(Generic[ReqT, ResT]):
    """A command that has been successfully executed."""

    created_at: datetime
    started_at: datetime
    completed_at: datetime
    request: ReqT
    result: ResT


@dataclass(frozen=True)
class FailedCommand(Generic[ReqT]):
    """A command that was executed but failed."""

    created_at: datetime
    started_at: datetime
    failed_at: datetime
    request: ReqT
    error: ProtocolEngineError


@dataclass(frozen=True)
class RunningCommand(Generic[ReqT, ResT]):
    """A command that is currently being executed."""

    created_at: datetime
    started_at: datetime
    request: ReqT

    def to_completed(
        self,
        result: ResT,
        completed_at: datetime,
    ) -> CompletedCommand[ReqT, ResT]:
        """Create a CompletedCommand from a RunningCommand."""
        return CompletedCommand(
            created_at=self.created_at,
            started_at=self.started_at,
            request=self.request,
            completed_at=completed_at,
            result=result
        )

    def to_failed(
        self,
        error: ProtocolEngineError,
        failed_at: datetime,
    ) -> FailedCommand[ReqT]:
        """Create a FailedCommand from a RunningCommand."""
        return FailedCommand(
            created_at=self.created_at,
            started_at=self.started_at,
            request=self.request,
            failed_at=failed_at,
            error=error
        )


@dataclass(frozen=True)
class PendingCommand(Generic[ReqT, ResT]):
    """A command that has not yet been started."""

    created_at: datetime
    request: ReqT

    def to_running(self, started_at: datetime) -> RunningCommand[ReqT, ResT]:
        """Create a RunningCommand from a PendingCommand."""
        return RunningCommand(
            created_at=self.created_at,
            request=self.request,
            started_at=started_at,
        )


class CommandImplementation(ABC, Generic[ReqT, ResT]):
    """
    Abstract command implementation.

    A given command request should map to a specific command implementation,
    which defines how to:

    - Create a command resource from the request model
    - Execute the command, mapping data from execution into the result model
    """

    _request: ReqT

    def __init__(self, request: ReqT) -> None:
        """Initialize a command implementation from a command request."""
        self._request = request

    def create_command(self, created_at: datetime) -> PendingCommand[ReqT, ResT]:
        """Create a new command resource from the implementation's request."""
        return PendingCommand(request=self._request, created_at=created_at)

    @abstractmethod
    async def execute(self, handlers: CommandHandlers) -> ResT:
        """Execute the command, mapping data from execution into a response model."""
        ...
