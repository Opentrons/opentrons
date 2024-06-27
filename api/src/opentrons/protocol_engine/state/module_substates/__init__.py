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
from .magnetic_block_substate import MagneticBlockSubState, MagneticBlockId


ModuleSubStateType = Union[
    HeaterShakerModuleSubState,
    MagneticModuleSubState,
    TemperatureModuleSubState,
    ThermocyclerModuleSubState,
    MagneticBlockSubState,
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
    "MagneticBlockSubState",
    "MagneticBlockId",
    # Union of all module substates
    "ModuleSubStateType",
]
