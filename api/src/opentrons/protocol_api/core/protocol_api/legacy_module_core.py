"""Legacy Protocol API module implementation logic."""
from typing import cast

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import AbstractModule
from opentrons.hardware_control.modules.types import ModuleModel, ModuleType
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.types import DeckSlotName

from ..module import AbstractModuleCore
from .labware import LabwareImplementation


class LegacyModuleCore(AbstractModuleCore[LabwareImplementation]):
    """Legacy ModuleCore implementation for pre-ProtocolEngine protocols."""

    def __init__(
        self,
        sync_module_hardware: SynchronousAdapter[AbstractModule],
        requested_model: ModuleModel,
        geometry: ModuleGeometry,
    ) -> None:
        self._sync_module_hardware = sync_module_hardware
        self._requested_model = requested_model
        self._geometry = geometry

    @property
    def geometry(self) -> ModuleGeometry:
        return self._geometry

    def get_model(self) -> ModuleModel:
        """Get the module's model identifier."""
        return self._geometry.model

    def get_type(self) -> ModuleType:
        """Get the module's general type."""
        return self._geometry.module_type

    def get_requested_model(self) -> ModuleModel:
        """Get the model identifier the module was requested as.

        This may differ from the actual model returned by `get_model`.
        """
        return self._requested_model

    def get_serial_number(self) -> str:
        """Get the module's unique hardware serial number."""
        device_info = self._sync_module_hardware.device_info
        return cast(str, device_info["serial"])

    def get_deck_slot(self) -> DeckSlotName:
        """Get the module's deck slot."""
        return DeckSlotName.from_primitive(self._geometry.parent)  # type: ignore[arg-type]
