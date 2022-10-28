"""Abstract interface for Well core implementations."""

from abc import ABC, abstractmethod
from typing import TypeVar

from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.types import Point


class AbstractWellCore(ABC):
    """Well core interface."""

    @abstractmethod
    def has_tip(self) -> bool:
        """Whether the well contains a tip."""
        ...

    @abstractmethod
    def set_has_tip(self, value: bool) -> None:
        """Set the well as containing or not containing a tip."""
        ...

    @abstractmethod
    def get_display_name(self) -> str:
        """Get the full display name of the well (e.g. "A1 of Some Labware")."""
        ...

    @abstractmethod
    def get_name(self) -> str:
        """Get the name of the well (e.g. "A1")."""
        ...

    @abstractmethod
    def get_column_name(self) -> str:
        """Get the column portion of the well name (e.g. "A")."""
        ...

    @abstractmethod
    def get_row_name(self) -> str:
        """Get the row portion of the well name (e.g. "1")."""
        ...

    @abstractmethod
    def get_max_volume(self) -> float:
        """Get the well's maximum liquid volume."""
        ...

    @abstractmethod
    def get_top(self, z_offset: float) -> Point:
        """Get the coordinate of the well's top, with an z-offset."""
        ...

    @abstractmethod
    def get_bottom(self, z_offset: float) -> Point:
        """Get the coordinate of the well's bottom, with an z-offset."""
        ...

    @abstractmethod
    def get_center(self) -> Point:
        """Get the coordinate of the well's center."""
        ...

    @abstractmethod
    def get_geometry(self) -> WellGeometry:
        """Get the well's geometry information interface."""
        ...


WellCoreType = TypeVar("WellCoreType", bound=AbstractWellCore)
