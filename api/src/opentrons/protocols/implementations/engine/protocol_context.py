"""Module containing protocol context interface that interacts with
Protocol Engine"""

from typing import Optional, Dict

from opentrons import types, API
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocols.api_support.util import HardwareManager, AxisMaxSpeeds
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.implementations.interfaces.instrument_context import \
    InstrumentContextInterface
from opentrons.protocols.implementations.interfaces.labware import \
    LabwareInterface
from opentrons.protocols.implementations.interfaces.protocol_context import \
    ProtocolContextInterface, InstrumentDict, LoadModuleResult
from opentrons_shared_data.labware.dev_types import LabwareDefinition


class ProtocolEngineContext(ProtocolContextInterface):
    """ProtocolContextInterface that interacts with Protocol Engine"""

    _protocol_engine: ProtocolEngine

    def __init__(self, protocol_engine: ProtocolEngine) -> None:
        """Constructor."""
        self._protocol_engine = protocol_engine

    def get_bundled_data(self) -> Dict[str, bytes]:
        raise NotImplementedError()

    def get_bundled_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        raise NotImplementedError()

    def get_extra_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        raise NotImplementedError()

    def cleanup(self) -> None:
        raise NotImplementedError()

    def get_max_speeds(self) -> AxisMaxSpeeds:
        raise NotImplementedError()

    def get_hardware(self) -> HardwareManager:
        raise NotImplementedError()

    def connect(self, hardware: API) -> None:
        raise NotImplementedError()

    def disconnect(self) -> None:
        raise NotImplementedError()

    def is_simulating(self) -> bool:
        raise NotImplementedError()

    def load_labware_from_definition(self, labware_def: LabwareDefinition,
                                     location: types.DeckLocation,
                                     label: Optional[
                                         str] = None) -> LabwareInterface:
        raise NotImplementedError()

    def load_labware(self, load_name: str, location: types.DeckLocation,
                     label: Optional[str] = None,
                     namespace: Optional[str] = None,
                     version: Optional[int] = None) -> LabwareInterface:
        raise NotImplementedError()

    def load_module(self, module_name: str,
                    location: Optional[types.DeckLocation] = None,
                    configuration: Optional[str] = None) -> Optional[LoadModuleResult]:
        raise NotImplementedError()

    def get_loaded_modules(self) -> Dict[int, LoadModuleResult]:
        raise NotImplementedError()

    def load_instrument(self, instrument_name: str, mount: types.Mount,
                        replace: bool = False) -> InstrumentContextInterface:
        raise NotImplementedError()

    def get_loaded_instruments(self) -> InstrumentDict:
        raise NotImplementedError()

    def pause(self, msg: Optional[str] = None) -> None:
        raise NotImplementedError()

    def resume(self) -> None:
        raise NotImplementedError()

    def comment(self, msg: str) -> None:
        raise NotImplementedError()

    def delay(self, seconds=0, msg: Optional[str] = None) -> None:
        raise NotImplementedError()

    def home(self) -> None:
        raise NotImplementedError()

    def get_deck(self) -> Deck:
        raise NotImplementedError()

    def get_fixed_trash(self) -> DeckItem:
        raise NotImplementedError()

    def set_rail_lights(self, on: bool) -> None:
        raise NotImplementedError()

    def get_rail_lights_on(self) -> bool:
        raise NotImplementedError()

    def door_closed(self) -> bool:
        raise NotImplementedError()

    def get_last_location(self) -> Optional[types.Location]:
        raise NotImplementedError()

    def set_last_location(self, location: Optional[types.Location]) -> None:
        raise NotImplementedError()
