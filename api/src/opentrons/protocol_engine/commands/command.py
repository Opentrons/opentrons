"""Base command data model and type definitions."""
from __future__ import annotations
from abc import ABC, abstractmethod
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel
from typing import TYPE_CHECKING, Generic, Optional, TypeVar

# convenience type alias to work around type-only circular dependency
if TYPE_CHECKING:
    from opentrons.protocol_engine import execution

CommandParamsT = TypeVar("CommandParamsT", bound=BaseModel)

CommandResultT = TypeVar("CommandResultT", bound=BaseModel)


class CommandStatus(str, Enum):
    """Command execution status."""

    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class BaseCommandCreate(GenericModel, Generic[CommandParamsT]):
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
    params: CommandParamsT = Field(..., description="Command execution data payload")


class BaseCommand(GenericModel, Generic[CommandParamsT, CommandResultT]):
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
    params: CommandParamsT = Field(..., description="Command execution data payload")
    result: Optional[CommandResultT] = Field(
        None,
        description="Command execution result data, if succeeded",
    )
    errorId: Optional[str] = Field(
        None,
        description="Reference to error occurrence, if execution failed",
    )
    startedAt: Optional[datetime] = Field(
        None,
        description="Command execution start timestamp, if started",
    )
    completedAt: Optional[datetime] = Field(
        None,
        description="Command execution completed timestamp, if completed",
    )


class AbstractCommandImpl(
    ABC,
    Generic[CommandParamsT, CommandResultT],
):
    """Abstract command creation and execution implementation.

    A given command request should map to a specific command implementation,
    which defines how to:

    - Create a command resource from the request model
    - Execute the command, mapping data from execution into the result model
    """

    def __init__(
        self,
        equipment: execution.EquipmentHandler,
        movement: execution.MovementHandler,
        pipetting: execution.PipettingHandler,
        run_control: execution.RunControlHandler,
    ) -> None:
        """Initialize the command implementation with execution handlers."""
        self._equipment = equipment
        self._movement = movement
        self._pipetting = pipetting
        self._run_control = run_control

    @abstractmethod
    async def execute(self, params: CommandParamsT) -> CommandResultT:
        """Execute the command, mapping data from execution into a response model."""
        ...
