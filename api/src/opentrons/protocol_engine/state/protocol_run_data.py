"""Public protocol run data models."""
from pydantic import BaseModel
from typing import List

from ..commands import Command
from ..errors import ErrorOccurrence
from ..types import LoadedLabware, LabwareOffset, LoadedModule, LoadedPipette


class ProtocolRunData(BaseModel):
    """Data from a protocol run."""

    commands: List[Command]
    errors: List[ErrorOccurrence]
    labware: List[LoadedLabware]
    pipettes: List[LoadedPipette]
    modules: List[LoadedModule]
    labwareOffsets: List[LabwareOffset]
