"""Protocol API interfaces for module control."""

from .magnetic_module_context import MagneticModuleContext, MagneticModuleStatus
from .temperature_module_context import TemperatureModuleContext
from .thermocycler_module_context import ThermocyclerModuleContext

__all__ = [
    "MagneticModuleContext",
    "MagneticModuleStatus",
    "TemperatureModuleContext",
    "ThermocyclerModuleContext",
]
