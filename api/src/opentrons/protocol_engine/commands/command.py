"""Base command data model and type definitions."""


from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Generic, Optional, TypeVar

from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from opentrons.hardware_control import HardwareControlAPI

from ..errors import ErrorOccurrence

# Work around type-only circular dependencies.
if TYPE_CHECKING:
    from .. import execution
    from ..state import StateView


CommandParamsT = TypeVar("CommandParamsT", bound=BaseModel)

CommandResultT = TypeVar("CommandResultT", bound=BaseModel)


class CommandStatus(str, Enum):
    """Command execution status."""

    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class CommandIntent(str, Enum):
    """Run intent for a given command.

    Props:
        PROTOCOL: the command is part of the protocol run itself.
        SETUP: the command is part of the setup phase of a run.
    """

    PROTOCOL = "protocol"
    SETUP = "setup"


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
    intent: Optional[CommandIntent] = Field(
        None,
        description=(
            "The reason the command was added. If not specified or `protocol`,"
            " the command will be treated as part of the protocol run itself,"
            " and added to the end of the existing command queue."
            "\n\n"
            "If `setup`, the command will be treated as part of run setup."
            " A setup command may only be enqueued if the run has not started."
            "\n\n"
            "Use setup commands for activities like pre-run calibration checks"
            " and module setup, like pre-heating."
        ),
    )
    key: Optional[str] = Field(
        None,
        description=(
            "A key value, unique in this run, that can be used to track"
            " the same logical command across multiple runs of the same protocol."
            " If a value is not provided, one will be generated."
        ),
    )


class BaseCommand(GenericModel, Generic[CommandParamsT, CommandResultT]):
    """Base command model.

    You shouldn't use this class directly; instead, use or define
    your own subclass per specific command type.
    """

    id: str = Field(
        ...,
        description="Unique identifier of this particular command instance",
    )
    createdAt: datetime = Field(..., description="Command creation timestamp")
    commandType: str = Field(
        ...,
        description=(
            "Specific command type that determines data requirements and "
            "execution behavior"
        ),
    )
    key: str = Field(
        ...,
        description=(
            "An identifier representing this command as a step in a protocol."
            " A command's `key` will be unique within a given run, but stable"
            " across all runs that perform the same exact procedure. Thus,"
            " `key` be used to compare/match commands across multiple runs"
            " of the same protocol."
        ),
    )
    status: CommandStatus = Field(..., description="Command execution status")
    params: CommandParamsT = Field(..., description="Command execution data payload")
    result: Optional[CommandResultT] = Field(
        None,
        description="Command execution result data, if succeeded",
    )
    error: Optional[ErrorOccurrence] = Field(
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
    intent: Optional[CommandIntent] = Field(
        None,
        description=(
            "The reason the command was added to the run."
            " If not specified or `protocol`, it is part of the protocol itself."
            " If `setup`, it was added as part of setup; for example,"
            " a command that is part of a calibration procedure."
        ),
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
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        equipment: execution.EquipmentHandler,
        movement: execution.MovementHandler,
        pipetting: execution.PipettingHandler,
        run_control: execution.RunControlHandler,
        rail_lights: execution.RailLightsHandler,
    ) -> None:
        """Initialize the command implementation with execution handlers."""
        pass

    @abstractmethod
    async def execute(self, params: CommandParamsT) -> CommandResultT:
        """Execute the command, mapping data from execution into a response model."""
        ...
