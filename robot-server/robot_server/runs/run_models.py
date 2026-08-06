"""Request and response models for run resources."""

from datetime import datetime
from typing import Annotated, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from opentrons.protocol_engine import (
    CommandIntent,
    CommandNote,
    CommandParams,
    CommandStatus,
    CommandType,
    ErrorOccurrence,
    LabwareOffset,
    LabwareOffsetCreate,
    LegacyLabwareOffsetCreate,
    Liquid,
    LiquidClassRecordWithId,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
)
from opentrons.protocol_engine import (
    EngineStatus as RunStatus,
)
from opentrons.protocol_engine.resources.camera_provider import CameraSettings
from opentrons.protocol_engine.types import (
    CSVRunTimeParamFilesType,
    OnDeckLabwareLocation,
    PrimitiveRunTimeParamValuesType,
    RunTimeParameter,
)
from opentrons_shared_data.errors import GeneralError
from opentrons_shared_data.util import StrEnum
from server_utils.fastapi_utils.models.json_api import ResourceModel

from .action_models import RunAction
from robot_server.errors.error_responses import ErrorDetails


class RunDataError(ErrorDetails):
    """A model for an error loading a run."""

    title: str = Field(
        "Run Data Error",
        description="A short, human readable name for this type of error",
    )
    id: Literal["RunDataError"] = "RunDataError"


# TODO(mc, 2022-02-01): since the `/runs/:run_id/commands` response is now paginated,
# this summary model is a lot less useful. Remove and replace with full `Command`
# models once problematically large objects like full labware and module definitions
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
    error: Optional[ErrorOccurrence] = Field(
        None,
        description="Error occurrence, if status is 'failed'",
    )
    # TODO(mc, 2022-02-01): this does not allow the command summary object to
    # be narrowed based on `commandType`. Will be resolved by TODO above
    params: CommandParams = Field(..., description="Command execution parameters.")
    intent: Optional[CommandIntent] = Field(
        None,
        description="Why this command was added to the run.",
    )
    notes: Optional[List[CommandNote]] = Field(
        None,
        description="Notes pertaining to this command.",
    )
    failedCommandId: Optional[str] = Field(
        None,
        description=(
            "FIXIT command use only. Reference of the failed command id we are trying to fix."
        ),
    )
    commandAnnotationIds: Optional[List[str]] = Field(
        None,
        description="List of command annotation ids associated with this command.",
    )


class Run(ResourceModel):
    """Run resource model."""

    ok: Literal[True] = True
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
    signedBy: Annotated[
        str | None,
        Field(
            description=(
                'The "signature" of the user who reviewed this run,'
                " as set by `PATCH /runs/{id}`."
            )
        ),
    ] = None
    logPeriodId: str | None = Field(
        ...,
        description=(
            "If the robot has audit logging enabled, the log period this run"
            " was associated with."
        ),
    )
    actions: List[RunAction] = Field(
        ...,
        description="Client-initiated run control actions, ordered oldest to newest.",
    )
    errors: List[ErrorOccurrence] = Field(
        ...,
        description=(
            "The run's fatal error, if there was one."
            " For historical reasons, this is an array,"
            " but it won't have more than one element."
        ),
    )
    hasEverEnteredErrorRecovery: bool = Field(
        ...,
        description=("Whether the run has entered error recovery."),
    )
    pipettes: List[LoadedPipette] = Field(
        ...,
        description="Pipettes that have been loaded into the run.",
    )
    modules: List[LoadedModule] = Field(
        ...,
        description="Modules that have been loaded into the run.",
    )
    labware: List[LoadedLabware] = Field(
        ...,
        description="Labware that has been loaded into the run.",
    )
    liquids: List[Liquid] = Field(
        ...,
        description="Liquids loaded to the run.",
    )
    liquidClasses: List[LiquidClassRecordWithId] = Field(
        ...,
        description="Liquid classes loaded to the run.",
    )
    labwareOffsets: List[LabwareOffset] = Field(
        ...,
        description="Labware offsets to apply as labware are loaded.",
    )
    runTimeParameters: List[RunTimeParameter] = Field(
        default_factory=list,
        description=(
            "Run time parameters used during the run."
            " These are the parameters that are defined in the protocol, with values"
            " specified either in the run creation request or default values from the protocol"
            " if none are specified in the request."
        ),
    )
    outputFileIds: List[str] = Field(
        ...,
        description="File IDs of files output during a protocol run.",
    )
    protocolId: Optional[str] = Field(
        None,
        description=(
            "Protocol resource being run, if any. If not present, the run may"
            " still be used to execute protocol commands over HTTP."
        ),
    )
    completedAt: Optional[datetime] = Field(
        None,
        description="Run completed at timestamp.",
    )
    startedAt: Optional[datetime] = Field(
        None,
        description="Run started at timestamp.",
    )
    cameraSettings: Optional[CameraSettings] = Field(
        None,
        description="Override Camera Settings provided during a run.",
    )


