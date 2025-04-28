"""Common APIs for protocol core interfaces."""

# TODO(mc, 2022-08-22): move to __init__ when dependency cycles are resolved
from .instrument import AbstractInstrument
from .labware import AbstractLabware
from .module import (
    AbstractModuleCore,
    AbstractTemperatureModuleCore,
    AbstractMagneticModuleCore,
    AbstractThermocyclerCore,
    AbstractHeaterShakerCore,
    AbstractMagneticBlockCore,
    AbstractAbsorbanceReaderCore,
    AbstractFlexStackerCore,
)
from .protocol import AbstractProtocol
from .well import AbstractWellCore
from .robot import AbstractRobot


WellCore = AbstractWellCore
LabwareCore = AbstractLabware[WellCore]
InstrumentCore = AbstractInstrument[WellCore, LabwareCore]
ModuleCore = AbstractModuleCore[LabwareCore]
TemperatureModuleCore = AbstractTemperatureModuleCore[LabwareCore]
MagneticModuleCore = AbstractMagneticModuleCore[LabwareCore]
ThermocyclerCore = AbstractThermocyclerCore[LabwareCore]
HeaterShakerCore = AbstractHeaterShakerCore[LabwareCore]
MagneticBlockCore = AbstractMagneticBlockCore[LabwareCore]
AbsorbanceReaderCore = AbstractAbsorbanceReaderCore[LabwareCore]
FlexStackerCore = AbstractFlexStackerCore[LabwareCore]
RobotCore = AbstractRobot
ProtocolCore = AbstractProtocol[InstrumentCore, LabwareCore, ModuleCore]
