import logging
from typing import Dict, List, Optional, Set
from collections import OrderedDict

from opentrons import types
from opentrons.hardware_control import SyncHardwareAPI, SynchronousAdapter
from opentrons.hardware_control.modules import AbstractModule, ModuleModel
from opentrons.hardware_control.types import DoorState, PauseType
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import AxisMaxSpeeds
from opentrons.protocols.context.protocol_api.instrument_context import (
    InstrumentContextImplementation,
)
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.protocols.context.labware import AbstractLabware
from opentrons.protocols.context.protocol import (
    AbstractProtocol,
    InstrumentDict,
    LoadModuleResult,
)
from opentrons.protocols.geometry import module_geometry
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.labware import load_from_definition, get_labware_definition

from opentrons_shared_data.labware.dev_types import LabwareDefinition


logger = logging.getLogger(__name__)


class ProtocolContextImplementation(AbstractProtocol):
    def __init__(
        self,
        sync_hardware: SyncHardwareAPI,
        api_version: Optional[APIVersion] = None,
        bundled_labware: Dict[str, LabwareDefinition] = None,
        bundled_data: Dict[str, bytes] = None,
        extra_labware: Dict[str, LabwareDefinition] = None,
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
        self._api_version = api_version or MAX_SUPPORTED_VERSION
        self._deck_layout = Deck()
        self._instruments: InstrumentDict = {mount: None for mount in types.Mount}
        self._modules: List[LoadModuleResult] = []
        self._bundled_labware = bundled_labware
        self._extra_labware = extra_labware or {}
        self._bundled_data: Dict[str, bytes] = bundled_data or {}
        self._default_max_speeds = AxisMaxSpeeds()
        self._last_location: Optional[types.Location] = None
        self._last_mount: Optional[types.Mount] = None
        self._loaded_modules: Set["AbstractModule"] = set()

    def get_bundled_data(self) -> Dict[str, bytes]:
        """Extra bundled data."""
        # TODO AL 20201110 - This should be removed along with the bundling
        #  feature as we move to HTTP based protocol execution.
        return self._bundled_data

    def get_bundled_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        """Bundled labware defintion."""
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
        return self._sync_hardware.is_simulator

    def load_labware_from_definition(
        self,
        labware_def: LabwareDefinition,
        location: types.DeckLocation,
        label: Optional[str],
    ) -> AbstractLabware:
        """Load a labware from definition"""
        parent = self.get_deck().position_for(location)
        labware_obj = load_from_definition(labware_def, parent, label)
        self._deck_layout[location] = labware_obj
        return labware_obj

    def load_labware(
        self,
        load_name: str,
        location: types.DeckLocation,
        label: Optional[str],
        namespace: Optional[str],
        version: Optional[int],
    ) -> AbstractLabware:
        """Load a labware."""
        labware_def = get_labware_definition(
            load_name,
            namespace,
            version,
            bundled_defs=self._bundled_labware,
            extra_defs=self._extra_labware,
        )
        return self.load_labware_from_definition(labware_def, location, label)

    def load_module(
        self,
        model: ModuleModel,
        location: Optional[types.DeckLocation],
        configuration: Optional[str],
    ) -> Optional[LoadModuleResult]:
        """Load a module."""
        resolved_type = module_geometry.resolve_module_type(model)
        resolved_location = self._deck_layout.resolve_module_location(
            resolved_type, location
        )

        # Try to find in the hardware instance
        available_modules, simulating_module = self._sync_hardware.find_modules(
            model, resolved_type
        )

        hc_mod_instance = None
        for mod in available_modules:
            compatible = module_geometry.models_compatible(
                module_geometry.module_model_from_string(mod.model()), model
            )
            if compatible and mod not in self._loaded_modules:
                self._loaded_modules.add(mod)
                hc_mod_instance = SynchronousAdapter(mod)
                break

        if simulating_module and not hc_mod_instance:
            hc_mod_instance = SynchronousAdapter(simulating_module)

        if not hc_mod_instance:
            return None

        # Load geometry to match the hardware module that we found connected.
        geometry = module_geometry.load_module(
            model=module_geometry.module_model_from_string(hc_mod_instance.model()),
            parent=self._deck_layout.position_for(resolved_location),
            api_level=self._api_version,
            configuration=configuration,
        )

        result = LoadModuleResult(
            type=resolved_type, geometry=geometry, module=hc_mod_instance
        )

        self._modules.append(result)
        self._deck_layout[resolved_location] = geometry
        return result

    def get_loaded_modules(self) -> Dict[int, LoadModuleResult]:
        """Get a mapping of deck location to loaded module."""
        return OrderedDict(
            {int(str(module.geometry.parent)): module for module in self._modules}
        )

    def load_instrument(
        self, instrument_name: str, mount: types.Mount, replace: bool
    ) -> AbstractInstrument:
        """Load an instrument."""
        instr = self._instruments[mount]
        if instr and not replace:
            raise RuntimeError(
                f"Instrument already present in {mount.name.lower()} "
                f"mount: {instr.get_instrument_name()}"
            )

        attached = {
            att_mount: instr.get("name", None)
            for att_mount, instr in self._sync_hardware.attached_instruments.items()
            if instr
        }
        attached[mount] = instrument_name
        self._sync_hardware.cache_instruments(attached)
        # If the cache call didn’t raise, the instrument is attached
        new_instr = InstrumentContextImplementation(
            api_version=self._api_version,
            protocol_interface=self,
            mount=mount,
            instrument_name=instrument_name,
            default_speed=400.0,
        )
        self._instruments[mount] = new_instr
        logger.info("Instrument {} loaded".format(new_instr))
        return new_instr

    def get_loaded_instruments(self) -> InstrumentDict:
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
        return self._sync_hardware.get_lights()["rails"]

    def door_closed(self) -> bool:
        """Check if door is closed."""
        return DoorState.CLOSED == self._sync_hardware.door_state

    def get_last_location(
        self,
        mount: Optional[types.Mount] = None,
    ) -> Optional[types.Location]:
        """Get the most recent moved to location."""
        if mount is None or mount == self._last_mount:
            return self._last_location

        return None

    def set_last_location(
        self,
        location: Optional[types.Location],
        mount: Optional[types.Mount] = None,
    ) -> None:
        """Set the most recent moved to location."""
        self._last_location = location
        self._last_mount = mount
