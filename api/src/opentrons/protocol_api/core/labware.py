"""The interface that implements InstrumentContext."""

from abc import ABC, abstractmethod
from typing import Any, Generic, Dict, List, Optional, TypeVar

from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.geometry.labware_geometry import AbstractLabwareGeometry
from opentrons.protocols.api_support.tip_tracker import TipTracker
from opentrons.protocols.api_support.well_grid import WellGrid
from opentrons.types import Point
from opentrons_shared_data.labware.dev_types import LabwareParameters, LabwareDefinition

from .well import WellCoreType


class AbstractLabware(DeckItem, ABC, Generic[WellCoreType]):
    """Labware implementation core interface."""

    @abstractmethod
    def get_uri(self) -> str:
        ...

    @abstractmethod
    def get_display_name(self) -> str:
        ...

    @abstractmethod
    def get_label(self) -> Optional[str]:
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
    def set_tip_length(self, length: float) -> None:
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
    def get_wells(self) -> List[WellCoreType]:
        ...

    @abstractmethod
    def get_wells_by_name(self) -> Dict[str, WellCoreType]:
        ...

    @abstractmethod
    def get_geometry(self) -> AbstractLabwareGeometry:
        ...


LabwareCoreType = TypeVar("LabwareCoreType", bound=AbstractLabware[Any])
