"""Legacy Protocol API module implementation logic."""
from typing import Optional, cast

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import AbstractModule, TempDeck, MagDeck
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


class LegacyTemperatureModuleCore(
    LegacyModuleCore, AbstractTemperatureModuleCore[LabwareImplementation]
):
    """Legacy core control implementation for an attached Temperature Module."""

    _sync_module_hardware: SynchronousAdapter[TempDeck]

    def set_target_temperature(self, celsius: float) -> None:
        """Set the Temperature Module's target temperature in °C."""
        self._sync_module_hardware.start_set_temperature(celsius)

    def wait_for_target_temperature(self, celsius: Optional[float] = None) -> None:
        """Wait until the module's target temperature is reached.

        Specifying a value for ``celsius`` that is different than
        the module's current target temperature may beahave unpredictably.
        """
        self._sync_module_hardware.await_temperature(celsius)

    def deactivate(self) -> None:
        """Deactivate the Temperature Module."""
        self._sync_module_hardware.deactivate()

    def get_current_temperature(self) -> float:
        """Get the module's current temperature in °C."""
        return self._sync_module_hardware.temperature  # type: ignore[no-any-return]

    def get_target_temperature(self) -> Optional[float]:
        """Get the module's target temperature in °C, if set."""
        return self._sync_module_hardware.target  # type: ignore[no-any-return]

    def get_status(self) -> TemperatureStatus:
        """Get the module's current temperature status."""
        return self._sync_module_hardware.status  # type: ignore[no-any-return]


class LegacyMagneticModuleCore(
    LegacyModuleCore, AbstractMagneticModuleCore[LabwareImplementation]
):
    """Core control interface for an attached Magnetic Module."""

    _sync_module_hardware: SynchronousAdapter[MagDeck]

    def engage(
        self,
        height_from_base: Optional[float] = None,
        height_from_home: Optional[float] = None,
        offset_from_labware_default: Optional[float] = None,
    ) -> None:
        """Raise the module's magnets.

        Only one of `height_from_base`, `offset_from_labware_default`,
        or `height_from_home` may be specified.
        All distance units are specified in real millimeters.

        Args:
            height_from_base: Distance from labware base to raise the magnets.
            height_from_base: Distance from motor home position to raise the magnets.
            offset_from_labware_default: Offset from the default engage height
                of the module's loaded labware to raise the magnets.
        """
        raise NotImplementedError("engage")

    def disengage(self) -> None:
        """Lower the magnets back into the module."""
        self._sync_module_hardware.deactivate()

    def get_status(self) -> MagneticStatus:
        """Get the module's current magnet status."""
        return self._sync_module_hardware.status  # type: ignore[no-any-return]


def create_module_core(
    module_hardware_api: AbstractModule,
    requested_model: ModuleModel,
    geometry: ModuleGeometry,
) -> LegacyModuleCore:
    core_cls = LegacyModuleCore

    if isinstance(module_hardware_api, TempDeck):
        core_cls = LegacyTemperatureModuleCore
    elif isinstance(module_hardware_api, MagDeck):
        core_cls = LegacyMagneticModuleCore

    return core_cls(
        sync_module_hardware=SynchronousAdapter(module_hardware_api),
        requested_model=requested_model,
        geometry=geometry,
    )
