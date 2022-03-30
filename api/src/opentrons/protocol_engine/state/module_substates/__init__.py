"""Hardware Modules' substates."""

from typing import Union
from .magnetic_module_substate import MagneticModuleSubState, MagneticModuleId
from .heater_shaker_module_substate import (
    HeaterShakerModuleSubState,
    HeaterShakerModuleId,
)

ModuleViewTypes = Union[HeaterShakerModuleSubState, MagneticModuleSubState]

__all__ = [
    "MagneticModuleSubState",
    "MagneticModuleId",
    "HeaterShakerModuleSubState",
    "HeaterShakerModuleId",
    "ModuleViewTypes",
]
