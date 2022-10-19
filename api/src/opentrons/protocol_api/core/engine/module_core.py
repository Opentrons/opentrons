"""Protocol API module implementation logic."""
from typing import Optional

from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    ModuleType,
    TemperatureStatus,
    MagneticStatus,
)
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.types import DeckSlotName

from ..module import (
    AbstractModuleCore,
    AbstractTemperatureModuleCore,
    AbstractMagneticModuleCore,
)
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

    def add_labware_core(self, labware_core: LabwareCore) -> None:
        """Add a labware to the module."""
        raise NotImplementedError("add_labware_core not implemented")


class TemperatureModuleCore(ModuleCore, AbstractTemperatureModuleCore[LabwareCore]):
    """Temperature Module core logic implementation for Python protocols."""

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


class MagneticModuleCore(ModuleCore, AbstractMagneticModuleCore[LabwareCore]):
    """Magnetic Module control interface via a ProtocolEngine."""

    def engage(
        self,
        height_from_base: Optional[float] = None,
        height_from_home: Optional[float] = None,
    ) -> None:
        """Raise the module's magnets.

        Only one of `height_from_base` or `height_from_home` may be specified.

        Args:
            height_from_base: Distance from labware base to raise the magnets.
            height_from_home: Distance from motor home position to raise the magnets.
        """
        raise NotImplementedError("MagneticCore")

    def engage_to_labware(
        self, offset: float = 0, preserve_half_mm: bool = False
    ) -> None:
        """Raise the module's magnets up to its loaded labware.

        Args:
            offset: Offset from the labware's default engage height.
            preserve_half_mm: For labware whose definitions
                erroneously use half-mm for their defined default engage height,
                use the value directly instead of converting it to real millimeters.

        Raises:
            Exception: Labware is not loaded or has no default engage height.
        """
        raise NotImplementedError("MagneticCore")

    def disengage(self) -> None:
        """Lower the magnets back into the module."""
        raise NotImplementedError("MagneticCore")

    def get_status(self) -> MagneticStatus:
        """Get the module's current magnet status."""
        raise NotImplementedError("MagneticCore")
