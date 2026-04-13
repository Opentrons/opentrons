"""Command models for Vacuum Module commands."""

from .start_set_vacuum_pressure import (
    StartSetVacuumPressure,
    StartSetVacuumPressureCommandType,
    StartSetVacuumPressureCreate,
    StartSetVacuumPressureParams,
    StartSetVacuumPressureResult,
)
from .start_set_vacuum_pump import (
    StartSetVacuumPump,
    StartSetVacuumPumpCommandType,
    StartSetVacuumPumpCreate,
    StartSetVacuumPumpParams,
    StartSetVacuumPumpResult,
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
    # start set vacuum pressure command models
    "StartSetVacuumPressure",
    "StartSetVacuumPressureCommandType",
    "StartSetVacuumPressureCreate",
    "StartSetVacuumPressureParams",
    "StartSetVacuumPressureResult",
    # start set vacuum pump command models
    "StartSetVacuumPump",
    "StartSetVacuumPumpCommandType",
    "StartSetVacuumPumpCreate",
    "StartSetVacuumPumpParams",
    "StartSetVacuumPumpResult",
]
