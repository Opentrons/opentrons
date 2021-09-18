"""Response models for protocol analysis."""
# TODO(mc, 2021-08-25): add modules to simulation result
from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Union
from typing_extensions import Literal

from opentrons.protocol_engine import Command, LoadedLabware, LoadedPipette


class AnalysisStatus(str, Enum):
    """Status of a protocol analysis."""

    PENDING = "pending"
    COMPLETED = "completed"


class AnalysisResult(str, Enum):
    """Result of a completed protocol analysis.

    The result indicates whether the protocol is expected to run successfully.

    Properties:
        OK: No problems were found during protocol analysis.
        NOT_OK: Problems were found with the logic of the protocol itself.
            Inspect `analysis.commands` for commands that did not succeed.
        ERROR: An error prevented the analysis from determining a conclusive
            result, most likely due to a bug in the protocol's Python source
            (for example, a syntax error). Inspect `analysis.errors`.
    """

    OK = "ok"
    NOT_OK = "not-ok"
    ERROR = "error"


class AnalysisSummary(BaseModel):
    """Base model for an analyis of a protocol."""

    id: str = Field(..., description="Unique identifier of this analysis resource")
    status: AnalysisStatus = Field(..., description="Status of the analysis")


class PendingAnalysis(AnalysisSummary):
    """A protocol analysis that is on-going."""

    status: Literal[AnalysisStatus.PENDING] = AnalysisStatus.PENDING


class CompletedAnalysis(AnalysisSummary):
    """A completed protocol run analysis.

    This analyis provides three pieces of information:

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
    # TODO(mc, 2021-09-01): replace string with error details object. Details
    # object should try to distinguish between engine errors, Python execution
    # errors, and unexpected errors due to Opentrons-sourced bugs
    errors: List[str] = Field(
        ...,
        description="Any problems that prevented a conclusive analysis",
    )


ProtocolAnalysis = Union[PendingAnalysis, CompletedAnalysis]
