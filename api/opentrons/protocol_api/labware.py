"""This module will replace Placeable"""
from typing import List, Dict
from enum import Enum, auto
from opentrons.types import Point


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
        :return: a Point corresponding to the absolute position of the
        top-center of the well relative to the deck (with the lower-left corner
        of slot 1 as (0,0,0))
        """
        return self._position

    def bottom(self) -> Point:
        """
        :return: a Point corresponding to the absolute position of the
        bottom-center of the well (with the lower-left corner of slot 1 as
        (0,0,0))
        """
        top = self.top()
        bottom_z = top.z - self._depth
        return Point(x=top.x, y=top.y, z=bottom_z)

    def center(self) -> Point:
        """
        :return: a Point corresponding to the absolute position of the center
        of the well relative to the deck (with the lower-left corner of slot 1
        as (0,0,0))
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
        the call would be `_from_center_cartesian(1, 1, -0.5)`.

        No checks are performed to ensure that the resulting position will be
        inside of the well.

        :param x: a float in the range [-1.0, 1.0] for a percentage of half of
            the radius/width in the X axis
        :param y: a float in the range [-1.0, 1.0] for a percentage of half of
            the radius/length in the Y axis
        :param z: a float in the range [-1.0, 1.0] for a percentage of half of
            the height above/below the center

        :return: a Point representing the specified location in absolute deck
        coordinates
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
        self._ordering = definition['ordering']
        self._wells = definition['wells']
        offset = definition['cornerOffsetFromSlot']
        self._offset = Point(x=offset['x'], y=offset['y'], z=offset['z'])

    def wells(self) -> List[Well]:
        """
        Accessor function used to generate a list of wells in top -> down,
        left -> right order. This is representative of moving down `rows` and
        across `columns` (e.g. 'A1', 'B1', 'C1'...'A2', 'B2', 'C2')

        With indexing one can treat it as a typical python
        list. To access well A1, for example, simply write: labware.wells()[0]

        :return: Ordered list of all wells in a labware
        """
        return [Well(self._wells[well], self._offset)
                for col in self._ordering for well in col]

    def wells_by_index(self) -> Dict[str, Well]:
        """
        Accessor function used to create a look-up table of Wells by name.

        With indexing one can treat it as a typical python
        dictionary whose keys are well names. To access well A1, for example,
        simply write: labware.wells_by_index()['A1']

        :return: Dictionary of well objects keyed by well name
        """
        return {well: Well(self._wells[well], self._offset)
                for col in self._ordering for well in col}

    def rows(self) -> List[List[Well]]:
        """
        Accessor function used to navigate through a labware by row.

        With indexing one can treat it as a typical python nested list.
        To access row A for example, simply write: labware.rows()[0]. This
        will output ['A1', 'A2', 'A3', 'A4'...]

        :return: A list of row lists
        """
        return [[Well(self._wells[well], self._offset) for well in row]
                for row in zip(*self._ordering)]

    def rows_by_index(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by row name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example, simply write: labware.rows_by_index()['A']
        This will output ['A1', 'A2', 'A3', 'A4'...].

        :return: Dictionary of Well lists keyed by row name
        """
        return {chr(ord('A') + idx):
                [Well(self._wells[well], self._offset) for well in row]
                for idx, row in enumerate(zip(*self._ordering))}

    def columns(self) -> List[List[Well]]:
        """
        Accessor function used to navigate through a labware by column.

        With indexing one can treat it as a typical python nested list.
        To access row A for example,
        simply write: labware.columns()[0]
        This will output ['A1', 'B1', 'C1', 'D1'...].

        :return: A list of column lists
        """
        return [[Well(self._wells[well], self._offset) for well in col]
                for col in self._ordering]

    def columns_by_index(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by column name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example,
        simply write: labware.columns_by_index()['1']
        This will output ['A1', 'B1', 'C1', 'D1'...].

        :return: Dictionary of Well lists keyed by column name
        """
        return {str(idx + 1):
                [Well(self._wells[well], self._offset) for well in col]
                for idx, col in enumerate(self._ordering)}


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
