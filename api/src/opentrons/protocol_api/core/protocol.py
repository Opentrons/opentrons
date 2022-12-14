"""The interface that implements ProtocolContext."""

from __future__ import annotations

from abc import abstractmethod, ABC
from typing import Dict, Generic, List, Optional, Union

from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.types import DeckSlotName, Location, Mount, Point
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.modules.types import ModuleModel
from opentrons.protocols.api_support.util import AxisMaxSpeeds
from opentrons_shared_data.labware.dev_types import LabwareDefinition

from .instrument import InstrumentCoreType
from .labware import LabwareCoreType, LabwareLoadParams
from .module import ModuleCoreType


class AbstractProtocol(
    ABC, Generic[InstrumentCoreType, LabwareCoreType, ModuleCoreType]
):
    @property
    @abstractmethod
    def fixed_trash(self) -> LabwareCoreType:
        """Get the fixed trash labware core."""
        ...

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
    def add_labware_definition(
        self,
        definition: LabwareDefinition,
    ) -> LabwareLoadParams:
        """Add a labware defintion to the set of loadable definitions."""
        ...

    @abstractmethod
    def load_labware(
        self,
        load_name: str,
        location: Union[DeckSlotName, ModuleCoreType],
        label: Optional[str],
        namespace: Optional[str],
        version: Optional[int],
    ) -> LabwareCoreType:
        """Load a labware using its identifying parameters."""
        ...

    @abstractmethod
    def move_labware(
        self,
        labware_core: LabwareCoreType,
        new_location: Union[DeckSlotName, ModuleCoreType],
        use_gripper: bool,
    ) -> None:
        ...

    @abstractmethod
    def load_module(
        self,
        model: ModuleModel,
        deck_slot: Optional[DeckSlotName],
        configuration: Optional[str],
    ) -> ModuleCoreType:
        ...

    @abstractmethod
    def load_instrument(
        self, instrument_name: PipetteNameType, mount: Mount
    ) -> InstrumentCoreType:
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
        mount: Optional[Mount] = None,
    ) -> Optional[Location]:
        ...

    @abstractmethod
    def set_last_location(
        self,
        location: Optional[Location],
        mount: Optional[Mount] = None,
    ) -> None:
        ...

    @abstractmethod
    def get_deck_definition(self) -> DeckDefinitionV3:
        """Get the geometry definition of the robot's deck."""

    @abstractmethod
    def get_slot_item(
        self, slot_name: DeckSlotName
    ) -> Union[LabwareCoreType, ModuleCoreType, None]:
        """Get the contents of a given slot, if any."""

    @abstractmethod
    def get_slot_center(self, slot_name: DeckSlotName) -> Point:
        """Get the absolute coordinate of a slot's center."""

    @abstractmethod
    def get_highest_z(self) -> float:
        """Get the highest Z point of all deck items."""

    @abstractmethod
    def get_labware_cores(self) -> List[LabwareCoreType]:
        """Get all loaded labware cores."""

    @abstractmethod
    def get_module_cores(self) -> List[ModuleCoreType]:
        """Get all loaded module cores."""
