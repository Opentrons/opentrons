"""Request and response models for run resources."""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

from opentrons.protocol_engine import (
    CommandStatus,
    CommandType,
    CommandParams,
    EngineStatus as RunStatus,
    ErrorOccurrence,
    LoadedPipette,
    LoadedLabware,
    LabwareOffset,
    LabwareOffsetCreate,
)
from robot_server.service.json_api import ResourceModel
from .action_models import RunAction


# TODO(mc, 2022-02-01): since the `/runs/:run_id/commands` response is now paginated,
# this summary model is a lot less useful. Remove and replace with full `Command`
# models once problematially large objects like full labware and module definitions
# are no longer part of the public command.result API
class RunCommandSummary(ResourceModel):
    """A stripped down model of a full Command for usage in a Run response."""

    id: str = Field(..., description="Unique command identifier.")
    key: str = Field(
        ...,
        description="An identifier representing this command as a step in a protocol.",
    )
    commandType: CommandType = Field(..., description="Specific type of command.")
    createdAt: datetime = Field(..., description="Command creation timestamp")
    startedAt: Optional[datetime] = Field(
        None,
        description="Command execution start timestamp, if started",
    )
    completedAt: Optional[datetime] = Field(
        None,
        description="Command execution completed timestamp, if completed",
    )
    status: CommandStatus = Field(..., description="Execution status of the command.")
    errorId: Optional[str] = Field(
        None,
        description="Error occurrence identifier, if status is 'failed'",
    )
    # TODO(mc, 2022-02-01): this does not allow the command summary object to
    # be narrowed based on `commandType`. Will be resolved by TODO above
    params: CommandParams = Field(..., description="Command execution parameters.")


class RunSummary(ResourceModel):
    """A stripped down model of a full Run for usage in a Runs collection response."""

    id: str = Field(..., description="Unique run identifier.")
    status: RunStatus = Field(..., description="Execution status of the run")
    createdAt: datetime = Field(..., description="When the run was created")
    current: bool = Field(
        ...,
        description=(
            "Whether this run is currently controlling the robot."
            " There can be, at most, one current run."
        ),
    )
    protocolId: Optional[str] = Field(
        None,
        description=(
            "Protocol resource being run, if any. If not present, the run may"
            " still be used to execute protocol commands over HTTP."
        ),
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
    errors: List[ErrorOccurrence] = Field(
        ...,
        description="Any errors that have occurred during the run.",
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
        ...,
        description="Labware offsets to apply as labware are loaded.",
    )
    protocolId: Optional[str] = Field(
        None,
        description=(
            "Protocol resource being run, if any. If not present, the run may"
            " still be used to execute protocol commands over HTTP."
        ),
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
