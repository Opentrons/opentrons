"""Request and response models for run resources."""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

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


class RunCommandSummary(ResourceModel):
    """A stripped down model of a full Command for usage in a Run response."""

    id: str = Field(..., description="Unique command identifier.")
    commandType: CommandType = Field(..., description="Specific type of command.")
    status: CommandStatus = Field(..., description="Execution status of the command.")


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

    id: str = Field(..., description="Unique labware offset record identifier.")
    definitionUri: str = Field(..., description="The URI for the labware's definition.")
    location: LabwareLocation = Field(
        ...,
        description="Where the labware is located on the robot.",
    )
    offset: LabwareOffsetVector = Field(
        ...,
        description="The offset applied to matching labware.",
    )


class Run(ResourceModel):
    """Run resource model."""

    id: str = Field(..., description="Unique run identifier.")
    createdAt: datetime = Field(..., description="When the run was created")
    status: RunStatus = Field(..., description="Execution status of the run")
    current: bool = Field(
        ...,
        description=(
            "Whether this run is currently controlling the robot."
            " There can be, at most, one current run."
        ),
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
    labwareOffsets: List[LabwareOffset] = Field(
        default_factory=list,
        description="Labware offsets to apply as labware are loaded.",
    )
    protocolId: Optional[str] = Field(
        None,
        description=(
            "Protocol resource being run, if any. If not present, the run may"
            " still be used to execute protocol commands over HTTP."
        ),
    )


class LabwareOffsetCreate(BaseModel):
    """Create request data for a labware offset."""

    definitionUri: str = Field(..., description="The URI for the labware's definition.")
    location: LabwareLocation = Field(
        ...,
        description="Where the labware is located on the robot.",
    )
    offset: LabwareOffsetVector = Field(
        ...,
        description="The offset applied to matching labware.",
    )


class RunCreate(BaseModel):
    """Create request data for a new run."""

    protocolId: Optional[str] = Field(
        None,
        description="Protocol resource ID that this run will be using, if applicable.",
    )
    labwareOffsets: List[LabwareOffsetCreate] = Field(
        default_factory=list,
        description="Labware offsets to apply as labware are loaded.",
    )


class RunUpdate(BaseModel):
    """Update request data for an existing run."""

    current: Optional[bool] = Field(
        None,
        description=(
            "Whether this run is currently controlling the robot."
            " Setting `current` to `false` will deactivate the run."
        ),
    )
