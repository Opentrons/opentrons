"""Command model and type definitions."""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from pydantic import BaseModel
from typing import cast, Generic, TypeVar, Union
from typing_extensions import Literal

from ..errors import ProtocolEngineError, ProtocolEngineErrorType

ReqT = TypeVar("ReqT", bound=BaseModel)
ResT = TypeVar("ResT", bound=BaseModel)


@dataclass
class CompletedCommand(Generic[ReqT, ResT]):
    uid: str
    createdAt: datetime
    startedAt: datetime
    completedAt: datetime
    request: ReqT
    result: ResT
    status: Literal["completed"] = "completed"


@dataclass
class FailedCommand(Generic[ReqT]):
    uid: str
    createdAt: datetime
    startedAt: datetime
    failedAt: datetime
    request: ReqT
    error: ProtocolEngineErrorType
    status: Literal["failed"] = "failed"


@dataclass
class RunningCommand(Generic[ReqT, ResT]):
    uid: str
    createdAt: datetime
    startedAt: datetime
    request: ReqT
    status: Literal["running"] = "running"

    def to_completed(
        self,
        result: ResT,
        completed_at: datetime,
    ) -> CompletedCommand[ReqT, ResT]:
        return CompletedCommand(
            uid=self.uid,
            createdAt=self.createdAt,
            startedAt=self.startedAt,
            request=self.request,
            completedAt=completed_at,
            result=result
        )

    def to_failed(
        self,
        error: ProtocolEngineError,
        failed_at: datetime,
    ) -> FailedCommand[ReqT]:
        return FailedCommand(
            uid=self.uid,
            createdAt=self.createdAt,
            startedAt=self.startedAt,
            request=self.request,
            failedAt=failed_at,
            error=cast(ProtocolEngineErrorType, error)
        )


@dataclass
class PendingCommand(Generic[ReqT, ResT]):
    uid: str
    createdAt: datetime
    request: ReqT
    status: Literal["pending"] = "pending"

    def to_running(self, started_at: datetime) -> RunningCommand[ReqT, ResT]:
        return RunningCommand(
            uid=self.uid,
            createdAt=self.createdAt,
            request=self.request,
            startedAt=started_at,
        )


GenericCommandType = Union[
    PendingCommand[ReqT, ResT],
    RunningCommand[ReqT, ResT],
    CompletedCommand[ReqT, ResT],
    FailedCommand[ReqT]
]
