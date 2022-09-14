"""Legacy Protocol API module implementation logic."""
from ..module import AbstractModuleCore
from .labware import LabwareImplementation


class LegacyModuleCore(AbstractModuleCore[LabwareImplementation]):
    """Legacy ModuleCore implementation for pre-ProtocolEngine protocols."""
