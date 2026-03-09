"""Hardware Modules' substates."""

from typing import Union

from .absorbance_reader_substate import AbsorbanceReaderId, AbsorbanceReaderSubState
from .flex_stacker_substate import FlexStackerId, FlexStackerSubState
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
    AbsorbanceReaderSubState,
    FlexStackerSubState,
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
    "AbsorbanceReaderSubState",
    "AbsorbanceReaderId",
    "FlexStackerSubState",
    "FlexStackerId",
    # Union of all module substates
    "ModuleSubStateType",
]
