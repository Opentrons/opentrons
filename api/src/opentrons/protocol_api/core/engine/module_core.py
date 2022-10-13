"""Protocol API module implementation logic."""
from ..module import AbstractModuleCore
from .labware import LabwareCore


class ModuleCore(AbstractModuleCore[LabwareCore]):
    """Module core logic implementation for Python protocols.

    Args:
        module_id: ProtocolEngine ID of the loaded modules.
    """

    def __init__(self, module_id: str) -> None:
        self._module_id = module_id

    @property
    def module_id(self) -> str:
        """The module's unique ProtocolEngine ID."""
        return self._module_id
