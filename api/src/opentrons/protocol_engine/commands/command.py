"""Base command data model and type definitions."""


from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import (
    TYPE_CHECKING,
    Generic,
    Optional,
    TypeVar,
    Tuple,
    List,
    Type,
    Union,
)

from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from opentrons.hardware_control import HardwareControlAPI

from ..errors import ErrorOccurrence
from ..notes import CommandNote, CommandNoteAdder

# Work around type-only circular dependencies.
if TYPE_CHECKING:
    from .. import execution
    from ..state import StateView


_ParamsT = TypeVar("_ParamsT", bound=BaseModel)
_ParamsT_contra = TypeVar("_ParamsT_contra", bound=BaseModel, contravariant=True)
_ResultT = TypeVar("_ResultT", bound=BaseModel)
_ResultT_co = TypeVar("_ResultT_co", bound=BaseModel, covariant=True)
_PrivateResultT_co = TypeVar("_PrivateResultT_co", covariant=True)


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
    FIXIT = "fixit"


class BaseCommandCreate(GenericModel, Generic[_ParamsT]):
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
    params: _ParamsT = Field(..., description="Command execution data payload")
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


class BaseCommand(GenericModel, Generic[_ParamsT, _ResultT]):
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
    params: _ParamsT = Field(..., description="Command execution data payload")
    result: Optional[_ResultT] = Field(
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
    notes: Optional[List[CommandNote]] = Field(
        None,
        description=(
            "Information not critical to the execution of the command derived from either"
            " the command's execution or the command's generation."
        ),
    )
    failedCommandId: Optional[str] = Field(
        None,
        description=(
            "FIXIT command use only. Reference of the failed command id we are trying to fix."
        ),
    )

    _ImplementationCls: Union[
        Type[AbstractCommandImpl[_ParamsT, _ResultT]],
        Type[AbstractCommandWithPrivateResultImpl[_ParamsT, _ResultT, object]],
    ]


class AbstractCommandImpl(
    ABC,
    Generic[_ParamsT_contra, _ResultT_co],
):
    """Abstract command creation and execution implementation.

    A given command request should map to a specific command implementation,
    which defines how to:

    - Create a command resource from the request model
    - Execute the command, mapping data from execution into the result model

    This class should be used as the base class for new commands by default. You should only
    use AbstractCommandWithPrivateResultImpl if you actually need private results to send to
    the rest of the engine wihtout being published outside of it.
    """

    def __init__(
        self,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        equipment: execution.EquipmentHandler,
        movement: execution.MovementHandler,
        gantry_mover: execution.GantryMover,
        labware_movement: execution.LabwareMovementHandler,
        pipetting: execution.PipettingHandler,
        tip_handler: execution.TipHandler,
        run_control: execution.RunControlHandler,
        rail_lights: execution.RailLightsHandler,
        status_bar: execution.StatusBarHandler,
        command_note_adder: CommandNoteAdder,
    ) -> None:
        """Initialize the command implementation with execution handlers."""
        pass

    @abstractmethod
    async def execute(self, params: _ParamsT_contra) -> _ResultT_co:
        """Execute the command, mapping data from execution into a response model."""
        ...


class AbstractCommandWithPrivateResultImpl(
    ABC,
    Generic[_ParamsT_contra, _ResultT_co, _PrivateResultT_co],
):
    """Abstract command creation and execution implementation if the command has private results.

    A given command request should map to a specific command implementation,
    which defines how to:

    - Create a command resource from the request model
    - Execute the command, mapping data from execution into the result model

    This class should be used instead of AbstractCommandImpl as a base class if your command needs
    to send data to result handlers that should not be published outside of the engine.

    Note that this class needs an extra type-parameter for the private result.
    """

    def __init__(
        self,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        equipment: execution.EquipmentHandler,
        movement: execution.MovementHandler,
        gantry_mover: execution.GantryMover,
        labware_movement: execution.LabwareMovementHandler,
        pipetting: execution.PipettingHandler,
        tip_handler: execution.TipHandler,
        run_control: execution.RunControlHandler,
        rail_lights: execution.RailLightsHandler,
        status_bar: execution.StatusBarHandler,
        command_note_adder: CommandNoteAdder,
    ) -> None:
        """Initialize the command implementation with execution handlers."""
        pass

    @abstractmethod
    async def execute(
        self, params: _ParamsT_contra
    ) -> Tuple[_ResultT_co, _PrivateResultT_co]:
        """Execute the command, mapping data from execution into a response model."""
        ...
