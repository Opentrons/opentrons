"""The interface that implements ProtocolContext."""

from __future__ import annotations

from abc import abstractmethod, ABC
from dataclasses import dataclass
from typing import Dict, Optional

from opentrons import types
from opentrons.hardware_control import SyncHardwareAPI, SynchronousAdapter
from opentrons.hardware_control.modules.types import ModuleModel, ModuleType
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.protocols.api_support.util import AxisMaxSpeeds
from opentrons.protocols.context.labware import AbstractLabware
from opentrons_shared_data.labware.dev_types import LabwareDefinition


InstrumentDict = Dict[types.Mount, Optional[AbstractInstrument]]


@dataclass(frozen=True)
class LoadModuleResult:
    """The result of load_module"""

    type: ModuleType
    geometry: ModuleGeometry
    module: SynchronousAdapter


class AbstractProtocol(ABC):
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
    def get_max_speeds(self) -> AxisMaxSpeeds:
        ...

    @abstractmethod
    def get_hardware(self) -> SyncHardwareAPI:
        ...

    @abstractmethod
    def is_simulating(self) -> bool:
        ...

    @abstractmethod
    def load_labware_from_definition(
        self,
        labware_def: LabwareDefinition,
        location: types.DeckLocation,
        label: Optional[str],
    ) -> AbstractLabware:
        ...

    @abstractmethod
    def load_labware(
        self,
        load_name: str,
        location: types.DeckLocation,
        label: Optional[str],
        namespace: Optional[str],
        version: Optional[int],
    ) -> AbstractLabware:
        ...

    @abstractmethod
    def load_module(
        self,
        model: ModuleModel,
        location: Optional[types.DeckLocation],
        configuration: Optional[str],
    ) -> Optional[LoadModuleResult]:
        ...

    @abstractmethod
    def get_loaded_modules(self) -> Dict[int, LoadModuleResult]:
        ...

    @abstractmethod
    def load_instrument(
        self, instrument_name: str, mount: types.Mount, replace: bool
    ) -> AbstractInstrument:
        ...

    @abstractmethod
    def get_loaded_instruments(self) -> InstrumentDict:
        ...

    @abstractmethod
    def pause(self, msg: Optional[str]) -> None:
        ...

    @abstractmethod
    def resume(self) -> None:
        ...

    @abstractmethod
    def comment(self, msg: str) -> None:
        ...

    @abstractmethod
    def delay(self, seconds: float, msg: Optional[str]) -> None:
        ...

    @abstractmethod
    def home(self) -> None:
        ...

    @abstractmethod
    def get_deck(self) -> Deck:
        ...

    @abstractmethod
    def get_fixed_trash(self) -> DeckItem:
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

    @abstractmethod
    def get_last_location(
        self,
        mount: Optional[types.Mount] = None,
    ) -> Optional[types.Location]:
        ...

    @abstractmethod
    def set_last_location(
        self,
        location: Optional[types.Location],
        mount: Optional[types.Mount] = None,
    ) -> None:
        ...
