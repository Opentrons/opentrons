"""Protocol API module implementation logic."""
from ..module import AbstractModuleCore
from .labware import LabwareCore
from ..labware import LabwareCoreType

from opentrons.hardware_control.modules.types import (
    ModuleModel,
    ModuleType,
)
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.types import DeckSlotName


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

    @property
    def geometry(self) -> ModuleGeometry:
        """Get the module's geometry interface."""
        raise NotImplementedError("geometry not implemented")

    def get_model(self) -> ModuleModel:
        """Get the module's model identifier."""
        raise NotImplementedError("get_model not implemented")

    def get_type(self) -> ModuleType:
        """Get the module's general type identifier."""
        raise NotImplementedError("get_type not implemented")

    def get_requested_model(self) -> ModuleModel:
        """Get the model identifier the module was requested as.

        This may differ from the actual model returned by `get_model`.
        """
        raise NotImplementedError("get_requested_model not implemented")

    def get_serial_number(self) -> str:
        """Get the module's unique hardware serial number."""
        raise NotImplementedError("get_serial_number not implemented")

    def get_deck_slot(self) -> DeckSlotName:
        """Get the module's deck slot."""
        raise NotImplementedError("get_deck_slot not implemented")

    def add_labware_core(self, labware_core: LabwareCoreType) -> None:
        """Add a labware to the module."""
        raise NotImplementedError("add_labware_core not implemented")

