"""Command model and type definitions."""
from dataclasses import dataclass
from datetime import datetime
from pydantic import BaseModel
from typing import Generic, TypeVar, Union
from typing_extensions import Literal

ReqT = TypeVar('ReqT', bound=BaseModel)
ResT = TypeVar('ResT', bound=BaseModel)


@dataclass
class PendingCommand(Generic[ReqT]):
    status: Literal['pending']
    createdAt: datetime
    request: ReqT


@dataclass
class RunningCommand(Generic[ReqT]):
    status: Literal['running']
    createdAt: datetime
    startedAt: datetime
    request: ReqT


@dataclass
class CompletedCommand(Generic[ReqT, ResT]):
    status: Literal['completed']
    createdAt: datetime
    startedAt: datetime
    completedAt: datetime
    request: ReqT
    result: ResT


BaseCommand = Union[
    PendingCommand[ReqT],
    RunningCommand[ReqT],
    CompletedCommand[ReqT, ResT]
]
