from typing import Any, Callable, Dict, List
from dataclasses import dataclass
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

# Deck definition types

@dataclass
class CalibrationPosition:
    """
    A point on the deck of a robot that is used to calibrate
    aspects of the robot's movement system as defined by
    opentrons/shared-data/deck/schemas/2.json
    """
    id: str
    position: List[float]
    displayName: str