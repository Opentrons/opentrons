"""This module will replace Placeable"""
import re
import os
import json
import time
from typing import List, Dict
from enum import Enum, auto
from opentrons.types import Point
from opentrons.util import environment as env
from collections import defaultdict


class WellShape(Enum):
    RECTANGULAR = auto()
    CIRCULAR = auto()


well_shapes = {
    'rectangular': WellShape.RECTANGULAR,
    'circular': WellShape.CIRCULAR
}

persistent_path = os.path.join(env.get_path('APP_DATA_DIR'), 'offsets')


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
        self._calibrated_offset: Point = Point(0, 0, 0)
        self._wells: List[Well] = []
        # Directly from definition
        self._well_definition = definition['wells']
        self._id = definition['otId']
        self._parameters = definition['parameters']
        offset = definition['cornerOffsetFromSlot']
        # Inferred from definition
        self._ordering = [well
                          for col in definition['ordering']
                          for well in col]
        self._offset = Point(x=offset['x'] + parent.x,
                             y=offset['y'] + parent.y,
                             z=offset['z'] + parent.z)
        # Applied properties
        self.set_calibration(self._calibrated_offset)
        self._pattern = re.compile(r'^([A-Z]+)([1-9][0-9]*)$', re.X)

    def _build_wells(self) -> List[Well]:
        """
        This function is used to create one instance of wells to be used by all
        accessor functions. It is only called again if a new offset needs
        to be applied.
        """
        return [Well(self._well_definition[well], self._calibrated_offset)
                for well in self._ordering]

    def _create_indexed_dictionary(self, group=0):
        dictList = defaultdict(list)
        for index, wellObj in zip(self._ordering, self._wells):
            dictList[self._pattern.match(index).group(group)].append(wellObj)
        return dictList

    def set_calibration(self, delta: Point):
        """
        Called by save calibration in order to update the offset on the object.
        """
        self._calibrated_offset = Point(x=self._offset.x + delta.x,
                                        y=self._offset.y + delta.y,
                                        z=self._offset.z + delta.z)
        self._wells = self._build_wells()

    def wells(self) -> List[Well]:
        """
        Accessor function used to generate a list of wells in top -> down,
        left -> right order. This is representative of moving down `rows` and
        across `columns` (e.g. 'A1', 'B1', 'C1'...'A2', 'B2', 'C2')

        With indexing one can treat it as a typical python
        list. To access well A1, for example, simply write: labware.wells()[0]

        :return: Ordered list of all wells in a labware
        """
        return self._wells

    def wells_by_index(self) -> Dict[str, Well]:
        """
        Accessor function used to create a look-up table of Wells by name.

        With indexing one can treat it as a typical python
        dictionary whose keys are well names. To access well A1, for example,
        simply write: labware.wells_by_index()['A1']

        :return: Dictionary of well objects keyed by well name
        """
        return {well: wellObj
                for well, wellObj in zip(self._ordering, self._wells)}

    def rows(self) -> List[List[Well]]:
        """
        Accessor function used to navigate through a labware by row.

        With indexing one can treat it as a typical python nested list.
        To access row A for example, simply write: labware.rows()[0]. This
        will output ['A1', 'A2', 'A3', 'A4'...]

        :return: A list of row lists
        """
        rowDict = self._create_indexed_dictionary(group=1)
        keys = sorted(rowDict)
        return [rowDict[key] for key in keys]

    def rows_by_index(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by row name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example, simply write: labware.rows_by_index()['A']
        This will output ['A1', 'A2', 'A3', 'A4'...].

        :return: Dictionary of Well lists keyed by row name
        """
        rowDict = self._create_indexed_dictionary(group=1)
        return rowDict

    def columns(self) -> List[List[Well]]:
        """
        Accessor function used to navigate through a labware by column.

        With indexing one can treat it as a typical python nested list.
        To access row A for example,
        simply write: labware.columns()[0]
        This will output ['A1', 'B1', 'C1', 'D1'...].

        :return: A list of column lists
        """
        colDict = self._create_indexed_dictionary(group=2)
        keys = sorted(colDict)
        return [colDict[key] for key in keys]

    def columns_by_index(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by column name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example,
        simply write: labware.columns_by_index()['1']
        This will output ['A1', 'B1', 'C1', 'D1'...].

        :return: Dictionary of Well lists keyed by column name
        """
        colDict = self._create_indexed_dictionary(group=2)
        return colDict


def save_calibration(labware: Labware, delta: Point):
    """
    Function to be used whenever an updated delta is found for the first well
    of a given labware. If an offset file does not exist, create the file
    using labware id as the filename. If the file does exist, load it and
    modify the delta and the lastModified field.
    """
    if not os.path.exists(persistent_path):
        os.mkdir(persistent_path)
    labwareOffsetPath = os.path.join(
        persistent_path, "{}.json".format(labware._id))
    calibration_data = _helper_offset_data_format(labwareOffsetPath, delta)
    with open(labwareOffsetPath, 'w') as f:
        json.dump(calibration_data, f)
    labware.set_calibration(delta)


def load_calibration(labware: Labware):
    """
    Look up a calibration if it exists and apply it to the given labware.
    """
    offset = Point(0, 0, 0)
    labwareOffsetPath = os.path.join(
        persistent_path, "{}.json".format(labware._id))
    if os.path.exists(labwareOffsetPath):
        calibration_data = _read_file(labwareOffsetPath)
        offsetArray = calibration_data['default']['offset']
        offset = Point(x=offsetArray[0], y=offsetArray[1], z=offsetArray[2])
    labware.set_calibration(offset)


def _helper_offset_data_format(filepath: str, delta: Point) -> dict:
    if not os.path.exists(filepath):
        calibration_data = {
            "default": {
                "offset": [delta.x, delta.y, delta.z],
                "lastModified": time.time()
            }
        }
    else:
        calibration_data = _read_file(filepath)
        calibration_data['default']['offset'] = [delta.x, delta.y, delta.z]
        calibration_data['default']['lastModified'] = time.time()
    return calibration_data


def _read_file(filepath: str) -> dict:
    calibration_data: dict = {}
    with open(filepath, 'r') as f:
        calibration_data = json.load(f)
    return calibration_data


def _load_definition_by_name(name: str) -> dict:
    """
    Look up and return a definition by name (name is expected to correspond to
    the filename of the definition, with the .json extension) and return it or
    raise an exception
    """
    raise NotImplementedError


def load(name: str, cornerOffset: Point) -> Labware:
    """
    Return a labware object constructed from a labware definition dict looked
    up by name (definition must have been previously stored locally on the
    robot)
    """
    definition = _load_definition_by_name(name)
    return load_from_definition(definition, cornerOffset)


def load_from_definition(definition: dict, cornerOffset: Point) -> Labware:
    """
    Return a labware object constructed from a provided labware definition dict
    """
    labware = Labware(definition, cornerOffset)
    load_calibration(labware)
    return labware
