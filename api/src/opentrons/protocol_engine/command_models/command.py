"""Command model and type definitions."""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from pydantic import BaseModel
from typing import Generic, TypeVar, Union

from ..errors import ProtocolEngineError

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
        return RunningCommand(
            created_at=self.created_at,
            request=self.request,
            started_at=started_at,
        )


GenericCommandType = Union[
    PendingCommand[ReqT, ResT],
    RunningCommand[ReqT, ResT],
    CompletedCommand[ReqT, ResT],
    FailedCommand[ReqT]
]
