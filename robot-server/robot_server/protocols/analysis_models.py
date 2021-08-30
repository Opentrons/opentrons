"""Response models for protocol analysis."""
# TODO(mc, 2021-08-25): add modules to simulation result
from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Union
from typing_extensions import Literal

from opentrons.types import MountType
from opentrons.protocol_engine import (
    Command as EngineCommand,
    PipetteName,
    LabwareLocation,
)


class AnalysisStatus(str, Enum):
    """Status of a protocol analysis."""

    PENDING = "pending"
    FAILED = "failed"
    SUCCEEDED = "succeeded"


class BaseAnalysis(BaseModel):
    """Base model for an analyis of a protocol."""

    status: AnalysisStatus = Field(..., description="Status of the analysis")


class PendingAnalysis(BaseAnalysis):
    """A protocol analysis that is on-going."""

    status: Literal[AnalysisStatus.PENDING] = AnalysisStatus.PENDING


class AnalysisPipette(BaseModel):
    """A pipette that the protocol is expected to use, based on the analysis."""

    id: str
    pipetteName: PipetteName
    mount: MountType


class AnalysisLabware(BaseModel):
    """A labware that the protocol is expected to use, based on the analysis."""

    id: str
    loadName: str
    definitionUri: str
    location: LabwareLocation


class CompletedAnalysis(BaseAnalysis):
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

    status: Union[
        Literal[AnalysisStatus.SUCCEEDED],
        Literal[AnalysisStatus.FAILED],
    ] = Field(
        ...,
        description="Whether the protocol is expected to run successfully",
    )
    pipettes: List[AnalysisPipette] = Field(
        ...,
        description="Pipettes used by the protocol",
    )
    labware: List[AnalysisLabware] = Field(
        ...,
        description="Labware used by the protocol",
    )
    commands: List[EngineCommand] = Field(
        ...,
        description="The protocol commands the run is expected to produce",
    )
    errors: List[str] = Field(
        ...,
        description="Any expected run errors or problems with the analysis",
    )


ProtocolAnalysis = Union[PendingAnalysis, CompletedAnalysis]
