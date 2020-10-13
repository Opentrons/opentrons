"""Command model and type definitions."""
from dataclasses import dataclass
from datetime import datetime
from pydantic import BaseModel
from typing import Generic, TypeVar, Union
from typing_extensions import Literal

ReqT = TypeVar("ReqT", bound=BaseModel)
ResT = TypeVar("ResT", bound=BaseModel)


@dataclass
class CompletedCommand(Generic[ReqT, ResT]):
    createdAt: datetime
    startedAt: datetime
    completedAt: datetime
    request: ReqT
    result: ResT
    status: Literal["completed"] = "completed"


@dataclass
class RunningCommand(Generic[ReqT, ResT]):
    createdAt: datetime
    startedAt: datetime
    request: ReqT
    status: Literal["running"] = "running"

    def to_completed(
        self,
        completed_at: datetime,
        result: ResT
    ) -> CompletedCommand[ReqT, ResT]:
        return CompletedCommand(
            createdAt=self.createdAt,
            startedAt=self.startedAt,
            request=self.request,
            completedAt=completed_at,
            result=result
        )


@dataclass
class PendingCommand(Generic[ReqT, ResT]):
    createdAt: datetime
    request: ReqT
    status: Literal["pending"] = "pending"

    def to_running(self, started_at: datetime) -> RunningCommand[ReqT, ResT]:
        return RunningCommand(
            createdAt=self.createdAt,
            request=self.request,
            startedAt=started_at,
        )


BaseCommand = Union[
    PendingCommand[ReqT, ResT],
    RunningCommand[ReqT, ResT],
    CompletedCommand[ReqT, ResT]
]
