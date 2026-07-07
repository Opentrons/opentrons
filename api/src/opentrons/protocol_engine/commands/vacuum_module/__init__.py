"""Command models for Vacuum Module commands."""

from .close_vent import (
    CloseVent,
    CloseVentCommandType,
    CloseVentCreate,
    CloseVentParams,
    CloseVentResult,
)
from .common import (
    VacuumModuleCarboyFullError,
    VacuumPressureNotReachedError,
)
from .open_vent import (
    OpenVent,
    OpenVentCommandType,
    OpenVentCreate,
    OpenVentParams,
    OpenVentResult,
)
from .start_run_profile import (
    ProfileType,
    StartRunProfile,
    StartRunProfileCommandType,
    StartRunProfileCreate,
    StartRunProfileParams,
    StartRunProfileResult,
    StartRunProfileStepParams,
    VacuumModuleProfileCycle,
    VacuumModuleProfilePowerStep,
    VacuumModuleProfilePressureStep,
)
from .start_set_vacuum_power import (
    StartSetVacuumPower,
    StartSetVacuumPowerCommandType,
    StartSetVacuumPowerCreate,
    StartSetVacuumPowerParams,
    StartSetVacuumPowerResult,
)
from .start_set_vacuum_pressure import (
    StartSetVacuumPressure,
    StartSetVacuumPressureCommandType,
    StartSetVacuumPressureCreate,
    StartSetVacuumPressureParams,
    StartSetVacuumPressureResult,
)
from .stop_vacuum import (
    StopVacuum,
    StopVacuumCommandType,
    StopVacuumCreate,
    StopVacuumParams,
    StopVacuumResult,
)

__all__ = [
    # Vacuum module defined errors
    "VacuumModuleCarboyFullError",
    "VacuumPressureNotReachedError",
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
    # start set vacuum power command models
    "StartSetVacuumPower",
    "StartSetVacuumPowerCommandType",
    "StartSetVacuumPowerCreate",
    "StartSetVacuumPowerParams",
    "StartSetVacuumPowerResult",
    # open vent command models
    "OpenVent",
    "OpenVentCommandType",
    "OpenVentCreate",
    "OpenVentParams",
    "OpenVentResult",
    # close vent command models
    "CloseVent",
    "CloseVentCommandType",
    "CloseVentCreate",
    "CloseVentParams",
    "CloseVentResult",
    # run profile command models
    "StartRunProfile",
    "StartRunProfileCommandType",
    "StartRunProfileCreate",
    "StartRunProfileParams",
    "StartRunProfileResult",
    "VacuumModuleProfileCycle",
    "VacuumModuleProfilePowerStep",
    "VacuumModuleProfilePressureStep",
    "ProfileType",
    "StartRunProfileStepParams",
]
