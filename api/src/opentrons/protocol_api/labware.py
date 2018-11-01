"""This module will replace Placeable"""
from collections import defaultdict
from enum import Enum, auto
import json
import os
import re
import time
from typing import List, Dict

from opentrons.types import Point, Location
from opentrons.util import environment as env


class WellShape(Enum):
    RECTANGULAR = auto()
    CIRCULAR = auto()


well_shapes = {
    'rectangular': WellShape.RECTANGULAR,
    'circular': WellShape.CIRCULAR
}

persistent_path = os.path.join(env.get_path('APP_DATA_DIR'), 'offsets')


class Well:
    def __init__(
            self, well_props: dict, parent: Location, display_name: str)\
            -> None:
        """
        Create a well, and track the Point corresponding to the top-center of
        the well (this Point is in absolute deck coordinates)

        :param display_name: a string that identifies a well. Used primarily
            for debug and test purposes. Should be unique and human-readable--
            something like "Tip C3 of Opentrons 300ul Tiprack on Slot 5" or
            "Well D1 of Biorad 96 PCR Plate on Magnetic Module in Slot 1".
            This is created by the caller and passed in, so here it is just
            saved and made available.
        :param well_props: a dict that conforms to the json-schema for a Well
        :param parent: a :py:class:`.Location` Point representing the absolute
                       position of the parent of the Well (usually the
                       lower-left corner of a labware)
        """
        self._display_name = display_name
        self._position = Point(
            x=well_props['x'] + parent.point.x,
            y=well_props['y'] + parent.point.y,
            z=well_props['z'] + well_props['depth'] + parent.point.z)

        if not parent.labware:
            raise ValueError("Wells must have a parent")
        self._parent = parent.labware
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

    @property
    def parent(self) -> 'Labware':
        return self._parent

    def top(self) -> Location:
        """
        :return: a Point corresponding to the absolute position of the
        top-center of the well relative to the deck (with the lower-left corner
        of slot 1 as (0,0,0))
        """
        return Location(self._position, self)

    def bottom(self) -> Location:
        """
        :return: a Point corresponding to the absolute position of the
        bottom-center of the well (with the lower-left corner of slot 1 as
        (0,0,0))
        """
        top = self.top()
        bottom_z = top.point.z - self._depth
        return Location(Point(x=top.point.x, y=top.point.y, z=bottom_z), self)

    def center(self) -> Location:
        """
        :return: a Point corresponding to the absolute position of the center
        of the well relative to the deck (with the lower-left corner of slot 1
        as (0,0,0))
        """
        top = self.top()
        center_z = top.point.z - (self._depth / 2.0)
        return Location(Point(x=top.point.x, y=top.point.y, z=center_z), self)

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
            x=center.point.x + (x * (x_size / 2.0)),
            y=center.point.y + (y * (y_size / 2.0)),
            z=center.point.z + (z * (z_size / 2.0)))

    def __str__(self):
        return self._display_name

    def __eq__(self, other: object) -> bool:
        """
        Assuming that equality of wells in this system is having the same
        absolute coordinates for the top.
        """
        if not isinstance(other, Well):
            return NotImplemented
        return self.top().point == other.top().point


