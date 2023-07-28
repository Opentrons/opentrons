"""Response models for protocol analysis."""
# TODO(mc, 2021-08-25): add modules to simulation result
from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Union
from typing_extensions import Literal

from opentrons.protocol_engine import (
    Command,
    ErrorOccurrence,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
    Liquid,
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


class PendingAnalysis(BaseModel):
    """A protocol analysis that is on-going."""

    id: str = Field(..., description="Unique identifier of this analysis resource")
    status: Literal[AnalysisStatus.PENDING] = Field(
        AnalysisStatus.PENDING,
        description="Status marking the analysis as pending",
    )


class CompletedAnalysis(BaseModel):
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

    id: str = Field(..., description="Unique identifier of this analysis resource")
    status: Literal[AnalysisStatus.COMPLETED] = Field(
        AnalysisStatus.COMPLETED,
        description="Status marking the analysis as completed",
    )
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
        description=(
            "Labware used by the protocol."
            "\n\n"
            "If a piece of labware moves between locations as part of the protocol,"
            " its *final* location will be reported in this list,"
            " not its *initial* location."
        ),
    )
    modules: List[LoadedModule] = Field(
        default_factory=list,
        description="Modules that have been loaded into the run.",
    )
    commands: List[Command] = Field(
        ...,
        description="The protocol commands the run is expected to produce",
    )
    errors: List[ErrorOccurrence] = Field(
        ...,
        description=(
            "The protocol's fatal error, if there was one."
            " For historical reasons, this is an array,"
            " but it won't have more than one element."
        ),
    )
    liquids: List[Liquid] = Field(
        default_factory=list,
        description="Liquids used by the protocol",
    )


ProtocolAnalysis = Union[PendingAnalysis, CompletedAnalysis]