class BadRun(ResourceModel):
    """Resource model representation for a bad run that could not be loaded."""

    ok: Literal[False] = False
    dataError: RunDataError = Field(..., description="Error from loading the data.")
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
    signedBy: Annotated[
        str | None,
        Field(
            description=(
                'The "signature" of the user who reviewed this run,'
                " as set by `PATCH /runs/{id}`."
            )
        ),
    ] = None
    logPeriodId: str | None = Field(
        ...,
        description=(
            "If the robot has audit logging enabled, the log period this run"
            " was associated with."
        ),
    )
    actions: List[RunAction] = Field(
        ...,
        description="Client-initiated run control actions, ordered oldest to newest. If these could not be loaded for this bad run, this will be null.",
    )
    errors: List[ErrorOccurrence] = Field(
        ...,
        description=(
            "The run's fatal error, if there was one."
            " For historical reasons, this is an array,"
            " but it won't have more than one element."
        ),
    )
    hasEverEnteredErrorRecovery: bool = Field(
        ...,
        description=("Whether the run has entered error recovery."),
    )
    pipettes: List[LoadedPipette] = Field(
        ...,
        description="Pipettes that have been loaded into the run.",
    )
    modules: List[LoadedModule] = Field(
        ...,
        description="Modules that have been loaded into the run.",
    )
    labware: List[LoadedLabware] = Field(
        ...,
        description="Labware that has been loaded into the run.",
    )
    liquids: List[Liquid] = Field(
        ...,
        description="Liquids loaded to the run.",
    )
    liquidClasses: List[LiquidClassRecordWithId] = Field(
        ...,
        description="Liquid classes loaded to the run.",
    )
    labwareOffsets: List[LabwareOffset] = Field(
        ...,
        description="Labware offsets to apply as labware are loaded.",
    )
    runTimeParameters: List[RunTimeParameter] = Field(
        default_factory=list,
        description=(
            "Run time parameters used during the run."
            " These are the parameters that are defined in the protocol, with values"
            " specified either in the run creation request or default values from the protocol"
            " if none are specified in the request."
        ),
    )
    outputFileIds: List[str] = Field(
        ...,
        description="File IDs of files output during a protocol run.",
    )
    protocolId: Optional[str] = Field(
        None,
        description=(
            "Protocol resource being run, if any. If not present, the run may"
            " still be used to execute protocol commands over HTTP."
        ),
    )
    completedAt: Optional[datetime] = Field(
        None,
        description="Run completed at timestamp.",
    )
    startedAt: Optional[datetime] = Field(
        None,
        description="Run started at timestamp.",
    )


class RunCreate(BaseModel):
    """Create request data for a new run."""

    protocolId: Optional[str] = Field(
        None,
        description="Protocol resource ID that this run will be using, if applicable.",
    )
    labwareOffsets: List[LegacyLabwareOffsetCreate | LabwareOffsetCreate] = Field(
        default_factory=list,
        description="Labware offsets to apply as labware are loaded.",
    )
    runTimeParameterValues: Optional[PrimitiveRunTimeParamValuesType] = Field(
        None,
        description="Key-value pairs of run-time parameters defined in a protocol.",
    )
    runTimeParameterFiles: Optional[CSVRunTimeParamFilesType] = Field(
        None,
        description="Key-fileId pairs of CSV run-time parameters defined in a run.",
    )


