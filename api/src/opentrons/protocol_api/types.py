from typing import Any, Callable, Dict
from .labware import Labware
from .contexts import InstrumentContext, ProtocolContext, \
    MagneticModuleContext, TemperatureModuleContext

Instruments = Dict[str, InstrumentContext]

LoadedLabware = Dict[str, Labware]

DelayHandler = Callable[[Any, Any], None]

MoveToSlotHandler = Callable[[ProtocolContext, Instruments, Any], None]

PipetteHandler = Callable[[Instruments, LoadedLabware, Any], None]

MagneticModuleHandler = Callable[[MagneticModuleContext, Any], None]

TemperatureModuleHandler = Callable[[TemperatureModuleContext, Any], None]
