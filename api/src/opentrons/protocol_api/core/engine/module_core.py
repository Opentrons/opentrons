"""Protocol API module implementation logic."""
from typing import Optional

from ..module import AbstractModuleCore, AbstractTemperatureModuleCore
from .labware import LabwareCore
from ..labware import LabwareCoreType

from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    ModuleType,
    TemperatureStatus
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


class TemperatureModuleCore(AbstractTemperatureModuleCore):
    """Temperature module core logic implementation for Python protocols.

    Args:
        module_id: ProtocolEngine ID of the loaded modules.
    """
    
    def __init__(self, module_id: str, engine_client: ProtocolEngineClient) -> None:
        self._module_id = module_id
        self._engine_client = engine_client

    def set_target_temperature(self, celsius: float) -> None:
        """Set the Temperature Module's target temperature in °C."""
        raise NotImplementedError("set_target_temperature not implemented")

    def wait_for_target_temperature(self, celsius: Optional[float] = None) -> None:
        """Wait until the module's target temperature is reached.

        Specifying a value for ``celsius`` that is different than
        the module's current target temperature may beahave unpredictably.
        """
        raise NotImplementedError("wait_for_target_temperature not implemented")

    def deactivate(self) -> None:
        """Deactivate the Temperature Module."""
        raise NotImplementedError("deactivate not implemented")

    def get_current_temperature(self) -> float:
        """Get the module's current temperature in °C."""
        raise NotImplementedError("get_current_temperature not implemented")

    def get_target_temperature(self) -> Optional[float]:
        """Get the module's target temperature in °C, if set."""
        raise NotImplementedError("get_target_temperature not implemented")

    def get_status(self) -> TemperatureStatus:
        """Get the module's current temperature status."""
        raise NotImplementedError("get_status not implemented")
