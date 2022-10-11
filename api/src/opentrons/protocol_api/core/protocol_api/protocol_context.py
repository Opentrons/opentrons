import logging
from typing import Dict, Optional, Set, Union

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.types import Mount, Location, DeckSlotName
from opentrons.equipment_broker import EquipmentBroker
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.modules import AbstractModule, ModuleModel, ModuleType
from opentrons.hardware_control.types import DoorState, PauseType
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import AxisMaxSpeeds
from opentrons.protocols.geometry import module_geometry
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols import labware as labware_definition

from ..protocol import AbstractProtocol
from ..labware import LabwareLoadParams

from . import legacy_module_core
from .instrument_context import InstrumentContextImplementation
from .labware_offset_provider import AbstractLabwareOffsetProvider
from .labware import LabwareImplementation
from .load_info import LoadInfo, InstrumentLoadInfo, LabwareLoadInfo, ModuleLoadInfo

logger = logging.getLogger(__name__)


class ProtocolContextImplementation(
    AbstractProtocol[
        InstrumentContextImplementation,
        LabwareImplementation,
        legacy_module_core.LegacyModuleCore,
    ]
):
    def __init__(
        self,
        sync_hardware: SyncHardwareAPI,
        api_version: APIVersion,
        labware_offset_provider: AbstractLabwareOffsetProvider,
        equipment_broker: Optional[EquipmentBroker[LoadInfo]] = None,
        deck_layout: Optional[Deck] = None,
        bundled_labware: Optional[Dict[str, LabwareDefinition]] = None,
        bundled_data: Optional[Dict[str, bytes]] = None,
        extra_labware: Optional[Dict[str, LabwareDefinition]] = None,
    ) -> None:
        """Build a :py:class:`.ProtocolContextImplementation`.

        :param api_version: The API version to use. If this is ``None``, uses
                            the max supported version.
        :param hardware: The hardware control API to use.
        :param bundled_labware: A dict mapping labware URIs to definitions.
                                This is used when executing bundled protocols,
                                and if specified will be the only allowed
                                source for labware definitions, excluding the
                                built in definitions and anything in
                                ``extra_labware``.
        :param bundled_data: A dict mapping filenames to the contents of data
                             files. Can be used by the protocol, since it is
                             exposed as
                             :py:attr:`.ProtocolContext.bundled_data`
        :param extra_labware: A dict mapping labware URIs to definitions. These
                              URIs are searched during :py:meth:`.load_labware`
                              in addition to the system definitions (if
                              ``bundled_labware`` was not specified). Used to
                              provide custom labware definitions.
        """
        self._sync_hardware = sync_hardware
        self._api_version = api_version
        self._labware_offset_provider = labware_offset_provider
        self._equipment_broker = equipment_broker or EquipmentBroker()
        self._deck_layout = Deck() if deck_layout is None else deck_layout

        self._instruments: Dict[Mount, Optional[InstrumentContextImplementation]] = {
            mount: None for mount in Mount
        }
        self._bundled_labware = bundled_labware
        self._extra_labware = extra_labware or {}
        self._bundled_data: Dict[str, bytes] = bundled_data or {}
        self._default_max_speeds = AxisMaxSpeeds()
        self._last_location: Optional[Location] = None
        self._last_mount: Optional[Mount] = None
        self._loaded_modules: Set["AbstractModule"] = set()

    @property
    def equipment_broker(self) -> EquipmentBroker[LoadInfo]:
        """A message broker to to publish equipment load events.

        Subscribers to this broker will be notified with information about every
        successful labware load, instrument load, or module load.

        Only this interface is allowed to publish to this broker.
        Calling code may only subscribe or unsubscribe.
        """
        return self._equipment_broker

    def get_bundled_data(self) -> Dict[str, bytes]:
        """Extra bundled data."""
        # TODO AL 20201110 - This should be removed along with the bundling
        #  feature as we move to HTTP based protocol execution.
        return self._bundled_data

    def get_bundled_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        """Bundled labware definition."""
        # TODO AL 20201110 - This should be removed along with the bundling
        #  feature as we move to HTTP based protocol execution.
        return self._bundled_labware

    def get_extra_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        """Extra labware definitions."""
        return self._extra_labware

    def get_max_speeds(self) -> AxisMaxSpeeds:
        """Get the maximum axis speeds."""
        return self._default_max_speeds

    def get_hardware(self) -> SyncHardwareAPI:
        """Access to the synchronous hardware API."""
        return self._sync_hardware

    def is_simulating(self) -> bool:
        """Returns true if hardware is being simulated."""
        return self._sync_hardware.is_simulator  # type: ignore[no-any-return]

    def add_labware_definition(
        self,
        definition: LabwareDefinition,
    ) -> LabwareLoadParams:
        """Add a labware defintion to the set of loadable definitions."""
        load_params = LabwareLoadParams(
            namespace=definition["namespace"],
            load_name=definition["parameters"]["loadName"],
            version=definition["version"],
        )
        self._extra_labware = self._extra_labware.copy()
        self._extra_labware[load_params.as_uri()] = definition
        return load_params

    def load_labware(
        self,
        load_name: str,
        location: Union[DeckSlotName, legacy_module_core.LegacyModuleCore],
        label: Optional[str],
        namespace: Optional[str],
        version: Optional[int],
    ) -> LabwareImplementation:
        """Load a labware using its identifying parameters."""
        deck_slot = (
            location if isinstance(location, DeckSlotName) else location.get_deck_slot()
        )

        parent = (
            self.get_deck().position_for(location.value)
            if isinstance(location, DeckSlotName)
            else location.geometry.location
        )

        labware_def = labware_definition.get_labware_definition(
            load_name,
            namespace,
            version,
            bundled_defs=self._bundled_labware,
            extra_defs=self._extra_labware,
        )
        labware_core = LabwareImplementation(
            definition=labware_def,
            parent=parent,
            label=label,
        )
        labware_load_params = labware_core.get_load_params()
        labware_offset = self._labware_offset_provider.find(
            load_params=labware_load_params,
            deck_slot=deck_slot,
            requested_module_model=(
                location.get_requested_model()
                if isinstance(location, legacy_module_core.LegacyModuleCore)
                else None
            ),
        )
        labware_core.set_calibration(labware_offset.delta)

        if isinstance(location, DeckSlotName):
            self._deck_layout[location.value] = labware_core

        self._equipment_broker.publish(
            LabwareLoadInfo(
                labware_definition=labware_core.get_definition(),
                labware_namespace=labware_load_params.namespace,
                labware_load_name=labware_load_params.load_name,
                labware_version=labware_load_params.version,
                deck_slot=deck_slot,
                on_module=isinstance(location, legacy_module_core.LegacyModuleCore),
                offset_id=labware_offset.offset_id,
                labware_display_name=labware_core.get_user_display_name(),
            )
        )

        return labware_core

    def load_module(
        self,
        model: ModuleModel,
        deck_slot: Optional[DeckSlotName],
        configuration: Optional[str],
    ) -> legacy_module_core.LegacyModuleCore:
        """Load a module."""
        resolved_type = ModuleType.from_model(model)
        resolved_location = self._deck_layout.resolve_module_location(
            resolved_type, deck_slot
        )

        selected_hardware = None
        selected_definition = None

        for module_hardware in self._sync_hardware.attached_modules:
            if module_hardware not in self._loaded_modules:
                definition = module_geometry.load_definition(module_hardware.model())
                compatible = module_geometry.models_compatible(model, definition)

                if compatible:
                    self._loaded_modules.add(module_hardware)
                    selected_hardware = module_hardware
                    selected_definition = definition
                    break

        if selected_hardware is None and self.is_simulating():
            selected_hardware = self._sync_hardware.create_simulating_module(model)
            selected_definition = module_geometry.load_definition(model)

        if selected_hardware is None or selected_definition is None:
            raise RuntimeError(f"Could not find specified module: {model.value}")

        # Load geometry to match the hardware module that we found connected.
        geometry = module_geometry.create_geometry(
            definition=selected_definition,
            parent=self._deck_layout.position_for(resolved_location),
            configuration=configuration,
        )

        module_core = legacy_module_core.create_module_core(
            module_hardware_api=selected_hardware,
            requested_model=model,
            geometry=geometry,
            protocol_core=self,
        )

        self._deck_layout[resolved_location] = geometry

        self.equipment_broker.publish(
            ModuleLoadInfo(
                requested_model=model,
                loaded_model=module_core.get_model(),
                module_serial=module_core.get_serial_number(),
                deck_slot=module_core.get_deck_slot(),
                configuration=configuration,
            )
        )

        return module_core

    def load_instrument(
        self, instrument_name: PipetteNameType, mount: Mount
    ) -> InstrumentContextImplementation:
        """Load an instrument."""
        attached = {
            att_mount: instr.get("name", None)
            for att_mount, instr in self._sync_hardware.attached_instruments.items()
            if instr
        }
        attached[mount] = instrument_name.value
        self._sync_hardware.cache_instruments(attached)
        # If the cache call didn’t raise, the instrument is attached
        new_instr = InstrumentContextImplementation(
            api_version=self._api_version,
            protocol_interface=self,
            mount=mount,
            instrument_name=instrument_name.value,
            default_speed=400.0,
        )
        self._instruments[mount] = new_instr
        logger.info("Instrument {} loaded".format(new_instr))

        self._equipment_broker.publish(
            InstrumentLoadInfo(
                instrument_load_name=instrument_name.value,
                mount=mount,
            )
        )

        return new_instr

    def get_loaded_instruments(
        self,
    ) -> Dict[Mount, Optional[InstrumentContextImplementation]]:
        """Get a mapping of mount to instrument."""
        return self._instruments

    def pause(self, msg: Optional[str]) -> None:
        """Pause the protocol."""
        self._sync_hardware.pause(PauseType.PAUSE)

    def resume(self) -> None:
        """Result the protocol."""
        self._sync_hardware.resume(PauseType.PAUSE)

    def comment(self, msg: str) -> None:
        """Add comment to run log."""
        pass

    def delay(self, seconds: float, msg: Optional[str]) -> None:
        """Delay execution for x seconds."""
        self._sync_hardware.delay(seconds)

    def home(self) -> None:
        """Home the robot."""
        self.set_last_location(None)
        self._sync_hardware.home()

    def get_deck(self) -> Deck:
        """Get the deck layout."""
        return self._deck_layout

    def get_fixed_trash(self) -> DeckItem:
        """The trash fixed to slot 12 of the robot deck."""
        trash = self._deck_layout["12"]
        if not trash:
            raise RuntimeError("Robot must have a trash container in 12")
        return trash

    def set_rail_lights(self, on: bool) -> None:
        """Set the rail light state."""
        self._sync_hardware.set_lights(rails=on)

    def get_rail_lights_on(self) -> bool:
        """Get the rail light state."""
        return self._sync_hardware.get_lights()["rails"]  # type: ignore[no-any-return]

    def door_closed(self) -> bool:
        """Check if door is closed."""
        return DoorState.CLOSED == self._sync_hardware.door_state  # type: ignore[no-any-return]

    def get_last_location(
        self,
        mount: Optional[Mount] = None,
    ) -> Optional[Location]:
        """Get the most recent moved to location."""
        if mount is None or mount == self._last_mount:
            return self._last_location

        return None

    def set_last_location(
        self,
        location: Optional[Location],
        mount: Optional[Mount] = None,
    ) -> None:
        """Set the most recent moved to location."""
        self._last_location = location
        self._last_mount = mount
