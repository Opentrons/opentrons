"""Command model and type definitions."""
from datetime import datetime
from pydantic import BaseModel
from pydantic.generics import GenericModel
from typing import Generic, TypeVar, Union
from typing_extensions import Literal

ReqT = TypeVar('ReqT', bound=BaseModel)
ResT = TypeVar('ResT', bound=BaseModel)


class PendingCommand(GenericModel, Generic[ReqT]):
    status: Literal['pending']
    createdAt: datetime
    request: ReqT


class RunningCommand(GenericModel, Generic[ReqT]):
    status: Literal['running']
    createdAt: datetime
    startedAt: datetime
    request: ReqT


class CompletedCommand(GenericModel, Generic[ReqT, ResT]):
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
