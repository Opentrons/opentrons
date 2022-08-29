"""Abstract interface for Well core implementations."""

from abc import ABC, abstractmethod
from typing import TypeVar

from opentrons.protocols.geometry.well_geometry import WellGeometry


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
        """Get the well's full display name."""
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
    def get_geometry(self) -> WellGeometry:
        """Get the well's geometry information interface."""
        ...


WellCoreType = TypeVar("WellCoreType", bound=AbstractWellCore)
