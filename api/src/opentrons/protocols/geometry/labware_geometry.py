from abc import ABC, abstractmethod

from opentrons.types import Location, Point
from opentrons_shared_data.labware.types import LabwareDefinition


class AbstractLabwareGeometry(ABC):
    """Convenience interface for accessing geometry properties of a labware."""

    @property
    @abstractmethod
    def parent(self) -> Location:
        ...

    @property
    @abstractmethod
    def offset(self) -> Point:
        ...

    @property
    @abstractmethod
    def x_dimension(self) -> float:
        ...

    @property
    @abstractmethod
    def y_dimension(self) -> float:
        ...

    @property
    @abstractmethod
    def z_dimension(self) -> float:
        ...


class LabwareGeometry(AbstractLabwareGeometry):
    def __init__(self, definition: LabwareDefinition, parent: Location):
        """Constructor"""
        self._parent = parent
        offset = definition["cornerOffsetFromSlot"]
        self._offset = Point(offset["x"], offset["y"], offset["z"]) + parent.point

        dimensions = definition["dimensions"]
        self._x_dimension = dimensions["xDimension"]
        self._y_dimension = dimensions["yDimension"]
        self._z_dimension = dimensions["zDimension"]

    @property
    def parent(self) -> Location:
        return self._parent

    @property
    def offset(self) -> Point:
        return self._offset

    @property
    def x_dimension(self) -> float:
        return self._x_dimension

    @property
    def y_dimension(self) -> float:
        return self._y_dimension

    @property
    def z_dimension(self) -> float:
        return self._z_dimension
