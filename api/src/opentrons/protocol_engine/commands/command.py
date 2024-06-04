"""Base command data model and type definitions."""


from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import (
    TYPE_CHECKING,
    Generic,
    Optional,
    TypeVar,
    List,
    Type,
    Union,
)

from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from opentrons.hardware_control import HardwareControlAPI

from ..resources import ModelUtils
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
_ErrorT = TypeVar("_ErrorT", bound=ErrorOccurrence)
_ErrorT_co = TypeVar("_ErrorT_co", bound=ErrorOccurrence, covariant=True)
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


class BaseCommandCreate(
    GenericModel,
    # These type parameters need to be invariant because our fields are mutable.
    Generic[_ParamsT],
):
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


@dataclass(frozen=True)
class SuccessData(Generic[_ResultT_co, _PrivateResultT_co]):
    """Data from the successful completion of a command."""

    public: _ResultT_co
    """Public result data. Exposed over HTTP and stored in databases."""

    private: _PrivateResultT_co
    """Additional result data, only given to `opentrons.protocol_engine` internals."""


@dataclass(frozen=True)
class DefinedErrorData(Generic[_ErrorT_co, _PrivateResultT_co]):
    """Data from a command that failed with a defined error.

    This should only be used for "defined" errors, not any error.
    See `AbstractCommandImpl.execute()`.
    """

    public: _ErrorT_co
    """Public error data. Exposed over HTTP and stored in databases."""

    private: _PrivateResultT_co
    """Additional error data, only given to `opentrons.protocol_engine` internals."""


class BaseCommand(
    GenericModel,
    # These type parameters need to be invariant because our fields are mutable.
    Generic[_ParamsT, _ResultT, _ErrorT],
):
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
    error: Union[
        _ErrorT,
        # ErrorOccurrence here is for undefined errors not captured by _ErrorT.
        ErrorOccurrence,
        None,
    ] = Field(
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

    _ImplementationCls: Type[
        AbstractCommandImpl[
            _ParamsT,
            Union[
                SuccessData[
                    # Our _ImplementationCls must return public result data that can fit
                    # in our `result` field:
                    _ResultT,
                    # But we don't care (here) what kind of private result data it returns:
                    object,
                ],
                DefinedErrorData[
                    # Likewise, for our `error` field:
                    _ErrorT,
                    object,
                ],
            ],
        ]
    ]


_ExecuteReturnT_co = TypeVar(
    "_ExecuteReturnT_co",
    bound=Union[
        SuccessData[BaseModel, object],
        DefinedErrorData[ErrorOccurrence, object],
    ],
    covariant=True,
)


class AbstractCommandImpl(
    ABC,
    Generic[_ParamsT_contra, _ExecuteReturnT_co],
):
    """Abstract command creation and execution implementation.

    A given command request should map to a specific command implementation,
    which defines how to execute the command and map data from execution into the
    result model.
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
        model_utils: ModelUtils,
        status_bar: execution.StatusBarHandler,
        command_note_adder: CommandNoteAdder,
    ) -> None:
        """Initialize the command implementation with execution handlers."""
        pass

    @abstractmethod
    async def execute(self, params: _ParamsT_contra) -> _ExecuteReturnT_co:
        """Execute the command, mapping data from execution into a response model.

        This should either:

        - Return a `SuccessData`, if the command completed normally.
        - Return a `DefinedErrorData`, if the command failed with a "defined error."
          Defined errors are errors that are documented as part of the robot's public
          API.
        - Raise an exception, if the command failed with any other error
          (in other words, an undefined error).
        """
        ...
