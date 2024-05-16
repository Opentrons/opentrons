"""Hardware Modules' substates."""

from typing import Union

from .heater_shaker_module_substate import (
    HeaterShakerModuleId,
    HeaterShakerModuleSubState,
)
from .magnetic_block_substate import MagneticBlockId, MagneticBlockSubState
from .magnetic_module_substate import MagneticModuleId, MagneticModuleSubState
from .temperature_module_substate import TemperatureModuleId, TemperatureModuleSubState
from .thermocycler_module_substate import (
    ThermocyclerModuleId,
    ThermocyclerModuleSubState,
)

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
