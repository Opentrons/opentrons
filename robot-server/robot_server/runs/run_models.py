"""Request and response models for run resources."""
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from typing_extensions import Literal

from opentrons.protocol_engine import (
    CommandStatus,
    CommandType,
    EngineStatus as RunStatus,
    LoadedPipette,
    LoadedLabware,
)
from robot_server.service.json_api import ResourceModel
from .action_models import RunAction


class RunType(str, Enum):
    """All available run types."""

    BASIC = "basic"
    PROTOCOL = "protocol"


class RunCommandSummary(ResourceModel):
    """A stripped down model of a full Command for usage in a Run response."""

    id: str = Field(..., description="Unique command identifier.")
    commandType: CommandType = Field(..., description="Specific type of command.")
    status: CommandStatus = Field(..., description="Execution status of the command.")


class AbstractRun(ResourceModel):
    """Base run resource model."""

    id: str = Field(..., description="Unique run identifier.")
    # TODO(mm, 2021-10-28): runType is redundant with createParams.runType.
    # Deprecate one or the other.
    runType: RunType = Field(..., description="Specific run type.")
    createdAt: datetime = Field(..., description="When the run was created")
    status: RunStatus = Field(..., description="Execution status of the run")
    # TODO(mc, 2021-05-25): how hard would it be to rename this field to `config`?
    createParams: Optional[BaseModel] = Field(
        None,
        description="Configuration parameters for the run.",
    )
    actions: List[RunAction] = Field(
        ...,
        description="Client-initiated run control actions.",
    )
    commands: List[RunCommandSummary] = Field(
        ...,
        description="Protocol commands queued, running, or executed for the run.",
    )
    pipettes: List[LoadedPipette] = Field(
        ...,
        description="Pipettes that have been loaded into the run.",
    )
    labware: List[LoadedLabware] = Field(
        ...,
        description="Labware that has been loaded into the run.",
    )


class BasicRunCreateParams(BaseModel):
    """Creation parameters for a basic run."""

    pass


class BasicRunCreateData(BaseModel):
    """Creation request data for a basic run."""

    runType: Literal[RunType.BASIC] = Field(
        RunType.BASIC,
        description="The run type to create.",
    )
    createParams: BasicRunCreateParams = Field(
        default_factory=BasicRunCreateParams,
        description="Parameters to set run behaviors at creation time.",
    )


class BasicRun(AbstractRun):
    """A run to execute commands without a previously loaded protocol file."""

    runType: Literal[RunType.BASIC] = RunType.BASIC


class ProtocolRunCreateParams(BaseModel):
    """Creation parameters for a protocol run."""

    protocolId: str = Field(
        ...,
        description="Unique identifier of the protocol this run will execute.",
    )


class ProtocolRunCreateData(BaseModel):
    """Creation request data for a protocol run."""

    runType: Literal[RunType.PROTOCOL] = Field(
        RunType.PROTOCOL,
        description="The run type to create.",
    )
    createParams: ProtocolRunCreateParams = Field(
        ...,
        description="Parameters to set run behaviors at creation time.",
    )


class ProtocolRun(AbstractRun):
    """A run to execute commands with a previously loaded protocol file."""

    runType: Literal[RunType.PROTOCOL] = RunType.PROTOCOL
    createParams: ProtocolRunCreateParams


RunCreateData = Union[
    BasicRunCreateData,
    ProtocolRunCreateData,
]

Run = Union[
    BasicRun,
    ProtocolRun,
]
