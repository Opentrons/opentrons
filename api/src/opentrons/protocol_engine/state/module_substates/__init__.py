"""Hardware Modules' substates."""

from typing import Union
from .magnetic_module_substate import MagneticModuleSubState, MagneticModuleId
from .heater_shaker_module_substate import (
    HeaterShakerModuleSubState,
    HeaterShakerModuleId,
)
from .temperature_module_substate import TemperatureModuleSubState, TemperatureModuleId
from .thermocycler_module_substate import (
    ThermocyclerModuleSubState,
    ThermocyclerModuleId,
)


ModuleSubStateType = Union[
    HeaterShakerModuleSubState,
    MagneticModuleSubState,
    TemperatureModuleSubState,
    ThermocyclerModuleSubState,
]

__all__ = [
    "MagneticModuleSubState",
    "MagneticModuleId",
    "HeaterShakerModuleSubState",
    "HeaterShakerModuleId",
    "TemperatureModuleSubState",
    "TemperatureModuleId",
    "ThermocyclerModuleSubState",
    "ThermocyclerModuleId",
    # Union of all module substates
    "ModuleSubStateType",
]
