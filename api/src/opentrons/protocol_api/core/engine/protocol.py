"""ProtocolEngine-based Protocol API core implementation."""
from typing import Dict, List, Optional, Type, Union
from typing_extensions import Literal

from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict
from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.types import DeckSlotName, Location, Mount, MountType, Point
from opentrons.hardware_control import SyncHardwareAPI, SynchronousAdapter
from opentrons.hardware_control.modules import AbstractModule
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    ModuleType,
)
from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE
from opentrons.protocols.api_support.util import AxisMaxSpeeds
from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_engine import (
    DeckSlotLocation,
    ModuleLocation,
    ModuleModel as EngineModuleModel,
    LabwareMovementStrategy,
    LoadedLabware,
    LoadedModule,
)
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient

from ..protocol import AbstractProtocol
from ..labware import LabwareLoadParams
from .labware import LabwareCore
from .instrument import InstrumentCore
from .module_core import (
    ModuleCore,
    TemperatureModuleCore,
    MagneticModuleCore,
    ThermocyclerModuleCore,
    HeaterShakerModuleCore,
)
from .exceptions import InvalidModuleLocationError


# TODO(mc, 2022-08-24): many of these methods are likely unnecessary
# in a ProtocolEngine world. As we develop this core, we should remove
# and consolidate logic as we need to across all cores rather than
# necessarily try to support every one of these behaviors in the engine.
class ProtocolCore(AbstractProtocol[InstrumentCore, LabwareCore, ModuleCore]):
    """Protocol API core using a ProtocolEngine.

    Args:
        engine_client: A synchronous client to the ProtocolEngine
            that is executing the protocol.
    """

    def __init__(
        self,
        engine_client: ProtocolEngineClient,
        api_version: APIVersion,
        sync_hardware: SyncHardwareAPI,
    ) -> None:
        self._engine_client = engine_client
        self._api_version = api_version
        self._sync_hardware = sync_hardware
        self._last_location: Optional[Location] = None
        self._last_mount: Optional[Mount] = None
        self._labware_cores_by_id: Dict[str, LabwareCore] = {}
        self._module_cores_by_id: Dict[str, ModuleCore] = {}
        self._load_fixed_trash()

    @property
    def api_version(self) -> APIVersion:
        """Get the api version protocol target."""
        return self._api_version

    @property
    def fixed_trash(self) -> LabwareCore:
        """Get the fixed trash labware."""
        trash_id = self._engine_client.state.labware.get_fixed_trash_id()
        return self._labware_cores_by_id[trash_id]

    def _load_fixed_trash(self) -> None:
        trash_id = self._engine_client.state.labware.get_fixed_trash_id()
        self._labware_cores_by_id[trash_id] = LabwareCore(
            labware_id=trash_id,
            engine_client=self._engine_client,
        )

    def get_bundled_data(self) -> Dict[str, bytes]:
        """Get a map of file names to byte contents.

        Deprecated method for past experiment with ZIP protocols.
        """
        raise NotImplementedError("ProtocolCore.get_bundled_data not implemented")

    def get_bundled_labware(self) -> Optional[Dict[str, LabwareDefDict]]:
        """Get a map of labware names to definition dicts.

        Deprecated method used for past experiment with ZIP protocols.
        """
        raise NotImplementedError("ProtocolCore.get_bundled_labware not implemented")

    def get_extra_labware(self) -> Optional[Dict[str, LabwareDefDict]]:
        """Get a map of extra labware names to definition dicts.

        Used to assist load custom labware definitions.
        """
        raise NotImplementedError("ProtocolCore.get_extra_labware not implemented")

    def get_max_speeds(self) -> AxisMaxSpeeds:
        """Get a control interface for maximum move speeds."""
        raise NotImplementedError("ProtocolCore.get_max_speeds not implemented")

    def get_hardware(self) -> SyncHardwareAPI:
        """Get direct access to a hardware control interface."""
        return self._sync_hardware

    def is_simulating(self) -> bool:
        """Get whether the protocol is being analyzed or actually run."""
        return self._engine_client.state.config.ignore_pause

    def add_labware_definition(
        self,
        definition: LabwareDefDict,
    ) -> LabwareLoadParams:
        """Add a labware definition to the set of loadable definitions."""
        uri = self._engine_client.add_labware_definition(
            LabwareDefinition.parse_obj(definition)
        )
        return LabwareLoadParams.from_uri(uri)

    def load_labware(
        self,
        load_name: str,
        location: Union[DeckSlotName, ModuleCore],
        label: Optional[str],
        namespace: Optional[str],
        version: Optional[int],
    ) -> LabwareCore:
        """Load a labware using its identifying parameters."""
        module_location: Union[ModuleLocation, DeckSlotLocation]
        if isinstance(location, ModuleCore):
            module_location = ModuleLocation(moduleId=location.module_id)
        else:
            module_location = DeckSlotLocation(slotName=location)

        load_result = self._engine_client.load_labware(
            load_name=load_name,
            location=module_location,
            namespace=namespace if namespace is not None else OPENTRONS_NAMESPACE,
            version=version or 1,
            display_name=label,
        )
        labware_core = LabwareCore(
            labware_id=load_result.labwareId,
            engine_client=self._engine_client,
        )

        self._labware_cores_by_id[labware_core.labware_id] = labware_core

        return labware_core

    def move_labware(
        self,
        labware_core: LabwareCore,
        new_location: Union[DeckSlotName, ModuleCore],
        use_gripper: bool,
    ) -> None:
        """Move the given labware to a new location."""
        to_location: Union[ModuleLocation, DeckSlotLocation]
        if isinstance(new_location, ModuleCore):
            to_location = ModuleLocation(moduleId=new_location.module_id)
        else:
            to_location = DeckSlotLocation(slotName=new_location)

        strategy = (
            LabwareMovementStrategy.USING_GRIPPER
            if use_gripper
            else LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE
        )

        self._engine_client.move_labware(
            labware_id=labware_core.labware_id,
            new_location=to_location,
            strategy=strategy,
        )

    def _resolve_module_hardware(
        self, serial_number: str, model: ModuleModel
    ) -> AbstractModule:
        """Resolve a module serial number to module hardware API."""
        if self.is_simulating():
            return self._sync_hardware.create_simulating_module(model)  # type: ignore[no-any-return]

        for module_hardware in self._sync_hardware.attached_modules:
            if serial_number == module_hardware.device_info["serial"]:
                return module_hardware  # type: ignore[no-any-return]

        raise RuntimeError(f"Could not find specified module: {model.value}")

    def load_module(
        self,
        model: ModuleModel,
        deck_slot: Optional[DeckSlotName],
        configuration: Optional[str],
    ) -> ModuleCore:
        """Load a module into the protocol."""
        # TODO(mc, 2022-10-20): move to public ProtocolContext
        # once `Deck` and `ProtocolEngine` play nicely together
        if deck_slot is None:
            if ModuleType.from_model(model) == ModuleType.THERMOCYCLER:
                deck_slot = DeckSlotName.SLOT_7
            else:
                raise InvalidModuleLocationError(deck_slot, model.name)

        result = self._engine_client.load_module(
            model=EngineModuleModel(model),
            location=DeckSlotLocation(slotName=deck_slot),
        )
        module_type = result.model.as_type()

        selected_hardware = self._resolve_module_hardware(result.serialNumber, model)

        # TODO(mc, 2022-10-25): move to module core factory function
        module_core_cls: Type[ModuleCore] = ModuleCore
        if module_type == ModuleType.TEMPERATURE:
            module_core_cls = TemperatureModuleCore
        elif module_type == ModuleType.MAGNETIC:
            module_core_cls = MagneticModuleCore
        elif module_type == ModuleType.THERMOCYCLER:
            module_core_cls = ThermocyclerModuleCore
        elif module_type == ModuleType.HEATER_SHAKER:
            module_core_cls = HeaterShakerModuleCore

        module_core = module_core_cls(
            module_id=result.moduleId,
            engine_client=self._engine_client,
            api_version=self.api_version,
            sync_module_hardware=SynchronousAdapter(selected_hardware),
        )

        self._module_cores_by_id[module_core.module_id] = module_core

        return module_core

    # TODO (tz, 11-23-22): remove Union when refactoring load_pipette for 96 channels.
    # https://opentrons.atlassian.net/browse/RLIQ-255
    def load_instrument(
        self, instrument_name: Union[PipetteNameType, Literal["p1000_96"]], mount: Mount
    ) -> InstrumentCore:
        """Load an instrument into the protocol.

        Args:
            instrument_name: Load name of the instrument.
            mount: Mount the instrument is attached to.

        Returns:
            An instrument core configured to use the requested instrument.
        """
        engine_mount = MountType[mount.name]
        load_result = self._engine_client.load_pipette(instrument_name, engine_mount)

        return InstrumentCore(
            pipette_id=load_result.pipetteId,
            engine_client=self._engine_client,
            sync_hardware_api=self._sync_hardware,
            protocol_core=self,
            # TODO(mm, 2022-11-10): Deduplicate "400" with legacy core.
            default_movement_speed=400,
        )

    def pause(self, msg: Optional[str]) -> None:
        """Pause the protocol."""
        self._engine_client.wait_for_resume(message=msg)

    def resume(self) -> None:
        """Resume the protocol."""
        # TODO(mm, 2022-11-08): This method is not usable in practice. Consider removing
        # it from both cores. https://github.com/Opentrons/opentrons/issues/8209
        raise NotImplementedError("ProtocolCore.resume not implemented")

    def comment(self, msg: str) -> None:
        """Create a comment in the protocol to be shown in the log."""
        self._engine_client.comment(message=msg)

    def delay(self, seconds: float, msg: Optional[str]) -> None:
        """Wait for a period of time before proceeding."""
        self._engine_client.wait_for_duration(seconds=seconds, message=msg)

    def home(self) -> None:
        """Move all axes to their home positions."""
        self._engine_client.home(axes=None)

    def set_rail_lights(self, on: bool) -> None:
        """Set the device's rail lights."""
        self._engine_client.set_rail_lights(on=on)

    def get_rail_lights_on(self) -> bool:
        """Get whether the device's rail lights are on."""
        return self._sync_hardware.get_lights()["rails"]  # type: ignore[no-any-return]

    def door_closed(self) -> bool:
        """Get whether the device's front door is closed."""
        raise NotImplementedError("ProtocolCore.door_closed not implemented")

    def get_last_location(
        self,
        mount: Optional[Mount] = None,
    ) -> Optional[Location]:
        """Get the last accessed location."""
        if mount is None or mount == self._last_mount:
            return self._last_location

        return None

    def set_last_location(
        self,
        location: Optional[Location],
        mount: Optional[Mount] = None,
    ) -> None:
        """Set the last accessed location."""
        self._last_location = location
        self._last_mount = mount

    def get_deck_definition(self) -> DeckDefinitionV3:
        """Get the geometry definition of the robot's deck."""
        return self._engine_client.state.labware.get_deck_definition()

    def get_slot_item(
        self, slot_name: DeckSlotName
    ) -> Union[LabwareCore, ModuleCore, None]:
        """Get the contents of a given slot, if any."""
        loaded_item = self._engine_client.state.geometry.get_slot_item(
            slot_name=slot_name,
            allowed_labware_ids=set(self._labware_cores_by_id.keys()),
            allowed_module_ids=set(self._module_cores_by_id.keys()),
        )

        if isinstance(loaded_item, LoadedLabware):
            return self._labware_cores_by_id[loaded_item.id]

        if isinstance(loaded_item, LoadedModule):
            return self._module_cores_by_id[loaded_item.id]

        return None

    def get_slot_center(self, slot_name: DeckSlotName) -> Point:
        """Get the absolute coordinate of a slot's center."""
        return self._engine_client.state.labware.get_slot_center_position(slot_name)

    def get_highest_z(self) -> float:
        """Get the highest Z point of all deck items."""
        return self._engine_client.state.geometry.get_all_labware_highest_z()

    def get_labware_cores(self) -> List[LabwareCore]:
        """Get all loaded labware cores."""
        return list(self._labware_cores_by_id.values())

    def get_module_cores(self) -> List[ModuleCore]:
        """Get all loaded module cores."""
        return list(self._module_cores_by_id.values())
