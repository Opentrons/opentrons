"""Convenience type aliases for ProtocolContext tests."""
from opentrons.protocol_api.core.protocol import AbstractProtocol
from opentrons.protocol_api.core.instrument import AbstractInstrument
from opentrons.protocol_api.core.labware import AbstractLabware
from opentrons.protocol_api.core.module import (
    AbstractModuleCore,
    AbstractTemperatureModuleCore,
    AbstractMagneticModuleCore,
    AbstractThermocyclerCore,
    AbstractHeaterShakerCore,
)
from opentrons.protocol_api.core.well import AbstractWellCore


InstrumentCore = AbstractInstrument[AbstractWellCore]
LabwareCore = AbstractLabware[AbstractWellCore]
ModuleCore = AbstractModuleCore[LabwareCore]
TemperatureModuleCore = AbstractTemperatureModuleCore[LabwareCore]
MagneticModuleCore = AbstractMagneticModuleCore[LabwareCore]
ThermocyclerCore = AbstractThermocyclerCore[LabwareCore]
HeaterShakerCore = AbstractHeaterShakerCore[LabwareCore]
ProtocolCore = AbstractProtocol[InstrumentCore, LabwareCore, ModuleCore]
