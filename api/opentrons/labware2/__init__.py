"""
This module will replace Placeable, and should eventually be renamed to
`labware` and moved to the protocol_api module.
"""
from typing import List, Dict
from enum import Enum, auto
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y', 'z'])


class WellShape(Enum):
    RECTANGULAR = auto()
    CIRCULAR = auto()


well_shapes = {
    'rectangular': WellShape.RECTANGULAR,
    'circular': WellShape.CIRCULAR
}


class Well:
    def __init__(self, well_props: dict, parent: Point) -> None:
        """
        Create a well, and track the Point corresponding to the top-center of
        the well (this Point is in absolute deck coordinates)
        :param well_props: a dict that conforms to the json-schema for a Well
        :param parent: a Point representing the absolute position of the parent
            of the Well (usually the lower-left corner of a labware)
        """
        self._position = Point(
            x=well_props['x'] + parent.x,
            y=well_props['y'] + parent.y,
            z=well_props['z'] + well_props['depth'] + parent.z)

        self._shape = well_shapes.get(well_props['shape'])
        if self._shape is WellShape.RECTANGULAR:
            self._length = well_props['length']
            self._width = well_props['width']
            self._diameter = None
        elif self._shape is WellShape.CIRCULAR:
            self._length = None
            self._width = None
            self._diameter = well_props['diameter']
        else:
            raise ValueError(
                'Shape "{}" is not a supported well shape'.format(
                    well_props['shape']))

        self._depth = well_props['depth']

    def top(self) -> Point:
        """
        :return: a Point corresponding to the top-center of the well, relative
        to the origin of the labware
        """
        return self._position

    def bottom(self) -> Point:
        """
        :return: a Point corresponding to the bottom-center of the well,
        relative to the origin of the labware
        """
        top = self.top()
        bottom_z = top.z - self._depth
        return Point(x=top.x, y=top.y, z=bottom_z)

    def center(self) -> Point:
        """
        :return: a Point corresponding to the center of the well, relative to
        the origin of the labware
        """
        top = self.top()
        center_z = top.z - (self._depth / 2.0)
        return Point(x=top.x, y=top.y, z=center_z)

    def _from_center_cartesian(
            self, x: float, y: float, z: float) -> Point:
        """
        Specifies an arbitrary point relative to the center of the well based
        on percentages of the radius in each axis. For example, to specify the
        back-right corner of a well at 1/4 of the well depth from the bottom,
        the call would be `_from_center_cartesian(1, 1, -0.5)`. This point is
        relative to origin of the labware containing the well, so if the well
        defintion specifies its top-center as (100, 25, 20) and a depth of 18,
        and a diameter of 8, then `_from_center_cartesian(0.5, -0.5, 0.1)`
        would return (102, 23, 12.8).

        Note that the behavior of the `z` parameter is identical to `h` for
        `_from_center_polar`.

        No checks are performed to ensure that the resulting position will be
        inside of the well.

        :param x: a float in the range [-1.0, 1.0] for a percentage of half of
            the radius/width in the X axis
        :param y: a float in the range [-1.0, 1.0] for a percentage of half of
            the radius/length in the Y axis
        :param z: a float in the range [-1.0, 1.0] for a percentage of half of
            the height above/below the center

        :return: a Point relative to the center of the well
        """
        center = self.center()
        if self._shape is WellShape.RECTANGULAR:
            x_size = self._width
            y_size = self._length
        else:
            x_size = self._diameter
            y_size = self._diameter
        z_size = self._depth

        return Point(
            x=center.x + (x * (x_size / 2.0)),
            y=center.y + (y * (y_size / 2.0)),
            z=center.z + (z * (z_size / 2.0)))


class Labware:
    """
    This class represents a labware, such as a PCR plate, a tube rack, trough,
    tip rack, etc. It defines the physical geometry of the labware, and
    provides methods for accessing wells within the labware.
    """
    def __init__(self, definition: dict, parent: Point) -> None:
        pass

    def wells(self) -> List[Well]:
        pass

    def wells_by_index(self) -> Dict[str, Well]:
        pass

    def rows(self) -> List[List[Well]]:
        pass

    def rows_by_index(self) -> Dict[str, List[Well]]:
        pass

    def columns(self) -> List[List[Well]]:
        pass

    def columns_by_index(self) -> Dict[str, List[Well]]:
        pass


def _load_definition_by_name(name: str) -> dict:
    """
    Look up and return a definition by name (name is expected to correspond to
    the filename of the definition, with the .json extension) and return it or
    raise an exception
    """
    raise NotImplementedError


def _get_slot_position(slot: str) -> Point:
    """
    :param slot: a string corresponding to a slot on the deck
    :return: a Point representing the position of the lower-left corner of the
        slot
    """
    raise NotImplementedError


def load(name: str, slot: str) -> Labware:
    """
    Return a labware object constructed from a labware definition dict looked
    up by name (definition must have been previously stored locally on the
    robot)
    """
    definition = _load_definition_by_name(name)
    return load_from_definition(definition, slot)


def load_from_definition(definition: dict, slot: str) -> Labware:
    """
    Return a labware object constructed from a provided labware definition dict
    """
    point = _get_slot_position(slot)
    return Labware(definition, point)
