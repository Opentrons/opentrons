from typing import Dict
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.contexts import InstrumentContext


Instruments = Dict[str, InstrumentContext]

LoadedLabware = Dict[str, Labware]
