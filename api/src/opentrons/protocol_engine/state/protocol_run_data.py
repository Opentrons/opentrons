from pydantic import BaseModel
from typing import List

from .commands import Command, ErrorOccurrence
from .labware import LoadedLabware, LabwareOffset
from .modules import LoadedModule
from .pipettes import LoadedPipette

class ProtocolRunData(BaseModel):
    """Data from a protocol run."""

    commands: List[Command]
    errors: List[ErrorOccurrence]
    labware: List[LoadedLabware]
    pipettes: List[LoadedPipette]
    modules: List[LoadedModule]
    labwareOffsets: List[LabwareOffset]