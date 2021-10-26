"""Request and response models for session resources."""
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
    """All available session types."""

    BASIC = "basic"
    PROTOCOL = "protocol"


class AbstractRunCreateData(BaseModel):
    """Request data sent when creating a session."""

    runType: RunType = Field(
        ...,
        description="The session type to create.",
    )
    createParams: Optional[BaseModel] = Field(
        None,
        description="Parameters to set session behaviors at creation time.",
    )


class RunCommandSummary(ResourceModel):
    """A stripped down model of a full Command for usage in a Session response."""

    id: str = Field(..., description="Unique command identifier.")
    commandType: CommandType = Field(..., description="Specific type of command.")
    status: CommandStatus = Field(..., description="Execution status of the command.")


class AbstractRun(ResourceModel):
    """Base session resource model."""

    id: str = Field(..., description="Unique session identifier.")
    runType: RunType = Field(..., description="Specific session type.")
    createdAt: datetime = Field(..., description="When the session was created")
    status: RunStatus = Field(..., description="Execution status of the session")
    # TODO(mc, 2021-05-25): how hard would it be to rename this field to `config`?
    createParams: Optional[BaseModel] = Field(
        None,
        description="Configuration parameters for the session.",
    )
    actions: List[RunAction] = Field(
        ...,
        description="Client-initiated session control actions.",
    )
    commands: List[RunCommandSummary] = Field(
        ...,
        description="Protocol commands queued, running, or executed for the session.",
    )
    pipettes: List[LoadedPipette] = Field(
        ...,
        description="Pipettes that have been loaded into the session.",
    )
    labware: List[LoadedLabware] = Field(
        ...,
        description="Labware that has been loaded into the session.",
    )


class BasicRunCreateData(AbstractRunCreateData):
    """Creation request data for a basic session."""

    runType: Literal[RunType.BASIC] = RunType.BASIC


class BasicRun(AbstractRun):
    """A session to execute commands without a previously loaded protocol file."""

    runType: Literal[RunType.BASIC] = RunType.BASIC


class ProtocolRunCreateParams(BaseModel):
    """Creation parameters for a protocol session."""

    protocolId: str = Field(
        ...,
        description="Unique identifier of the protocol this session will run.",
    )


class ProtocolRunCreateData(AbstractRunCreateData):
    """Creation request data for a protocol session."""

    runType: Literal[RunType.PROTOCOL] = RunType.PROTOCOL
    createParams: ProtocolRunCreateParams


class ProtocolRun(AbstractRun):
    """A session to execute commands with a previously loaded protocol file."""

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