class RunUpdate(BaseModel):
    """Update request data for an existing run."""

    current: Annotated[
        Literal[False] | None,
        Field(
            description=(
                "Whether this run is currently controlling the robot."
                " Setting `current` to `false` will deactivate the run."
            ),
        ),
    ] = None

    signedBy: Annotated[
        str | None,
        Field(
            description=(
                "Set this to a string to mark that the run has been reviewed by a human."
                " Depending on robot settings, this may be required before anything else can be run."
                ' The string is the "signature," and so should probably be something like the user\'s full name.'
                " This can be changed any number of times as long as the run is current; the last write wins."
            )
        ),
    ] = None


class LabwareDefinitionSummary(BaseModel):
    """Summary of data about a created labware definition."""

    definitionUri: str = Field(
        ...,
        description="The definition's unique resource identifier in the run.",
    )


class NozzleLayoutConfig(StrEnum):
    """Possible valid nozzle configurations."""

    COLUMN = "column"
    ROW = "row"
    SINGLE = "single"
    FULL = "full"
    SUBRECT = "subrect"


class ActiveNozzleLayout(BaseModel):
    """Details about the active nozzle layout for a pipette used in the current run."""

    startingNozzle: str = Field(
        ..., description="The nozzle used when issuing pipette commands."
    )
    activeNozzles: List[str] = Field(
        ...,
        description="A map of all the pipette nozzles active in the current configuration.",
    )
    config: NozzleLayoutConfig = Field(
        ..., description="The active nozzle configuration."
    )


class TipState(BaseModel):
    """Information about the tip, if any, currently attached to a pipette."""

    hasTip: bool

    # todo(mm, 2024-11-15): I think the frontend is currently scraping the commands
    # list to figure out where the current tip came from. Extend this class with that
    # information so the frontend doesn't have to do that.


class PlaceLabwareState(BaseModel):
    """Details the labware being placed by the gripper."""

    labwareURI: str = Field(..., description="The URI of the labware to place.")
    location: OnDeckLabwareLocation = Field(
        ..., description="The location the labware should be in."
    )
    shouldPlaceDown: bool = Field(
        ..., description="Whether the gripper should place down the labware."
    )


class FlexStackerState(BaseModel):
    """Provides the current state of a Flex Stacker."""

    primaryLabwareURI: Optional[str] = Field(
        None, description="The URI of the primary labware."
    )
    adapterLabwareURI: Optional[str] = Field(
        None, description="The URI of the adapter labware."
    )
    lidLabwareURI: Optional[str] = Field(
        None, description="The URI of the lid labware."
    )
    count: int = Field(0, description="The number of labware current in the hopper.")
    maxCount: int = Field(
        0, description="The maximum number of labware allowed in the hopper."
    )


class RunCurrentState(BaseModel):
    """Current details about a run."""

    # todo(mm, 2024-11-15): Having estopEngaged here is a bit of an odd man out because
    # it's sensor state that can change on its own at any time, whereas the rest of
    # these fields are logical state that changes only when commands are run.
    #
    # Our current mechanism for anchoring these fields to a specific point in time
    # (important for avoiding torn-read problems when a client combines this info with
    # info from other endpoints) is `links.currentCommand`, which is based on the idea
    # that these fields only change when the current command changes.
    #
    # We should see if clients can replace this with `GET /robot/control/estopStatus`.
    estopEngaged: bool

    activeNozzleLayouts: Dict[str, ActiveNozzleLayout]
    tipStates: Dict[str, TipState]
    placeLabwareState: Optional[PlaceLabwareState]
    flexStackerStates: Optional[Dict[str, FlexStackerState]]


class CommandLinkNoMeta(BaseModel):
    """A link to a command resource without a meta field."""

    id: str = Field(..., description="The ID of the command.")
    href: str = Field(..., description="The HTTP API path to the command.")


class RunNotFoundError(GeneralError):
    """Error raised when a given Run ID is not found in the store."""

    def __init__(self, run_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(
            message=f"Run {run_id} was not found.", detail={"runId": run_id}
        )
