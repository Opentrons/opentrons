from __future__ import annotations

from abc import abstractmethod

from typing import (List, Dict, Optional, Union, TYPE_CHECKING)

from opentrons.protocol_api.implementation.interfaces.versioned import \
    ApiVersioned
from opentrons.protocol_api.definitions import DeckItem
from opentrons.protocol_api.labware import Labware, Well
from opentrons.protocol_api.module_geometry import ModuleGeometry

from opentrons.types import Location, Point
if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareParameters


class AbstractWell(ApiVersioned):

    @abstractmethod
    def get_parent(self) -> Labware:
        ...

    @abstractmethod
    def has_tip(self) -> bool:
        ...

    @abstractmethod
    def set_has_tip(self, value: bool):
        ...

    @abstractmethod
    def get_diameter(self) -> Optional[float]:
        ...

    @abstractmethod
    def get_display_name(self):
        ...

    @abstractmethod
    def top(self, z: float = 0.0) -> Location:
        ...

    @abstractmethod
    def bottom(self, z: float = 0.0) -> Location:
        ...

    @abstractmethod
    def center(self) -> Location:
        ...


class AbstractLabware(ApiVersioned, DeckItem):

    @abstractmethod
    def __getitem__(self, key: str) -> Well:
        ...

    @abstractmethod
    def get_uri(self) -> str:
        ...

    @abstractmethod
    def parent(self) -> Union[Labware,
                              Well,
                              str,
                              ModuleGeometry,
                              None]:
        ...

    @abstractmethod
    def get_name(self) -> str:
        ...

    @abstractmethod
    def set_name(self, new_name: str):
        ...

    @abstractmethod
    def get_load_name(self) -> str:
        ...

    @abstractmethod
    def get_parameters(self) -> 'LabwareParameters':
        ...

    @abstractmethod
    def get_quirks(self) -> List[str]:
        ...

    @abstractmethod
    def get_magdeck_engage_height(self) -> Optional[float]:
        ...

    @abstractmethod
    def set_calibration(self, delta: Point):
        ...

    @abstractmethod
    def get_calibrated_offset(self) -> Point:
        ...

    @abstractmethod
    def well(self, idx) -> Well:
        ...

    @abstractmethod
    def wells(self, *args) -> List[Well]:
        ...

    @abstractmethod
    def wells_by_name(self) -> Dict[str, Well]:
        ...

    @abstractmethod
    def wells_by_index(self) -> Dict[str, Well]:
        ...

    @abstractmethod
    def rows(self, *args) -> List[List[Well]]:
        ...

    @abstractmethod
    def rows_by_name(self) -> Dict[str, List[Well]]:
        ...

    @abstractmethod
    def rows_by_index(self) -> Dict[str, List[Well]]:
        ...

    @abstractmethod
    def columns(self, *args) -> List[List[Well]]:
        ...

    @abstractmethod
    def columns_by_name(self) -> Dict[str, List[Well]]:
        ...

    @abstractmethod
    def columns_by_index(self) -> Dict[str, List[Well]]:
        ...

    @abstractmethod
    def is_tiprack(self) -> bool:
        ...

    @abstractmethod
    def get_tip_length(self) -> float:
        ...

    @abstractmethod
    def set_tip_length(self, length: float):
        ...

    @abstractmethod
    def next_tip(self,
                 num_tips: int = 1,
                 starting_tip: Well = None) -> Optional[Well]:
        ...

    @abstractmethod
    def use_tips(self, start_well: Well, num_channels: int = 1):
        ...

    @abstractmethod
    def previous_tip(self,
                     num_tips: int = 1) -> Optional[Well]:
        ...

    @abstractmethod
    def return_tips(self,
                    start_well: Well,
                    num_channels: int = 1):
        ...

    @abstractmethod
    def reset(self):
        ...
