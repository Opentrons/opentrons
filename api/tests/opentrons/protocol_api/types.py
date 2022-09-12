"""Convenience type aliases for ProtocolContext tests."""
from opentrons.protocol_api.core.protocol import AbstractProtocol
from opentrons.protocol_api.core.instrument import AbstractInstrument
from opentrons.protocol_api.core.labware import AbstractLabware
from opentrons.protocol_api.core.well import AbstractWellCore


InstrumentCore = AbstractInstrument[AbstractWellCore]
LabwareCore = AbstractLabware[AbstractWellCore]
ProtocolCore = AbstractProtocol[InstrumentCore, LabwareCore]
