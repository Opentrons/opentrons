from typing import Dict
from opentrons.protocol_api import InstrumentContext, Labware


Instruments = Dict[str, InstrumentContext]

LoadedLabware = Dict[str, Labware]
