from abc import abstractmethod
from typing import List, Dict

from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.geometry.labware_geometry import LabwareGeometry
from opentrons.protocols.implementations.tip_tracker import TipTracker
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.protocols.implementations.well_grid import WellGrid
from opentrons.types import Point
from opentrons_shared_data.labware.dev_types import (
    LabwareParameters, LabwareDefinition)


class AbstractLabwareImplementation(DeckItem):
    """Abstract base class of Labware Implementations"""

    @abstractmethod
    def get_uri(self) -> str:
        ...

    @abstractmethod
    def get_display_name(self) -> str:
        ...

    @abstractmethod
    def get_name(self) -> str:
        ...

    @abstractmethod
    def set_name(self, new_name: str) -> None:
        ...

    @abstractmethod
    def get_definition(self) -> LabwareDefinition:
        ...

    @abstractmethod
    def get_parameters(self) -> LabwareParameters:
        ...

    @abstractmethod
    def get_quirks(self) -> List[str]:
        ...

    @abstractmethod
    def set_calibration(self, delta: Point) -> None:
        ...

    @abstractmethod
    def get_calibrated_offset(self) -> Point:
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
    def reset_tips(self) -> None:
        ...

    @abstractmethod
    def get_tip_tracker(self) -> TipTracker:
        ...

    @abstractmethod
    def get_well_grid(self) -> WellGrid:
        ...

    @abstractmethod
    def get_wells(self) -> List[WellImplementation]:
        ...

    @abstractmethod
    def get_wells_by_name(self) -> Dict[str, WellImplementation]:
        ...

    @abstractmethod
    def get_geometry(self) -> LabwareGeometry:
        ...
