from __future__ import annotations

from abc import abstractmethod
from typing import (Dict, List, Optional, Union)

from opentrons import types
from opentrons.hardware_control import API
from opentrons.protocols.implementations.interfaces.versioned import \
    ApiVersioned
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocols.implementations.interfaces.instrument_context \
    import InstrumentContextInterface
from opentrons.protocols.api_support.util import (
    AxisMaxSpeeds, HardwareManager)
from opentrons.protocol_api.module_contexts import (
    ModuleContext, ModuleTypes)
from opentrons.protocols.implementations.interfaces.labware import \
    LabwareInterface
from opentrons_shared_data.labware.dev_types import LabwareDefinition


class ProtocolContextInterface(ApiVersioned):

    @abstractmethod
    def get_bundled_data(self) -> Dict[str, bytes]:
        """Get a mapping of name to contents"""
        ...

    @abstractmethod
    def get_bundled_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        ...

    @abstractmethod
    def get_extra_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        ...

    @abstractmethod
    def cleanup(self) -> None:
        ...

    @abstractmethod
    def get_max_speeds(self) -> AxisMaxSpeeds:
        ...

    @abstractmethod
    def get_commands(self) -> List[str]:
        ...

    @abstractmethod
    def clear_commands(self) -> None:
        ...

    @abstractmethod
    def get_hardware(self) -> HardwareManager:
        ...

    @abstractmethod
    def connect(self, hardware: API) -> None:
        ...

    @abstractmethod
    def disconnect(self) -> None:
        ...

    @abstractmethod
    def is_simulating(self) -> bool:
        ...

    @abstractmethod
    def load_labware_from_definition(
            self,
            labware_def: LabwareDefinition,
            location: types.DeckLocation,
            label: str = None,
    ) -> LabwareInterface:
        ...

    @abstractmethod
    def load_labware(
            self,
            load_name: str,
            location: types.DeckLocation,
            label: str = None,
            namespace: str = None,
            version: int = None,
    ) -> LabwareInterface:
        ...

    @abstractmethod
    def get_loaded_labwares(self) -> \
            Dict[int, Union[LabwareInterface, ModuleGeometry]]:
        ...

    @abstractmethod
    def load_module(
            self,
            module_name: str,
            location: Optional[types.DeckLocation] = None,
            configuration: str = None) -> ModuleTypes:
        ...

    @abstractmethod
    def get_loaded_modules(self) -> Dict[int, ModuleContext]:
        ...

    @abstractmethod
    def load_instrument(
            self,
            instrument_name: str,
            mount: types.Mount,
            tip_racks: List[LabwareInterface] = None,
            replace: bool = False) -> InstrumentContextInterface:
        ...

    @abstractmethod
    def get_loaded_instruments(self) \
            -> Dict[str, Optional[InstrumentContextInterface]]:
        ...

    @abstractmethod
    def pause(self, msg: str = None) -> None:
        ...

    @abstractmethod
    def resume(self) -> None:
        ...

    @abstractmethod
    def comment(self, msg: str) -> None:
        ...

    @abstractmethod
    def delay(self,
              seconds=0,
              msg: str = None) -> None:
        ...

    @abstractmethod
    def home(self) -> None:
        ...

    @abstractmethod
    def get_deck(self) -> Deck:
        ...

    @abstractmethod
    def get_fixed_trash(self) -> LabwareInterface:
        ...

    @abstractmethod
    def set_rail_lights(self, on: bool) -> None:
        ...

    @abstractmethod
    def get_rail_lights_on(self) -> bool:
        ...

    @abstractmethod
    def door_closed(self) -> bool:
        ...
