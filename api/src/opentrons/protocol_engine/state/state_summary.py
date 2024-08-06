"""Public protocol run data models."""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from ..errors import ErrorOccurrence
from ..types import (
    EngineStatus,
    LoadedLabware,
    LabwareOffset,
    LoadedModule,
    LoadedPipette,
    Liquid,
)


class StateSummary(BaseModel):
    """Data from a protocol run."""

    status: EngineStatus
    # errors is a list for historical reasons. (This model needs to stay compatible with
    # robot-server's database.) It shouldn't have more than 1 element.
    errors: List[ErrorOccurrence]
    hasEverEnteredErrorRecovery: bool = Field(default=False)
    labware: List[LoadedLabware]
    pipettes: List[LoadedPipette]
    modules: List[LoadedModule]
    labwareOffsets: List[LabwareOffset]
    startedAt: Optional[datetime]
    completedAt: Optional[datetime]
    liquids: List[Liquid] = Field(default_factory=list)
