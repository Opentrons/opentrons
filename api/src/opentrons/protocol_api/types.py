from typing import Dict
from .labware import Labware
from .contexts import InstrumentContext


Instruments = Dict[str, InstrumentContext]

LoadedLabware = Dict[str, Labware]
