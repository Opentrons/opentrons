"""Protocol API module implementation logic."""
from typing import Optional, List

from opentrons.hardware_control import SynchronousAdapter, modules as hw_modules
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    ModuleType,
    TemperatureStatus,
    MagneticStatus,
    ThermocyclerStep,
    SpeedStatus,
)
from opentrons.drivers.types import (
    HeaterShakerLabwareLatchStatus,
    ThermocyclerLidStatus,
)
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.types import DeckSlotName
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.protocol_api import Labware
from opentrons.protocols.api_support.types import APIVersion

from ..module import (
    AbstractModuleCore,
    AbstractTemperatureModuleCore,
    AbstractMagneticModuleCore,
    AbstractThermocyclerCore,
    AbstractHeaterShakerCore,
)
from .labware import LabwareCore


class ModuleCore(AbstractModuleCore[LabwareCore]):
    """Module core logic implementation for Python protocols.

    Args:
        module_id: ProtocolEngine ID of the loaded modules.
    """

    def __init__(
        self,
        module_id: str,
        engine_client: ProtocolEngineClient,
        api_version: APIVersion,
        sync_module_hardware: SynchronousAdapter[hw_modules.AbstractModule],
    ) -> None:
        self._module_id = module_id
        self._engine_client = engine_client
        self._api_version = api_version
        self._sync_module_hardware = sync_module_hardware

    @property
    def api_version(self) -> APIVersion:
        """Get the api version protocol module target."""
        return self._api_version

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
        return self._engine_client.state.modules.get_location(self.module_id).slotName

    def add_labware_core(self, labware_core: LabwareCore) -> Labware:
        """Add a labware to the module."""
        return Labware(implementation=labware_core, api_version=self._api_version)


class TemperatureModuleCore(ModuleCore, AbstractTemperatureModuleCore[LabwareCore]):
    """Temperature Module core logic implementation for Python protocols."""

    _sync_module_hardware: SynchronousAdapter[hw_modules.TempDeck]

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
        raise NotImplementedError("engage not implemented")

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
        raise NotImplementedError("engage_to_labware not implemented")

    def disengage(self) -> None:
        """Lower the magnets back into the module."""
        raise NotImplementedError("disengage not implemented")

    def get_status(self) -> MagneticStatus:
        """Get the module's current magnet status."""
        raise NotImplementedError("get_status not implemented")


class ThermocyclerModuleCore(ModuleCore, AbstractThermocyclerCore[LabwareCore]):
    """Core control interface for an attached Thermocycler Module."""

    _sync_module_hardware: SynchronousAdapter[hw_modules.Thermocycler]

    def open_lid(self) -> ThermocyclerLidStatus:
        """Open the Thermocycler's lid."""
        raise NotImplementedError("open_lid not implemeted")

    def close_lid(self) -> ThermocyclerLidStatus:
        """Close the Thermocycler's lid."""
        raise NotImplementedError("close_lid not implemented")

    def set_target_block_temperature(
        self,
        celsius: float,
        hold_time_seconds: Optional[float] = None,
        block_max_volume: Optional[float] = None,
    ) -> None:
        """Set the target temperature for the well block, in °C.

        Note:
            If ``hold_time_seconds`` is not specified, the Thermocycler
            will proceed to the next command after ``temperature`` is reached.
        Args:
            celsius: The target temperature, in °C.
            hold_time_seconds: The number of seconds to hold, after reaching
                ``temperature``, before proceeding to the next command.
            block_max_volume: The maximum volume of any individual well
                of the loaded labware. If not supplied, the thermocycler
                will default to 25µL/well.
        """
        raise NotImplementedError("set_target_block_temperature not implemented")

    def wait_for_block_temperature(self) -> None:
        """Wait for target block temperature to be reached."""
        raise NotImplementedError("wait_for_block_temperature not implemented")

    def set_target_lid_temperature(self, celsius: float) -> None:
        """Set the target temperature for the heated lid, in °C."""
        raise NotImplementedError("set_target_lid_temperature not implemented")

    def wait_for_lid_temperature(self) -> None:
        """Wait for target lid temperature to be reached."""
        raise NotImplementedError("wait_for_lid_temperature not implemented")

    def execute_profile(
        self,
        steps: List[ThermocyclerStep],
        repetitions: int,
        block_max_volume: Optional[float] = None,
    ) -> None:
        """Execute a Thermocycler Profile.

        Profile defined as a cycle of ``steps`` to repeat for a given number of ``repetitions``

        Note:
            Unlike the :py:meth:`set_block_temperature`, either or both of
            'hold_time_minutes' and 'hold_time_seconds' must be defined
            and finite for each step.
        Args:
            steps: List of unique steps that make up a single cycle.
                Each list item should be a dictionary that maps to
                the parameters of the :py:meth:`set_block_temperature`
                method with keys 'temperature', 'hold_time_seconds',
                and 'hold_time_minutes'.
            repetitions: The number of times to repeat the cycled steps.
            block_max_volume: The maximum volume of any individual well
                of the loaded labware. If not supplied, the thermocycler
                will default to 25µL/well.
        """
        raise NotImplementedError("execute_profile not implemented")

    def deactivate_lid(self) -> None:
        """Turn off the heated lid."""
        raise NotImplementedError("deactivate_lid not implemented")

    def deactivate_block(self) -> None:
        """Turn off the well block temperature controller"""
        raise NotImplementedError("deactivate_block not implemented")

    def deactivate(self) -> None:
        """Turn off the well block temperature controller, and heated lid"""
        raise NotImplementedError("deactivate not implemented")

    def get_lid_position(self) -> Optional[ThermocyclerLidStatus]:
        """Get the thermocycler's lid position."""
        raise NotImplementedError("get_lid_position not implemented")

    def get_block_temperature_status(self) -> TemperatureStatus:
        """Get the thermocycler's block temperature status."""
        raise NotImplementedError("get_block_temperature_status not implemented")

    def get_lid_temperature_status(self) -> Optional[TemperatureStatus]:
        """Get the thermocycler's lid temperature status."""
        raise NotImplementedError("get_lid_temperature_status not implemented")

    def get_block_temperature(self) -> Optional[float]:
        """Get the thermocycler's current block temperature in °C."""
        raise NotImplementedError("get_block_temperature not implemented")

    def get_block_target_temperature(self) -> Optional[float]:
        """Get the thermocycler's target block temperature in °C."""
        raise NotImplementedError("get_block_target_temperature not implemented")

    def get_lid_temperature(self) -> Optional[float]:
        """Get the thermocycler's current lid temperature in °C."""
        raise NotImplementedError("get_lid_temperature not implemented")

    def get_lid_target_temperature(self) -> Optional[float]:
        """Get the thermocycler's target lid temperature in °C."""
        raise NotImplementedError("get_lid_target_temperature not implemented")

    def get_ramp_rate(self) -> Optional[float]:
        """Get the thermocycler's current rampe rate in °C/sec."""
        raise NotImplementedError("get_ramp_rate not implemented")

    def get_hold_time(self) -> Optional[float]:
        """Get the remaining hold time in seconds."""
        raise NotImplementedError("get_hold_time not implemented")

    def get_total_cycle_count(self) -> Optional[int]:
        """Get number of repetitions for current set cycle."""
        raise NotImplementedError("get_total_cycle_count not implemented")

    def get_current_cycle_index(self) -> Optional[int]:
        """Get index of the current set cycle repetition."""
        raise NotImplementedError("get_current_cycle_index not implemented")

    def get_total_step_count(self) -> Optional[int]:
        """Get number of steps within the current cycle."""
        raise NotImplementedError("get_total_step_count not implemented")

    def get_current_step_index(self) -> Optional[int]:
        """Get the index of the current step within the current cycle."""
        raise NotImplementedError("get_current_step_index not implemented")


