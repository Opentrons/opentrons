"""Command model base classes.

These classes should not be used directly.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel
from typing import TYPE_CHECKING, ClassVar, Generic, Optional, TypeVar

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import CommandHandlers


CommandDataT = TypeVar("CommandDataT", bound=BaseModel)

CommandResultT = TypeVar("CommandResultT", bound=BaseModel)


class CommandStatus(str, Enum):
    """Command execution status."""

    QUEUED = "queued"
    RUNNING = "running"
    EXECUTED = "executed"
    FAILED = "failed"


class BaseCommandImpl(ABC, Generic[CommandDataT, CommandResultT]):
    """Interface defining a command's execution procedure."""

    # TODO(mc, 2021-06-08): move handlers to __init__
    @abstractmethod
    async def execute(
        self,
        data: CommandDataT,
        handlers: CommandHandlers,
    ) -> CommandResultT:
        """Execute the command, mapping data from execution into a response model."""
        ...


class BaseCommandRequest(GenericModel, Generic[CommandDataT]):
    """Base class for command creation requests.

    You shouldn't use this class directly; instead, use or define
    your own subclass per specific command type.
    """

    commandType: str = Field(
        ...,
        description=(
            "Specific command type that determines data requirements and "
            "execution behavior"
        ),
    )
    data: CommandDataT = Field(..., description="Command execution data payload")


class BaseCommand(GenericModel, Generic[CommandDataT, CommandResultT]):
    """Base command model.

    You shouldn't use this class directly; instead, use or define
    your own subclass per specific command type.
    """

    id: str = Field(..., description="Unique identifier for a particular command")
    createdAt: datetime = Field(..., description="Command creation timestamp")
    commandType: str = Field(
        ...,
        description=(
            "Specific command type that determines data requirements and "
            "execution behavior"
        ),
    )
    status: CommandStatus = Field(..., description="Command execution status")
    data: CommandDataT = Field(..., description="Command execution data payload")
    result: Optional[CommandResultT] = Field(
        None,
        description="Command execution result data, if completed",
    )
    # TODO(mc, 2021-06-08): model ProtocolEngine errors
    error: Optional[str] = Field(
        None,
        description="Command execution failure, if failed",
    )
    startedAt: Optional[datetime] = Field(
        None,
        description="Command execution start timestamp, if started",
    )
    completedAt: Optional[datetime] = Field(
        None,
        description="Command execution completed timestamp, if completed",
    )

    Implementation: ClassVar[BaseCommandImpl[CommandDataT, CommandResultT]]
