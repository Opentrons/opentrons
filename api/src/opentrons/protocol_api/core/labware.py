"""The interface that implements InstrumentContext."""

from abc import ABC, abstractmethod
from typing import Any, Generic, Dict, List, NamedTuple, Optional, TypeVar

from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.geometry.labware_geometry import AbstractLabwareGeometry
from opentrons.protocols.api_support.tip_tracker import TipTracker
from opentrons.protocols.api_support.well_grid import WellGrid
from opentrons.types import Point
from opentrons_shared_data.labware.dev_types import (
    LabwareParameters as LabwareParametersDict,
    LabwareDefinition as LabwareDefinitionDict,
)

from .well import WellCoreType


class LabwareLoadParams(NamedTuple):
    """Unique load parameters of a labware."""

    namespace: str
    load_name: str
    version: int

    def as_uri(self) -> str:
        """Get the labware's definition URI from the load parameters."""
        return f"{self.namespace}/{self.load_name}/{self.version}"


class AbstractLabware(DeckItem, ABC, Generic[WellCoreType]):
    """Labware implementation core interface."""

    @abstractmethod
    def get_uri(self) -> str:
        ...

    @abstractmethod
    def get_load_params(self) -> LabwareLoadParams:
        ...

    @abstractmethod
    def get_display_name(self) -> str:
        """Get a display name for the labware, falling back to the definition."""
        ...

    @abstractmethod
    def get_user_display_name(self) -> Optional[str]:
        """Get the user-specified display name of the labware, if set."""
        ...

    @abstractmethod
    def get_name(self) -> str:
        ...

    @abstractmethod
    def set_name(self, new_name: str) -> None:
        ...

    @abstractmethod
    def get_definition(self) -> LabwareDefinitionDict:
        """Get the labware's definition as a plain dictionary."""
        ...

    @abstractmethod
    def get_parameters(self) -> LabwareParametersDict:
        """Get the labware's definition's `parameters` field as a plain dictionary."""
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
