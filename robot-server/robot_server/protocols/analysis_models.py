"""Response models for protocol analysis."""
# TODO(mc, 2021-08-25): add modules to simulation result
from enum import Enum
from opentrons.api.src.opentrons.protocols.api_support.constants import STANDARD_OT2_DECK, STANDARD_OT3_DECK, SHORT_TRASH_DECK
from pydantic import BaseModel, Field
from typing import List, Union
from typing_extensions import Literal

from opentrons.protocol_engine import (
    Command,
    ErrorOccurrence,
    LoadedLabware,
    LoadedPipette,
)


class AnalysisStatus(str, Enum):
    """Status of a protocol analysis."""

    PENDING = "pending"
    COMPLETED = "completed"


class AnalysisResult(str, Enum):
    """Result of a completed protocol analysis.

    The result indicates whether the protocol is expected to run successfully.

    Properties:
        OK: No problems were found during protocol analysis.
        NOT_OK: Problems were found during protocol analysis. Inspect
            `analysis.errors` for error occurrences.
    """

    OK = "ok"
    NOT_OK = "not-ok"


class AnalysisSummary(BaseModel):
    """Base model for an analysis of a protocol."""

    id: str = Field(..., description="Unique identifier of this analysis resource")
    status: AnalysisStatus = Field(..., description="Status of the analysis")


class PendingAnalysis(AnalysisSummary):
    """A protocol analysis that is on-going."""

    status: Literal[AnalysisStatus.PENDING] = AnalysisStatus.PENDING

class RobotDetails(BaseModel):
    """Base model for the details of a specified robot"""

    model: Union[Literal["OT-2 Standard"], Literal["OT-3 Standard"]]
    deckId: Union[STANDARD_OT2_DECK, STANDARD_OT3_DECK, SHORT_TRASH_DECK]

class CompletedAnalysis(AnalysisSummary):
    """A completed protocol run analysis.

    This analysis provides three pieces of information:

    - A smoke test on whether the run is expected to succeed, given available data.
    - The equipment (labware, pipettes, modules) that the protocol will use.
    - The run commands that the protocol is expected to issue.

    !!! important "Important note about non-deterministic protocols"
        Python protocols are allowed to be written in a way that makes their
        behavior non-deterministic. For example, a protocol could use ``random``
        to determine how much volume to aspirate.

        If a protocol is non-deterministic, an analysis may differ from the
        actual run (or any subsequent analysis). If you are writing or using
        non-deterministic protocols, please keep this fact in mind.

        JSON protocols are currently deterministic by design.
    """

    status: Literal[AnalysisStatus.COMPLETED] = AnalysisStatus.COMPLETED
    result: AnalysisResult = Field(
        ...,
        description="Whether the protocol is expected to run successfully",
    )
    robot: RobotDetails = Field(
        ...,
        description="Details of the robot targeted by this protocol"
    ),
    pipettes: List[LoadedPipette] = Field(
        ...,
        description="Pipettes used by the protocol",
    )
    labware: List[LoadedLabware] = Field(
        ...,
        description="Labware used by the protocol",
    )
    commands: List[Command] = Field(
        ...,
        description="The protocol commands the run is expected to produce",
    )
    errors: List[ErrorOccurrence] = Field(
        ...,
        description="Any errors the protocol run produced",
    )


ProtocolAnalysis = Union[PendingAnalysis, CompletedAnalysis]
