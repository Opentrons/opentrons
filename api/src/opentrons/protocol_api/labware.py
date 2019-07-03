"""This module will replace Placeable"""
import json
import re
import time
import pkgutil
import shutil
import sys
from pathlib import Path
from collections import defaultdict
from enum import Enum, auto
from hashlib import sha256
from itertools import takewhile, dropwhile
from typing import Any, List, Dict, Optional, Union

from opentrons.types import Location
from opentrons.types import Point
from opentrons.config import CONFIG

# TODO: Ian 2019-05-23 where to store these constants?
OPENTRONS_NAMESPACE = 'opentrons'
CUSTOM_NAMESPACE = 'custom_beta'
STANDARD_DEFS_PATH = Path(sys.modules['opentrons'].__file__).parent /\
    'shared_data' / 'labware' / 'definitions' / '2'


class WellShape(Enum):
    RECTANGULAR = auto()
    CIRCULAR = auto()


well_shapes = {
    'rectangular': WellShape.RECTANGULAR,
    'circular': WellShape.CIRCULAR
}


class Well:
    """
    The Well class represents a  single well in a :py:class:`Labware`

    It provides functions to return positions used in operations on the well
    such as :py:meth:`top`, :py:meth:`bottom`
    """
    def __init__(self, well_props: dict,
                 parent: Location,
                 display_name: str,
                 has_tip: bool) -> None:
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
                       front-left corner of a labware)
        """
        self._display_name = display_name
        self._position\
            = Point(well_props['x'],
                    well_props['y'],
                    well_props['z'] + well_props['depth']) + parent.point

        if not parent.labware:
            raise ValueError("Wells must have a parent")
        self._parent = parent.labware
        self._has_tip = has_tip
        self._shape = well_shapes.get(well_props['shape'])
        if self._shape is WellShape.RECTANGULAR:
            self._length = well_props['xDimension']
            self._width = well_props['yDimension']
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
        return self._parent  # type: ignore

    @property
    def has_tip(self) -> bool:
        return self._has_tip

    @has_tip.setter
    def has_tip(self, value: bool):
        self._has_tip = value

    def top(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 top-center of the well relative to the deck (with the
                 front-left corner of slot 1 as (0,0,0)). If z is specified,
                 returns a point offset by z mm from top-center
        """
        return Location(self._position + Point(0, 0, z), self)

    def bottom(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 bottom-center of the well (with the front-left corner of
                 slot 1 as (0,0,0)). If z is specified, returns a point
                 offset by z mm from bottom-center
        """
        top = self.top()
        bottom_z = top.point.z - self._depth + z
        return Location(Point(x=top.point.x, y=top.point.y, z=bottom_z), self)

    def center(self) -> Location:
        """
        :return: a Point corresponding to the absolute position of the center
        of the well relative to the deck (with the front-left corner of slot 1
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
            the radius/length in the X axis
        :param y: a float in the range [-1.0, 1.0] for a percentage of half of
            the radius/width in the Y axis
        :param z: a float in the range [-1.0, 1.0] for a percentage of half of
            the height above/below the center

        :return: a Point representing the specified location in absolute deck
        coordinates
        """
        center = self.center()
        if self._shape is WellShape.RECTANGULAR:
            x_size = self._length
            y_size = self._width
        else:
            x_size = self._diameter
            y_size = self._diameter
        z_size = self._depth

        return Point(
            x=center.point.x + (x * (x_size / 2.0)),
            y=center.point.y + (y * (y_size / 2.0)),
            z=center.point.z + (z * (z_size / 2.0)))

    def __repr__(self):
        return self._display_name

    def __eq__(self, other: object) -> bool:
        """
        Assuming that equality of wells in this system is having the same
        absolute coordinates for the top.
        """
        if not isinstance(other, Well):
            return NotImplemented
        return self.top().point == other.top().point

    def __hash__(self):
        return hash(self.top().point)


class Labware:
    """
    This class represents a labware, such as a PCR plate, a tube rack, trough,
    tip rack, etc. It defines the physical geometry of the labware, and
    provides methods for accessing wells within the labware.
    """
    def __init__(
            self, definition: dict,
            parent: Location, label: str = None) -> None:
        """
        :param definition: A dict representing all required data for a labware,
                           including metadata such as the display name of the
                           labware, a definition of the order to iterate over
                           wells, the shape of wells (shape, physical
                           dimensions, etc), and so on. The correct shape of
                           this definition is handled by the "labware-designer"
                           project in the Opentrons/opentrons repo.
        :param parent: A :py:class:`.Location` representing the location where
                       the front and left most point of the outside of the
                       labware is (often the front-left corner of a slot on the
                       deck).
        :param str label: An optional label to use instead of the displayName
                          from the definition's metadata element
        """
        if label:
            dn = label
        else:
            dn = definition['metadata']['displayName']
        self._display_name = "{} on {}".format(dn, str(parent.labware))
        self._calibrated_offset: Point = Point(0, 0, 0)
        self._wells: List[Well] = []
        # Directly from definition
        self._well_definition = definition['wells']
        self._parameters = definition['parameters']
        offset = definition['cornerOffsetFromSlot']
        self._dimensions = definition['dimensions']
        # Inferred from definition
        self._ordering = [well
                          for col in definition['ordering']
                          for well in col]
        self._offset\
            = Point(offset['x'], offset['y'], offset['z']) + parent.point
        self._parent = parent.labware
        # Applied properties
        self.set_calibration(self._calibrated_offset)

        self._pattern = re.compile(r'^([A-Z]+)([1-9][0-9]*)$', re.X)
        self._definition = definition

    @property
    def parent(self) -> Union['Labware', 'Well', str, 'ModuleGeometry', None]:
        """ The parent of this labware. Usually a slot name.
        """
        return self._parent

    @property
    def name(self) -> str:
        """ The canonical name of the labware, which is used to load it """
        return self._definition['parameters']['loadName']

    @property
    def parameters(self) -> dict:
        """Internal properties of a labware including type and quirks"""
        return self._parameters

    @property
    def quirks(self) -> List[str]:
        """ Quirks specific to this labware. """
        return self.parameters.get('quirks', [])

    @property
    def magdeck_engage_height(self) -> Optional[float]:
        if not self._parameters['isMagneticModuleCompatible']:
            return None
        else:
            return self._parameters['magneticModuleEngageHeight']

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
                "{} of {}".format(well, self._display_name),
                self.is_tiprack)
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
        keys = sorted(col_dict, key=lambda x: int(x))

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

    @property
    def highest_z(self) -> float:
        """
        The z-coordinate of the tallest single point anywhere on the labware.

        This is drawn from the 'dimensions'/'zDimension' elements of the
        labware definition and takes into account the calibration offset.
        """
        return self._dimensions['zDimension'] + self._calibrated_offset.z

    @property
    def is_tiprack(self) -> bool:
        return self._parameters['isTiprack']

    @property
    def tip_length(self) -> float:
        return self._parameters['tipLength'] - self._parameters['tipOverlap']

    @tip_length.setter
    def tip_length(self, length: float):
        self._parameters['tipLength'] = length + self._parameters['tipOverlap']

    def next_tip(self, num_tips: int = 1) -> Optional[Well]:
        """
        Find the next valid well for pick-up.

        Determines the next valid start tip from which to retrieve the
        specified number of tips. There must be at least `num_tips` sequential
        wells for which all wells have tips, in the same column.

        :param num_tips: target number of sequential tips in the same column
        :type num_tips: int
        :return: the :py:class:`.Well` meeting the target criteria, or None
        """
        assert num_tips > 0, 'Bad call to next_tip: num_tips <= 0'

        columns: List[List[Well]] = self.columns()
        drop_leading_empties = [
            list(dropwhile(lambda x: not x.has_tip, column))
            for column in columns]
        drop_at_first_gap = [
            list(takewhile(lambda x: x.has_tip, column))
            for column in drop_leading_empties]
        long_enough = [
            column for column in drop_at_first_gap if len(column) >= num_tips]

        try:
            first_long_enough = long_enough[0]
            result: Optional[Well] = first_long_enough[0]
        except IndexError:
            result = None

        return result

    def use_tips(self, start_well: Well, num_channels: int = 1):
        """
        Removes tips from the tip tracker.

        This method should be called when a tip is picked up. Generally, it
        will be called with `num_channels=1` or `num_channels=8` for single-
        and multi-channel respectively. If picking up with more than one
        channel, this method will automatically determine which tips are used
        based on the start well, the number of channels, and the geometry of
        the tiprack.

        :param start_well: The :py:class:`.Well` from which to pick up a tip.
                           For a single-channel pipette, this is the well to
                           send the pipette to. For a multi-channel pipette,
                           this is the well to send the back-most nozzle of the
                           pipette to.
        :type start_well: :py:class:`.Well`
        :param num_channels: The number of channels for the current pipette
        :type num_channels: int
        """
        assert num_channels > 0, 'Bad call to use_tips: num_channels<=0'
        # Select the column of the labware that contains the target well
        target_column: List[Well] = [
            col for col in self.columns() if start_well in col][0]

        well_idx = target_column.index(start_well)
        # Number of tips to pick up is the lesser of (1) the number of tips
        # from the starting well to the end of the column, and (2) the number
        # of channels of the pipette (so a 4-channel pipette would pick up a
        # max of 4 tips, and picking up from the 2nd-to-bottom well in a
        # column would get a maximum of 2 tips)
        num_tips = min(len(target_column) - well_idx, num_channels)
        target_wells = target_column[well_idx: well_idx + num_tips]

        assert all([well.has_tip for well in target_wells]),\
            '{} is out of tips'.format(str(self))

        for well in target_wells:
            well.has_tip = False

    def __repr__(self):
        return self._display_name

    def previous_tip(self, num_tips: int = 1) -> Optional[Well]:
        """
        Find the best well to drop a tip in.

        This is the well from which the last tip was picked up, if there's
        room. It can be used to return tips to the tip tracker.

        :param num_tips: target number of tips to return, sequential in a
                         column
        :type num_tips: int
        :return: The :py:class:`.Well` meeting the target criteria, or ``None``
        """
        # This logic is the inverse of :py:meth:`next_tip`
        assert num_tips > 0, 'Bad call to previous_tip: num_tips <= 0'

        columns = self.columns()
        drop_leading_filled = [
            list(dropwhile(lambda x: x.has_tip, column))
            for column in columns]
        drop_at_first_gap = [
            list(takewhile(lambda x: not x.has_tip, column))
            for column in drop_leading_filled]
        long_enough = [
            column for column in drop_at_first_gap if len(column) >= num_tips]
        try:
            return long_enough[0][0]
        except IndexError:
            return None

    def return_tips(self, start_well: Well, num_channels: int = 1):
        """
        Re-adds tips to the tip tracker

        This method should be called when a tip is dropped in a tiprack. It
        should be called with `num_channels=1` or `num_channels=8` for single-
        and multi-channel respectively. If returning more than one channel,
        this method will automatically determine which tips are returned based
        on the start well, the number of channels, and the tiprack geometry.

        Note that unlike :py:meth:`use_tips`, calling this method in a way
        that would drop tips into wells with tips in them will raise an
        exception; this should only be called on a valid return of
        :py:meth:`previous_tip`.

        :param start_well: The :py:class:`.Well` into which to return a tip.
        :type start_well: :py:class:`.Well`
        :param num_channels: The number of channels for the current pipette
        :type num_channels: int
        """
        # This logic is the inverse of :py:meth:`use_tips`
        assert num_channels > 0, 'Bad call to return_tips: num_channels <= 0'
        # Select the column that contains the target_well
        target_column = [col for col in self.columns() if start_well in col][0]
        well_idx = target_column.index(start_well)
        end_idx = min(well_idx + num_channels, len(target_column))
        drop_targets = target_column[well_idx:end_idx]
        for well in drop_targets:
            if well.has_tip:
                raise AssertionError(f'Well {repr(well)} has a tip')
        for well in drop_targets:
            well.has_tip = True


class ModuleGeometry:
    """
    This class represents an active peripheral, such as an Opentrons MagBead
    Module or Temperature Module. It defines the physical geometry of the
    device (primarily the offset that modifies the position of the labware
    mounted on top of it).
    """
    def __init__(self,
                 definition: dict,
                 parent: Location) -> None:
        """
        Create a Module for tracking the position of a module.

        Note that modules do not currently have a concept of calibration apart
        from calibration of labware on top of the module. The practical result
        of this is that if the module parent :py:class:`.Location` is
        incorrect, then acorrect calibration of one labware on the deck would
        be incorrect on the module, and vice-versa. Currently, the way around
        this would be to correct the :py:class:`.Location` so that the
        calibrated labware is targeted accurately in both positions.

        :param definition: A dict containing all the data required to define
                           the geometry of the module.
        :type definition: dict
        :param parent: A location representing location of the front left of
                       the outside of the module (usually the front-left corner
                       of a slot on the deck).
        :type parent: :py:class:`.Location`
        """
        self._parent = parent
        self._display_name = "{} on {}".format(definition["displayName"],
                                               str(parent.labware))
        self._load_name = definition["loadName"]
        self._offset = Point(definition["labwareOffset"]["x"],
                             definition["labwareOffset"]["y"],
                             definition["labwareOffset"]["z"])
        self._height = definition["dimensions"]["bareOverallHeight"]\
            + self._parent.point.z
        self._over_labware = definition["dimensions"]["overLabwareHeight"]
        self._labware: Optional[Labware] = None
        self._location = Location(
            point=self._offset + self._parent.point,
            labware=self)

    def add_labware(self, labware: Labware) -> Labware:
        assert not self._labware,\
            '{} is already on this module'.format(self._labware)
        self._labware = labware
        return self._labware

    def reset_labware(self):
        self._labware = None

    @property
    def load_name(self):
        return self._load_name

    @property
    def parent(self):
        return self._parent.labware

    @property
    def labware(self) -> Optional[Labware]:
        return self._labware

    @property
    def location(self) -> Location:
        """
        :return: a :py:class:`.Location` representing the top of the module
        """
        return self._location

    @property
    def highest_z(self) -> float:
        if self.labware:
            return self.labware.highest_z + self._over_labware
        else:
            return self._height

    def __repr__(self):
        return self._display_name


class ThermocyclerGeometry(ModuleGeometry):
    def __init__(self, definition: dict, parent: Location) -> None:
        super().__init__(definition, parent)
        self._lid_height = definition["dimensions"]["lidHeight"]
        self._lid_status = 'open'   # Needs to reflect true status

    @property
    def highest_z(self) -> float:
        if self.lid_status == 'closed':
            return super().highest_z + self._lid_height
        else:
            return super().highest_z

    @property
    def lid_status(self) -> str:
        return self._lid_status

    @lid_status.setter
    def lid_status(self, status) -> None:
        self._lid_status = status

    def labware_accessor(self, labware: Labware) -> Labware:
        # Block first three columns from being accessed
        definition = labware._definition
        definition['ordering'] = definition['ordering'][3::]
        return Labware(definition, super().location)

    def add_labware(self, labware: Labware) -> Labware:
        assert not self._labware,\
            '{} is already on this module'.format(self._labware)
        assert self.lid_status != 'closed', \
            'Cannot place labware in closed module'
        if self.load_name == 'semithermocycler':
            labware = self.labware_accessor(labware)
        self._labware = labware
        return self._labware


def _hash_labware_def(labware: Dict[str, Any]) -> str:
    # remove keys that do not affect run
    blacklist = ['metadata', 'brand', 'groups']
    def_no_metadata = {k: v for k, v in labware.items() if k not in blacklist}
    sorted_def_str = json.dumps(
        def_no_metadata, sort_keys=True, separators=(',', ':'))
    return sha256(sorted_def_str.encode('utf-8')).hexdigest()


def save_calibration(labware: Labware, delta: Point):
    """
    Function to be used whenever an updated delta is found for the first well
    of a given labware. If an offset file does not exist, create the file
    using labware id as the filename. If the file does exist, load it and
    modify the delta and the lastModified fields under the "default" key.
    """
    calibration_path = CONFIG['labware_calibration_offsets_dir_v4']
    if not calibration_path.exists():
        calibration_path.mkdir(parents=True, exist_ok=True)
    labware_hash = _hash_labware_def(labware._definition)
    labware_offset_path = calibration_path/'{}.json'.format(labware_hash)
    calibration_data = _helper_offset_data_format(
        str(labware_offset_path), delta)
    with labware_offset_path.open('w') as f:
        json.dump(calibration_data, f)
    labware.set_calibration(delta)


def save_tip_length(labware: Labware, length: float):
    """
    Function to be used whenever an updated tip length is found for
    of a given tip rack. If an offset file does not exist, create the file
    using labware id as the filename. If the file does exist, load it and
    modify the length and the lastModified fields under the "tipLength" key.
    """
    calibration_path = CONFIG['labware_calibration_offsets_dir_v4']
    if not calibration_path.exists():
        calibration_path.mkdir(parents=True, exist_ok=True)
    labware_hash = _hash_labware_def(labware._definition)
    labware_offset_path = calibration_path/'{}.json'.format(labware_hash)
    calibration_data = _helper_tip_length_data_format(
        str(labware_offset_path), length)
    with labware_offset_path.open('w') as f:
        json.dump(calibration_data, f)
    labware.tip_length = length


def load_calibration(labware: Labware):
    """
    Look up a calibration if it exists and apply it to the given labware.
    """
    calibration_path = CONFIG['labware_calibration_offsets_dir_v4']
    labware_hash = _hash_labware_def(labware._definition)
    labware_offset_path = calibration_path/'{}.json'.format(labware_hash)
    if labware_offset_path.exists():
        calibration_data = _read_file(str(labware_offset_path))
        offset_array = calibration_data['default']['offset']
        offset = Point(x=offset_array[0], y=offset_array[1], z=offset_array[2])
        labware.set_calibration(offset)
        if 'tipLength' in calibration_data.keys():
            tip_length = calibration_data['tipLength']['length']
            labware.tip_length = tip_length


def _helper_offset_data_format(filepath: str, delta: Point) -> dict:
    if not Path(filepath).is_file():
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


def _helper_tip_length_data_format(filepath: str, length: float) -> dict:
    try:
        calibration_data = _read_file(filepath)
    except FileNotFoundError:
        # This should generally not occur, as labware calibration has to happen
        # prior to tip length calibration
        calibration_data = {}

    calibration_data['tipLength'] = {
        'length': length,
        'lastModified': time.time()}

    return calibration_data


def _read_file(filepath: str) -> dict:
    with open(filepath, 'r') as f:
        calibration_data = json.load(f)
    return calibration_data


def _get_path_to_labware(load_name: str, namespace: str, version: int) -> Path:
    if namespace == OPENTRONS_NAMESPACE:
        # all labware in OPENTRONS_NAMESPACE is bundled in wheel
        return STANDARD_DEFS_PATH / load_name / f'{version}.json'

    base_path = CONFIG['labware_user_definitions_dir_v4']
    def_path = base_path / namespace / load_name / f'{version}.json'
    return def_path


def save_definition(
    labware_def: Dict[str, Any],
    force: bool = False
) -> None:
    """
    Save a labware definition

    :param labware_def: A deserialized JSON labware definition
    :param bool force: If true, overwrite an existing definition if found.
        Cannot overwrite Opentrons definitions.
    """
    namespace = labware_def['namespace']
    load_name = labware_def['parameters']['loadName']
    version = labware_def['version']

    # TODO: Ian 2019-05-23 validate labware def schema before saving

    if not namespace or not load_name or not version:
        raise RuntimeError(
            'Could not save definition, labware def is missing a field: ' +
            f'{namespace}, {load_name}, {version}')

    if namespace == OPENTRONS_NAMESPACE:
        raise RuntimeError(
            f'Saving definitions to the "{OPENTRONS_NAMESPACE}" namespace ' +
            'is not permitted')

    def_path = _get_path_to_labware(load_name, namespace, version)

    if not force and def_path.is_file():
        raise RuntimeError(
            f'The given definition ({namespace}/{load_name} v{version}) ' +
            'already exists. Cannot save definition without force=True')

    Path(def_path).parent.mkdir(parents=True, exist_ok=True)
    with open(def_path, 'w') as f:
        json.dump(labware_def, f)


def delete_all_custom_labware() -> None:
    custom_def_dir = CONFIG['labware_user_definitions_dir_v4']
    if custom_def_dir.is_dir():
        shutil.rmtree(custom_def_dir)


def get_labware_definition(
    load_name: str,
    namespace: str = None,
    version: int = 1
) -> Dict[str, Any]:
    """
    Look up and return a definition by load_name + namespace + version and
        return it or raise an exception

    :param str load_name: corresponds to 'loadName' key in definition
    :param str namespace: The namespace the labware definition belongs to.
        If unspecified, will search 'opentrons' then 'custom_beta'
    :param int version: The version of the labware definition. If unspecified,
        will use version 1.
    """
    load_name = load_name.lower()
    if namespace is None:
        for fallback_namespace in [OPENTRONS_NAMESPACE, CUSTOM_NAMESPACE]:
            try:
                return get_labware_definition(
                    load_name, fallback_namespace, version)
            except (FileNotFoundError):
                pass
        raise FileNotFoundError(
            f'Labware "{load_name}" not found with version {version}. If ' +
            f'you are using a namespace besides {OPENTRONS_NAMESPACE} or ' +
            f'{CUSTOM_NAMESPACE}, please specify it')

    namespace = namespace.lower()
    def_path = _get_path_to_labware(load_name, namespace, version)

    try:
        with open(def_path, 'r') as f:
            labware_def = json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(
            f'Labware "{load_name}" not found with version {version} ' +
            f'in namespace "{namespace}".'
        )

    return labware_def


def load(
    load_name: str,
    parent: Location,
    label: str = None,
    namespace: str = None,
    version: int = 1
) -> Labware:
    """
    Return a labware object constructed from a labware definition dict looked
    up by name (definition must have been previously stored locally on the
    robot)

    :param load_name: A string to use for looking up a labware definition
        previously saved to disc. The definition file must have been saved in a
        known location
    :param parent: A :py:class:`.Location` representing the location where
                   the front and left most point of the outside of labware is
                   (often the front-left corner of a slot on the deck).
    :param str label: An optional label that will override the labware's
                      display name from its definition
    :param str namespace: The namespace the labware definition belongs to.
        If unspecified, will search 'opentrons' then 'custom_beta'
    :param int version: The version of the labware definition. If unspecified,
        will use version 1.
    """
    definition = get_labware_definition(load_name, namespace, version)
    return load_from_definition(definition, parent, label)


def load_from_definition(
        definition: dict, parent: Location, label: str = None) -> Labware:
    """
    Return a labware object constructed from a provided labware definition dict

    :param definition: A dict representing all required data for a labware,
        including metadata such as the display name of the labware, a
        definition of the order to iterate over wells, the shape of wells
        (shape, physical dimensions, etc), and so on. The correct shape of
        this definition is governed by the "labware-designer" project in
        the Opentrons/opentrons repo.
    :param parent: A :py:class:`.Location` representing the location where
                   the front and left most point of the outside of labware is
                   (often the front-left corner of a slot on the deck).
    :param str label: An optional label that will override the labware's
                      display name from its definition
    """
    labware = Labware(definition, parent, label)
    load_calibration(labware)
    return labware


def clear_calibrations():
    """
    Delete all calibration files for labware. This includes deleting tip-length
    data for tipracks.
    """
    calibration_path = CONFIG['labware_calibration_offsets_dir_v4']
    try:
        targets = [
            f for f in calibration_path.iterdir() if f.suffix == '.json']
        for target in targets:
            target.unlink()
    except FileNotFoundError:
        pass


def load_module_from_definition(
        definition: dict, parent: Location) -> \
            Union[ModuleGeometry, ThermocyclerGeometry]:
    """
    Return a :py:class:`ModuleGeometry` object from a specified definition

    :param definition: A dict representing all required data for a module's
                       geometry.
    :param parent: A :py:class:`.Location` representing the location where
                   the front and left most point of the outside of the module
                   is (often the front-left corner of a slot on the deck).
    """
    mod_name = definition['loadName']
    if mod_name == 'thermocycler' or mod_name == 'semithermocycler':
        mod: Union[ModuleGeometry, ThermocyclerGeometry] = \
                ThermocyclerGeometry(definition, parent)
    else:
        mod = ModuleGeometry(definition, parent)
    # TODO: calibration
    return mod


def load_module(name: str, parent: Location) -> ModuleGeometry:
    """
    Return a :py:class:`ModuleGeometry` object from a definition looked up
    by name.

    :param name: A string to use for looking up the definition. The string
                 must be present as a top-level key in
                 module/definitions/{moduleDefinitionVersion}.json.
    :param parent: A :py:class:`.Location` representing the location where
                   the front and left most point of the outside of the module
                   is (often the front-left corner of a slot on the deck).
    """
    def_path = 'shared_data/module/definitions/1.json'
    module_def = json.loads(  # type: ignore
        pkgutil.get_data('opentrons', def_path))
    return load_module_from_definition(module_def[name], parent)


def quirks_from_any_parent(
        loc: Union[Labware, Well, str, ModuleGeometry, None]) -> List[str]:
    """ Walk the tree of wells and labwares and extract quirks """
    def recursive_get_quirks(obj, found):
        if isinstance(obj, Labware):
            return found + obj.quirks
        elif isinstance(obj, Well):
            return recursive_get_quirks(obj.parent, found)
        else:
            return found
    return recursive_get_quirks(loc, [])
