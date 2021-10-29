"""Request and response models for run resources."""
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Union
from typing_extensions import Literal

from opentrons.protocol_engine import (
    CommandStatus,
    CommandType,
    EngineStatus as RunStatus,
    LabwareLocation,
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


class LabwareOffsetVector(BaseModel):
    """An offset to apply to labware, in deck coordinates."""

    x: float
    y: float
    z: float


class LabwareOffset(BaseModel):
    """An offset that the robot adds to a pipette's position when it moves to a labware.

    During the run, if a labware is loaded whose definition URI and location
    both match what's found here, the given offset will be added to all
    pipette movements that use that labware as a reference point.
    """

    definitionUri: str = Field(..., description="The URI for the labware's definition.")
    location: LabwareLocation = Field(
        ..., description="Where the labware is located on the robot."
    )
    offset: LabwareOffsetVector = Field(
        ..., description="The offset applied to matching labware."
    )


class BasicRunCreateParams(BaseModel):
    """Creation parameters for a basic run."""

    labwareOffsets: List[LabwareOffset] = Field(default_factory=list)


class BasicRunCreateData(BaseModel):
    """Creation request data for a basic run."""

    runType: Literal[RunType.BASIC] = Field(
        RunType.BASIC,
        description="The run type to create.",
    )
    # TODO(mc, 2021-05-25): how hard would it be to rename this field to `config`?
    createParams: BasicRunCreateParams = Field(
        default_factory=BasicRunCreateParams,
        description="Parameters to set run behaviors at creation time.",
    )


class BasicRun(AbstractRun):
    """A run to execute commands without a previously loaded protocol file."""

    runType: Literal[RunType.BASIC] = RunType.BASIC

    createParams: BasicRunCreateParams


class ProtocolRunCreateParams(BaseModel):
    """Creation parameters for a protocol run."""

    protocolId: str = Field(
        ...,
        description="Unique identifier of the protocol this run will execute.",
    )

    labwareOffsets: List[LabwareOffset] = Field(default_factory=list)


class ProtocolRunCreateData(BaseModel):
    """Creation request data for a protocol run."""

    runType: Literal[RunType.PROTOCOL] = Field(
        RunType.PROTOCOL,
        description="The run type to create.",
    )
    # TODO(mc, 2021-05-25): how hard would it be to rename this field to `config`?
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
