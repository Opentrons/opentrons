"""Command models for Vacuum Module commands."""

from .start_set_vacuum import (
    StartSetVacuum,
    StartSetVacuumCommandType,
    StartSetVacuumCreate,
    StartSetVacuumParams,
    StartSetVacuumResult,
)
from .stop_vacuum import (
    StopVacuum,
    StopVacuumCommandType,
    StopVacuumCreate,
    StopVacuumParams,
    StopVacuumResult,
)

__all__ = [
    # Stop vacuum command models
    "StopVacuum",
    "StopVacuumCommandType",
    "StopVacuumCreate",
    "StopVacuumParams",
    "StopVacuumResult",
    # start set vacuum command models
    "StartSetVacuum",
    "StartSetVacuumCommandType",
    "StartSetVacuumCreate",
    "StartSetVacuumParams",
    "StartSetVacuumResult",
]
