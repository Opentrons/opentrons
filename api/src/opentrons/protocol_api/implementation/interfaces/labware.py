from abc import abstractmethod

from typing import (List, Dict, Optional, Union, TYPE_CHECKING)

from opentrons.protocol_api.context.interfaces.versioned import ApiVersioned
from opentrons.protocol_api.definitions import DeckItem

from opentrons.types import Location, Point
if TYPE_CHECKING:
    from opentrons.protocol_api.module_geometry import ModuleGeometry
    from opentrons_shared_data.labware.dev_types import LabwareParameters


class AbstractWell(ApiVersioned):

    @property
    @abstractmethod
    def parent(self) -> 'AbstractLabware':
        ...

    @property
    @abstractmethod
    def has_tip(self) -> bool:
        ...

    @abstractmethod
    def _set_has_tip(self, value: bool):
        ...

    @property
    @abstractmethod
    def diameter(self) -> Optional[float]:
        ...

    @property
    @abstractmethod
    def display_name(self):
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
    def __getitem__(self, key: str) -> AbstractWell:
        ...

    @property
    @abstractmethod
    def uri(self) -> str:
        ...

    @property
    @abstractmethod
    def parent(self) -> Union['AbstractLabware',
                              AbstractWell,
                              str,
                              'ModuleGeometry',
                              None]:
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    def _set_name(self, new_name: str):
        ...

    @property
    @abstractmethod
    def load_name(self) -> str:
        ...

    @property
    @abstractmethod
    def parameters(self) -> 'LabwareParameters':
        ...

    @property
    @abstractmethod
    def quirks(self) -> List[str]:
        ...

    @property
    @abstractmethod
    def magdeck_engage_height(self) -> Optional[float]:
        ...

    @abstractmethod
    def set_calibration(self, delta: Point):
        ...

    @property
    @abstractmethod
    def calibrated_offset(self) -> Point:
        ...

    @abstractmethod
    def well(self, idx) -> AbstractWell:
        ...

    @abstractmethod
    def wells(self, *args) -> List[AbstractWell]:
        ...

    @abstractmethod
    def wells_by_name(self) -> Dict[str, AbstractWell]:
        ...

    @abstractmethod
    def wells_by_index(self) -> Dict[str, AbstractWell]:
        ...

    @abstractmethod
    def rows(self, *args) -> List[List[AbstractWell]]:
        ...

    @abstractmethod
    def rows_by_name(self) -> Dict[str, List[AbstractWell]]:
        ...

    @abstractmethod
    def rows_by_index(self) -> Dict[str, List[AbstractWell]]:
        ...

    @abstractmethod
    def columns(self, *args) -> List[List[AbstractWell]]:
        ...

    @abstractmethod
    def columns_by_name(self) -> Dict[str, List[AbstractWell]]:
        ...

    @abstractmethod
    def columns_by_index(self) -> Dict[str, List[AbstractWell]]:
        ...

    @property
    @abstractmethod
    def is_tiprack(self) -> bool:
        ...

    @property
    @abstractmethod
    def tip_length(self) -> float:
        ...

    @abstractmethod
    def _set_tip_length(self, length: float):
        ...

    @abstractmethod
    def next_tip(self,
                 num_tips: int = 1,
                 starting_tip: AbstractWell = None) -> Optional[AbstractWell]:
        ...

    @abstractmethod
    def use_tips(self, start_well: AbstractWell, num_channels: int = 1):
        ...

    @abstractmethod
    def previous_tip(self, num_tips: int = 1) -> Optional[AbstractWell]:
        ...

    @abstractmethod
    def return_tips(self, start_well: AbstractWell, num_channels: int = 1):
        ...

    @abstractmethod
    def reset(self):
        ...