class Labware:
    """
    This class represents a labware, such as a PCR plate, a tube rack, trough,
    tip rack, etc. It defines the physical geometry of the labware, and
    provides methods for accessing wells within the labware.
    """
    def __init__(
            self, definition: dict, parent: Point, parent_name: str) -> None:
        """
        :param definition: A dict representing all required data for a labware,
            including metadata such as the display name of the labware, a
            definition of the order to iterate over wells, the shape of wells
            (shape, physical dimensions, etc), and so on. The correct shape of
            this definition is governed by the "labware-designer" project in
            the Opentrons/opentrons repo.
        :param parent: A Point representing the critical point for the object
            upon which the labware is mounted (often the lower-left corner of
            a slot on the deck)
        :param parent_name: A string with the debug name of the parent, usually
            either the name of the slot or another device that can have a
            labware mounted on it (e.g.: "Slot 5" or "Temperature Module in
            Slot 4")
        """
        self._display_name = "{} on {}".format(
            definition['metadata']['displayName'], parent_name)
        self._calibrated_offset: Point = Point(0, 0, 0)
        self._wells: List[Well] = []
        # Directly from definition
        self._well_definition = definition['wells']
        self._id = definition['otId']
        self._parameters = definition['parameters']
        offset = definition['cornerOffsetFromSlot']
        self._dimensions = definition['dimensions']
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
        return [
            Well(
                self._well_definition[well],
                Location(self._calibrated_offset, self),
                "{} of {}".format(well, self._display_name))
            for well in self._ordering]

    def _create_indexed_dictionary(self, group=0):
        """
        Creates a dict of lists of Wells. Which way the labware is segmented
        determines whether this is a dict of rows or dict of columns. If group
        is 1, then it will collect wells that have the same alphabetic prefix
        and therefore are considered to be in the same row. If group is 2, it
        will collect wells that have the same numeric postfix and therefore
        are considered to be in the same column.
        """
        dict_list = defaultdict(list)
        for index, well_obj in zip(self._ordering, self._wells):
            dict_list[self._pattern.match(index).group(group)].append(well_obj)
        return dict_list

    def set_calibration(self, delta: Point):
        """
        Called by save calibration in order to update the offset on the object.
        """
        self._calibrated_offset = Point(x=self._offset.x + delta.x,
                                        y=self._offset.y + delta.y,
                                        z=self._offset.z + delta.z)
        self._wells = self._build_wells()

    @property
    def calibrated_offset(self) -> Point:
        return self._calibrated_offset

    def well(self, idx) -> Well:
        """Deprecated---use result of `wells` or `wells_by_index`"""
        if isinstance(idx, int):
            res = self._wells[idx]
        elif isinstance(idx, str):
            res = self.wells_by_index()[idx]
        else:
            res = NotImplemented
        return res

    def wells(self, *args) -> List[Well]:
        """
        Accessor function used to generate a list of wells in top -> down,
        left -> right order. This is representative of moving down `rows` and
        across `columns` (e.g. 'A1', 'B1', 'C1'...'A2', 'B2', 'C2')

        With indexing one can treat it as a typical python
        list. To access well A1, for example, simply write: labware.wells()[0]

        Note that this method takes args for backward-compatibility, but use
        of args is deprecated and will be removed in future versions. Args
        can be either strings or integers, but must all be the same type (e.g.:
        `self.wells(1, 4, 8)` or `self.wells('A1', 'B2')`, but
        `self.wells('A1', 4)` is invalid.

        :return: Ordered list of all wells in a labware
        """
        if not args:
            res = self._wells
        elif isinstance(args[0], int):
            res = [self._wells[idx] for idx in args]
        elif isinstance(args[0], str):
            res = [self.wells_by_index()[idx] for idx in args]
        else:
            raise TypeError
        return res

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

    def rows(self, *args) -> List[List[Well]]:
        """
        Accessor function used to navigate through a labware by row.

        With indexing one can treat it as a typical python nested list.
        To access row A for example, simply write: labware.rows()[0]. This
        will output ['A1', 'A2', 'A3', 'A4'...]

        Note that this method takes args for backward-compatibility, but use
        of args is deprecated and will be removed in future versions. Args
        can be either strings or integers, but must all be the same type (e.g.:
        `self.rows(1, 4, 8)` or `self.rows('A', 'B')`, but  `self.rows('A', 4)`
        is invalid.

        :return: A list of row lists
        """
        row_dict = self._create_indexed_dictionary(group=1)
        keys = sorted(row_dict)

        if not args:
            res = [row_dict[key] for key in keys]
        elif isinstance(args[0], int):
            res = [row_dict[keys[idx]] for idx in args]
        elif isinstance(args[0], str):
            res = [row_dict[idx] for idx in args]
        else:
            raise TypeError
        return res

    def rows_by_index(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by row name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example, simply write: labware.rows_by_index()['A']
        This will output ['A1', 'A2', 'A3', 'A4'...].

        :return: Dictionary of Well lists keyed by row name
        """
        row_dict = self._create_indexed_dictionary(group=1)
        return row_dict

    def columns(self, *args) -> List[List[Well]]:
        """
        Accessor function used to navigate through a labware by column.

        With indexing one can treat it as a typical python nested list.
        To access row A for example,
        simply write: labware.columns()[0]
        This will output ['A1', 'B1', 'C1', 'D1'...].

        Note that this method takes args for backward-compatibility, but use
        of args is deprecated and will be removed in future versions. Args
        can be either strings or integers, but must all be the same type (e.g.:
        `self.columns(1, 4, 8)` or `self.columns('1', '2')`, but
        `self.columns('1', 4)` is invalid.

        :return: A list of column lists
        """
        col_dict = self._create_indexed_dictionary(group=2)
        keys = sorted(col_dict)

        if not args:
            res = [col_dict[key] for key in keys]
        elif isinstance(args[0], int):
            res = [col_dict[keys[idx]] for idx in args]
        elif isinstance(args[0], str):
            res = [col_dict[idx] for idx in args]
        else:
            raise TypeError
        return res

    def columns_by_index(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by column name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example,
        simply write: labware.columns_by_index()['1']
        This will output ['A1', 'B1', 'C1', 'D1'...].

        :return: Dictionary of Well lists keyed by column name
        """
        col_dict = self._create_indexed_dictionary(group=2)
        return col_dict

    def cols(self, *args):
        """Deprecated--use `columns`"""
        return self.columns(*args)

    @property
    def highest_z(self) -> float:
        """
        The z-coordinate of the tallest single point anywhere on the labware.

        This is drawn from the 'dimensions'/'overallHeight' elements of the
        labware definition and takes into account the calibration offset.
        """
        return self._dimensions['overallHeight'] + self._calibrated_offset.z

    def __repr__(self):
        return self._display_name

    def __getitem__(self, item):
        """Deprecated--use `wells` or `wells_by_index`"""
        if isinstance(item, str):
            return self.wells_by_index()[item]
        elif isinstance(item, int):
            return self.wells()[item]
        else:
            raise KeyError


def save_calibration(labware: Labware, delta: Point):
    """
    Function to be used whenever an updated delta is found for the first well
    of a given labware. If an offset file does not exist, create the file
    using labware id as the filename. If the file does exist, load it and
    modify the delta and the lastModified field.
    """
    if not os.path.exists(persistent_path):
        os.mkdir(persistent_path)
    labware_offset_path = os.path.join(
        persistent_path, "{}.json".format(labware._id))
    calibration_data = _helper_offset_data_format(labware_offset_path, delta)
    with open(labware_offset_path, 'w') as f:
        json.dump(calibration_data, f)
    labware.set_calibration(delta)


def load_calibration(labware: Labware):
    """
    Look up a calibration if it exists and apply it to the given labware.
    """
    offset = Point(0, 0, 0)
    labware_offset_path = os.path.join(
        persistent_path, "{}.json".format(labware._id))
    if os.path.exists(labware_offset_path):
        calibration_data = _read_file(labware_offset_path)
        offset_array = calibration_data['default']['offset']
        offset = Point(x=offset_array[0], y=offset_array[1], z=offset_array[2])
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
    with open(filepath, 'r') as f:
        calibration_data = json.load(f)
    return calibration_data


def _load_definition_by_name(name: str) -> dict:
    """
    Look up and return a definition by name (name is expected to correspond to
    the filename of the definition, with the .json extension) and return it or
    raise an exception

    :param name: A string to use for looking up a labware defintion previously
        saved to disc. The definition file must have been saved in a known
        location with the filename '${name}.json'
    """
    raise NotImplementedError


def load(name: str, parent: Point, parent_name: str) -> Labware:
    """
    Return a labware object constructed from a labware definition dict looked
    up by name (definition must have been previously stored locally on the
    robot)

    :param name: A string to use for looking up a labware definition previously
        saved to disc. The definition file must have been saved in a known
        location with the filename '${name}.json'
    :param parent: A Point representing the critical point for the object
        upon which the labware is mounted (often the lower-left corner of
        a slot on the deck)
    :param parent_name: A string with the debug name of the parent, usually
        either the name of the slot or another device that can have a
        labware mounted on it (e.g.: "Slot 5" or "Temperature Module in
        Slot 4")
    """
    definition = _load_definition_by_name(name)
    return load_from_definition(definition, parent, parent_name)


def load_from_definition(
        definition: dict, parent: Point, parent_name: str) -> Labware:
    """
    Return a labware object constructed from a provided labware definition dict

    :param definition: A dict representing all required data for a labware,
        including metadata such as the display name of the labware, a
        definition of the order to iterate over wells, the shape of wells
        (shape, physical dimensions, etc), and so on. The correct shape of
        this definition is governed by the "labware-designer" project in
        the Opentrons/opentrons repo.
    :param parent: A Point representing the critical point for the object
        upon which the labware is mounted (often the lower-left corner of
        a slot on the deck)
    :param parent_name: A string with the debug name of the parent, usually
        either the name of the slot or another device that can have a
        labware mounted on it (e.g.: "Slot 5" or "Temperature Module in
        Slot 4")
    """
    labware = Labware(definition, parent, parent_name)
    load_calibration(labware)
    return labware


def clear_calibrations():
    """
    Delete all calibration files for labware. This includes deleting tip-length
    data for tipracks.
    """
    try:
        targets = [
            f for f in os.listdir(persistent_path) if f.endswith('.json')]
        for target in targets:
            os.remove(os.path.join(persistent_path, target))
    except FileNotFoundError:
        pass