class HeaterShakerModuleCore(ModuleCore, AbstractHeaterShakerCore[LabwareCore]):
    """Core control interface for an attached Heater-Shaker Module."""

    _sync_module_hardware: SynchronousAdapter[hw_modules.HeaterShaker]

    def set_target_temperature(self, celsius: float) -> None:
        """Set the labware plate's target temperature in °C."""
        raise NotImplementedError("set_target_temperature not implemented")

    def wait_for_target_temperature(self) -> None:
        """Wait for the labware plate's target temperature to be reached."""
        raise NotImplementedError("wait_for_target_temperature not implemented")

    def set_and_wait_for_shake_speed(self, rpm: int) -> None:
        """Set the shaker's target shake speed and wait for it to spin up."""
        raise NotImplementedError("set_and_wait_for_shake_speed not implemented")

    def open_labware_latch(self) -> None:
        """Open the labware latch."""
        raise NotImplementedError("open_labware_latch not implemented")

    def close_labware_latch(self) -> None:
        """Close the labware latch."""
        raise NotImplementedError("close_labware_latch not implemented")

    def deactivate_shaker(self) -> None:
        """Stop shaking."""
        raise NotImplementedError("deactivate_shaker not implemented")

    def deactivate_heater(self) -> None:
        """Stop heating."""
        raise NotImplementedError("deactivate_heater not implemented")

    def get_current_temperature(self) -> float:
        """Get the labware plate's current temperature in °C."""
        raise NotImplementedError("not implemented")

    def get_target_temperature(self) -> Optional[float]:
        """Get the labware plate's target temperature in °C, if set."""
        raise NotImplementedError("get_current_temperature not implemented")

    def get_current_speed(self) -> int:
        """Get the shaker's current speed in RPM."""
        raise NotImplementedError("get_current_speed not implemented")

    def get_target_speed(self) -> Optional[int]:
        """Get the shaker's target speed in RPM, if set."""
        raise NotImplementedError("get_target_speed not implemented")

    def get_temperature_status(self) -> TemperatureStatus:
        """Get the module's heater status."""
        raise NotImplementedError("get_temperature_status not implemented")

    def get_speed_status(self) -> SpeedStatus:
        """Get the module's heater status."""
        raise NotImplementedError("get_speed_status not implemented")

    def get_labware_latch_status(self) -> HeaterShakerLabwareLatchStatus:
        """Get the module's labware latch status."""
        raise NotImplementedError("get_labware_latch_status not implemented")
