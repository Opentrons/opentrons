from __future__ import annotations

import contextlib
from abc import ABC, abstractmethod
from typing import (Dict, List, Optional, Union)

from opentrons import types
from opentrons.hardware_control import API
from opentrons.protocols.types import APIVersion
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.module_geometry import ModuleGeometry
from opentrons.protocol_api.geometry import Deck
from opentrons.protocol_api.instrument_context import InstrumentContext
from opentrons.protocol_api.protocol_context import ModuleTypes
from opentrons.protocol_api.module_contexts import ModuleContext
from opentrons.protocol_api.util import AxisMaxSpeeds
from opentrons_shared_data.labware.dev_types import LabwareDefinition


class AbstractProtocolContextImpl(ABC):
    """Abstract interface for an implementation of a protocol context"""

    @abstractmethod
    def get_api_version(self) -> APIVersion:
        """Get the api version of the protocol"""
        ...

    @abstractmethod
    def get_bundled_data(self) -> Dict[str, bytes]:
        """Get a mapping of name to contents"""
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

    @contextlib.contextmanager
    @abstractmethod
    def temp_connect(self, hardware: API):
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
    ) -> Labware:
        ...

    @abstractmethod
    def load_labware(
            self,
            load_name: str,
            location: types.DeckLocation,
            label: str = None,
            namespace: str = None,
            version: int = None,
    ) -> Labware:
        ...

    @abstractmethod
    def load_labware_by_name(
            self,
            load_name: str,
            location: types.DeckLocation,
            label: str = None,
            namespace: str = None,
            version: int = 1
    ) -> Labware:
        ...

    @abstractmethod
    def get_loaded_labwares(self) -> Dict[int, Union[Labware, ModuleGeometry]]:
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
            mount: Union[types.Mount, str],
            tip_racks: List[Labware] = None,
            replace: bool = False) -> InstrumentContext:
        ...

    @abstractmethod
    def get_loaded_instruments(self) \
            -> Dict[str, Optional[InstrumentContext]]:
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
              minutes=0,
              msg: str = None) -> None:
        ...

    @abstractmethod
    def home(self) -> None:
        ...

    @abstractmethod
    def get_deck(self) -> Deck:
        ...

    @abstractmethod
    def get_fixed_trash(self) -> Labware:
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
