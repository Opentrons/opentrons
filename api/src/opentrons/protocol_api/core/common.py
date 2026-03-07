"""Common APIs for protocol core interfaces."""

# TODO(mc, 2022-08-22): move to __init__ when dependency cycles are resolved
from .instrument import AbstractInstrument
from .labware import AbstractLabware
from .module import (
    AbstractAbsorbanceReaderCore,
    AbstractFlexStackerCore,
    AbstractHeaterShakerCore,
    AbstractMagneticBlockCore,
    AbstractMagneticModuleCore,
    AbstractModuleCore,
    AbstractTemperatureModuleCore,
    AbstractThermocyclerCore,
    AbstractVacuumModuleCore,
)
from .protocol import AbstractProtocol
from .robot import AbstractRobot
from .tasks import AbstractTaskCore
from .well import AbstractWellCore

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
VacuumModuleCore = AbstractVacuumModuleCore[LabwareCore]
RobotCore = AbstractRobot
TaskCore = AbstractTaskCore
ProtocolCore = AbstractProtocol[InstrumentCore, LabwareCore, ModuleCore, TaskCore]
