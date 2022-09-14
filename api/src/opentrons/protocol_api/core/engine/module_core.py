"""Protocol API module implementation logic."""
from ..module import AbstractModuleCore
from .labware import LabwareCore


class ModuleCore(AbstractModuleCore[LabwareCore]):
    """Module core logic implementation for Python protocols."""
