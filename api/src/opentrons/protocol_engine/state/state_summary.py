"""Public protocol run data models."""
from pydantic import BaseModel
from typing import List

from ..errors import ErrorOccurrence
from ..types import (
    EngineStatus,
    LoadedLabware,
    LabwareOffset,
    LoadedModule,
    LoadedPipette,
)


class StateSummary(BaseModel):
    """Data from a protocol run."""

    status: EngineStatus
    errors: List[ErrorOccurrence]
    labware: List[LoadedLabware]
    pipettes: List[LoadedPipette]
    modules: List[LoadedModule]
    labwareOffsets: List[LabwareOffset]
