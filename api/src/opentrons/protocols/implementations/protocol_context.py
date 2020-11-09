import asyncio
import logging
from typing import Dict, Optional, Union, List, Iterator, Tuple, Set

from opentrons import types, API
from opentrons.config import feature_flags as fflags
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocols.implementations.interfaces.instrument_context import \
    InstrumentContextInterface
from opentrons.protocols.implementations.interfaces.labware import \
    LabwareInterface
from opentrons.protocols.implementations.interfaces.modules.module_context import \
    ModuleContextInterface
from opentrons.protocols.implementations.interfaces.protocol_context import \
    ProtocolContextInterface
from opentrons.protocols.implementations.location_cache import LocationCache
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.protocols.api_support.util import (
    AxisMaxSpeeds, HardwareToManage, HardwareManager,
    convert_door_state_to_bool)
from opentrons.protocols.labware import load_from_definition, \
    get_labware_definition
from opentrons.protocols.types import Protocol
from opentrons_shared_data.labware import LabwareDefinition


MODULE_LOG = logging.getLogger(__name__)

SHORT_TRASH_DECK = 'ot2_short_trash'
STANDARD_DECK = 'ot2_standard'


class ProtocolContextImplementation(ProtocolContextInterface):

    def __init__(self,
                 loop: asyncio.AbstractEventLoop = None,
                 hardware: HardwareToManage = None,
                 bundled_labware: Dict[str, LabwareDefinition] = None,
                 bundled_data: Dict[str, bytes] = None,
                 extra_labware: Dict[str, LabwareDefinition] = None,
                 ) -> None:

        self._loop = loop or asyncio.get_event_loop()
        deck_load_name = SHORT_TRASH_DECK if fflags.short_fixed_trash() \
            else STANDARD_DECK
        self._deck_layout = Deck(load_name=deck_load_name)
        self._instruments: Dict[types.Mount,
                                Optional[InstrumentContextInterface]] =\
            {mount: None for mount in types.Mount}
        self._modules: Set[ModuleContextInterface] = set()
        self._location_cache = LocationCache()

        self._hw_manager = HardwareManager(hardware)
        self._log = MODULE_LOG.getChild(self.__class__.__name__)

        self._bundled_labware = bundled_labware
        self._extra_labware = extra_labware or {}

        self._bundled_data: Dict[str, bytes] = bundled_data or {}
        self._default_max_speeds = AxisMaxSpeeds()

    @classmethod
    def build_using(cls,
                    protocol: Protocol,
                    *args, **kwargs):
        """ Build an API instance for the specified parsed protocol

        This is used internally to provision the context with bundle
        contents or api levels.
        """
        kwargs['bundled_data'] = getattr(protocol, 'bundled_data', None)
        kwargs['bundled_labware'] = getattr(protocol, 'bundled_labware', None)
        return cls(*args, **kwargs)

    def get_bundled_data(self) -> Dict[str, bytes]:
        return self._bundled_data

    def get_bundled_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        return self._bundled_labware

    def get_extra_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        return self._extra_labware

    def cleanup(self) -> None:
        pass

    def get_max_speeds(self) -> AxisMaxSpeeds:
        return self._default_max_speeds

    def get_hardware(self) -> HardwareManager:
        return self._hw_manager

    def connect(self, hardware: API) -> None:
        self._hw_manager.set_hw(hardware)
        self._hw_manager.hardware.cache_instruments()

    def disconnect(self) -> None:
        self._hw_manager.reset_hw()

    def is_simulating(self) -> bool:
        return self._hw_manager.hardware.is_simulator

    def load_labware_from_definition(self, labware_def: LabwareDefinition,
                                     location: types.DeckLocation,
                                     label: str = None) -> LabwareInterface:
        parent = self.get_deck().position_for(location)
        labware_obj = load_from_definition(labware_def, parent, label)
        self._deck_layout[location] = labware_obj
        return labware_obj

    def load_labware(self, load_name: str, location: types.DeckLocation,
                     label: str = None, namespace: str = None,
                     version: int = None) -> LabwareInterface:
        labware_def = get_labware_definition(
            load_name, namespace, version,
            bundled_defs=self._bundled_labware,
            extra_defs=self._extra_labware)
        return self.load_labware_from_definition(
            labware_def, location, label)

    def get_loaded_labwares(self) -> \
            Dict[int, Union[LabwareInterface, ModuleGeometry]]:
        return None

    def load_module(self, module_name: str,
                    location: Optional[types.DeckLocation] = None,
                    configuration: str = None) -> ModuleContextInterface:
        return None

    def get_loaded_modules(self) -> Dict[int, ModuleContextInterface]:
        return None

    def load_instrument(self, instrument_name: str,
                        mount: types.Mount,
                        tip_racks: List[LabwareInterface] = None,
                        replace: bool = False) -> InstrumentContextInterface:
        None

    def get_loaded_instruments(self) -> Dict[str, Optional[InstrumentContextInterface]]:
        return {mount.name.lower(): instr for mount, instr
                in self._instruments.items()
                if instr}

    def pause(self, msg: str = None) -> None:
        self._hw_manager.hardware.pause()

    def resume(self) -> None:
        self._hw_manager.hardware.resume()

    def comment(self, msg: str) -> None:
        pass

    def delay(self, seconds=0, msg: str = None) -> None:
        self._hw_manager.hardware.delay(seconds)

    def home(self) -> None:
        self._location_cache.clear()
        self._hw_manager.hardware.home()

    def get_deck(self) -> Deck:
        return self._deck_layout

    def get_fixed_trash(self) -> LabwareInterface:
        return None

    def set_rail_lights(self, on: bool) -> None:
        self._hw_manager.hardware.set_lights(rails=on)

    def get_rail_lights_on(self) -> bool:
        return self._hw_manager.hardware.get_lights()['rails']

    def door_closed(self) -> bool:
        return convert_door_state_to_bool(
            self._hw_manager.hardware.door_state)
