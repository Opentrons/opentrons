"""Legacy Protocol API module implementation logic."""
import logging
from typing import Optional, cast

from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control import SynchronousAdapter, modules as hw_modules
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    ModuleType,
    TemperatureStatus,
    MagneticStatus,
    SpeedStatus,
    MagneticModuleModel,
)
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.types import DeckSlotName

from ..module import (
    AbstractModuleCore,
    AbstractTemperatureModuleCore,
    AbstractMagneticModuleCore,
    AbstractHeaterShakerCore,
)
from .labware import LabwareImplementation


_log = logging.getLogger(__name__)


class LegacyModuleCore(AbstractModuleCore[LabwareImplementation]):
    """Legacy ModuleCore implementation for pre-ProtocolEngine protocols."""

    def __init__(
        self,
        sync_module_hardware: SynchronousAdapter[hw_modules.AbstractModule],
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

    def add_labware_core(self, labware_core: LabwareImplementation) -> None:
        """Add a labware to the module."""
        pass


class LegacyTemperatureModuleCore(
    LegacyModuleCore, AbstractTemperatureModuleCore[LabwareImplementation]
):
    """Legacy core control implementation for an attached Temperature Module."""

    _sync_module_hardware: SynchronousAdapter[hw_modules.TempDeck]

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

    _sync_module_hardware: SynchronousAdapter[hw_modules.MagDeck]

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
        # TODO(mc, 2022-09-23): update when HW API uses real millimeters
        # https://opentrons.atlassian.net/browse/RET-1242
        if height_from_base is not None:
            self._sync_module_hardware.engage(height_from_base=height_from_base)
        else:
            assert height_from_home is not None, "Engage height must be specified"
            self._sync_module_hardware.engage(height=height_from_home)

    def engage_to_labware(
        self,
        offset: float = 0,
        preserve_half_mm: bool = False,
    ) -> None:
        """Raise the module's magnets up to its loaded labware.

        Args:
            offset: Offset from the labware's default engage height.
            preserve_half_mm: Preserve any values that may accidentally be in half-mm,
                passing them directly onwards to the hardware control API.

        Raises:
            ValueError: Labware is not loaded or has no default engage height.
        """
        labware = self._geometry.labware

        if labware is None:
            raise ValueError(
                "No labware loaded in Magnetic Module;"
                " you must specify an engage height explicitly"
                " using `height_from_base` or `height`"
            )

        engage_height = labware._implementation.get_default_magnet_engage_height(
            preserve_half_mm
        )

        if engage_height is None:
            raise ValueError(
                f"Currently loaded labware {labware} does not have"
                " a default engage height; specify engage height explicitly"
                " using `height_from_base` or `height`"
            )

        if (
            self._geometry.model == MagneticModuleModel.MAGNETIC_V1
            and not preserve_half_mm
        ):
            engage_height *= 2

        # TODO(mc, 2022-09-23): use real millimeters instead of model-dependent mm
        # https://opentrons.atlassian.net/browse/RET-1242
        # TODO(mc, 2022-09-23): use `height_from_base` to match JSONv5
        # https://opentrons.atlassian.net/browse/RSS-110
        self._sync_module_hardware.engage(height=engage_height + offset)

    def disengage(self) -> None:
        """Lower the magnets back into the module."""
        self._sync_module_hardware.deactivate()

    def get_status(self) -> MagneticStatus:
        """Get the module's current magnet status."""
        return self._sync_module_hardware.status  # type: ignore[no-any-return]

    def add_labware_core(self, labware_core: LabwareImplementation) -> None:
        """Add a labware to the module."""
        if labware_core.get_default_magnet_engage_height() is None:
            name = labware_core.get_name()
            _log.warning(
                f"The labware definition for {name} does not define a"
                " default engagement height for use with the Magnetic Module;"
                " you must specify a height explicitly when calling engage()."
            )


class LegacyHeaterShakerCore(
    LegacyModuleCore, AbstractHeaterShakerCore[LabwareImplementation]
):
    """Core control interface for an attached Heater-Shaker Module."""

    _sync_module_hardware: SynchronousAdapter[hw_modules.HeaterShaker]

    def set_target_temperature(self, celsius: float) -> None:
        """Set the labware plate's target temperature in °C."""
        self._sync_module_hardware.start_set_temperature(celsius)

    def wait_for_target_temperature(self) -> None:
        """Wait for the labware plate's target temperature to be reached."""
        self._sync_module_hardware.await_temperature()

    def set_and_wait_for_shake_speed(self, rpm: int) -> None:
        """Set the shaker's target shake speed and wait for it to spin up."""
        self._sync_module_hardware.set_speed(rpm=rpm)

    def open_labware_latch(self) -> None:
        """Open the labware latch."""
        self._sync_module_hardware.open_labware_latch()

    def close_labware_latch(self) -> None:
        """Close the labware latch."""
        self._sync_module_hardware.close_labware_latch()

    def deactivate_shaker(self) -> None:
        """Stop shaking."""
        self._sync_module_hardware.deactivate_shaker()

    def deactivate_heater(self) -> None:
        """Stop heating."""
        self._sync_module_hardware.deactivate_heater()

    def get_current_temperature(self) -> float:
        """Get the labware plate's current temperature in °C."""
        return self._sync_module_hardware.temperature  # type: ignore[no-any-return]

    def get_target_temperature(self) -> Optional[float]:
        """Get the labware plate's target temperature in °C, if set."""
        return self._sync_module_hardware.target_temperature  # type: ignore[no-any-return]

    def get_current_speed(self) -> int:
        """Get the shaker's current speed in RPM."""
        return self._sync_module_hardware.speed  # type: ignore[no-any-return]

    def get_target_speed(self) -> Optional[int]:
        """Get the shaker's target speed in RPM, if set."""
        return self._sync_module_hardware.target_speed  # type: ignore[no-any-return]

    def get_temperature_status(self) -> TemperatureStatus:
        """Get the module's heater status."""
        return self._sync_module_hardware.temperature_status  # type: ignore[no-any-return]

    def get_speed_status(self) -> SpeedStatus:
        """Get the module's heater status."""
        return self._sync_module_hardware.speed_status  # type: ignore[no-any-return]

    def get_labware_latch_status(self) -> HeaterShakerLabwareLatchStatus:
        """Get the module's labware latch status."""
        return self._sync_module_hardware.labware_latch_status  # type: ignore[no-any-return]


def create_module_core(
    module_hardware_api: hw_modules.AbstractModule,
    requested_model: ModuleModel,
    geometry: ModuleGeometry,
) -> LegacyModuleCore:
    core_cls = LegacyModuleCore

    if isinstance(module_hardware_api, hw_modules.TempDeck):
        core_cls = LegacyTemperatureModuleCore
    elif isinstance(module_hardware_api, hw_modules.MagDeck):
        core_cls = LegacyMagneticModuleCore
    elif isinstance(module_hardware_api, hw_modules.HeaterShaker):
        core_cls = LegacyHeaterShakerCore

    return core_cls(
        sync_module_hardware=SynchronousAdapter(module_hardware_api),
        requested_model=requested_model,
        geometry=geometry,
    )
