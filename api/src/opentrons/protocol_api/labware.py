""" opentrons.protocol_api.labware: classes and functions for labware handling

This module provides things like :py:class:`Labware`, and :py:class:`Well`
to encapsulate labware instances used in protocols
and their wells. It also provides helper functions to load and save labware
and labware calibration offsets. It contains all the code necessary to
transform from labware symbolic points (such as "well a1 of an opentrons
tiprack") to points in deck coordinates.
"""
import logging
import json
import re
import os
import shutil

from pathlib import Path
from collections import defaultdict
from itertools import takewhile, dropwhile
from typing import (
    Any, AnyStr, List, Dict,
    Optional, Union, Sequence, Tuple,
    TYPE_CHECKING)

import jsonschema  # type: ignore

from .util import ModifiedList, requires_version
from opentrons.calibration_storage import get, helpers, modify
from opentrons.types import Location, Point
from opentrons.protocols.types import APIVersion
from opentrons_shared_data import load_shared_data, get_shared_data_root
from .definitions import MAX_SUPPORTED_VERSION, DeckItem
from .constants import (OPENTRONS_NAMESPACE, CUSTOM_NAMESPACE,
                        STANDARD_DEFS_PATH, USER_DEFS_PATH)
if TYPE_CHECKING:
    from .module_geometry import ModuleGeometry  # noqa(F401)
    from opentrons_shared_data.labware.dev_types import (
        LabwareDefinition, LabwareParameters, WellDefinition)


MODULE_LOG = logging.getLogger(__name__)


class OutOfTipsError(Exception):
    pass


class Well:
    """
    The Well class represents a  single well in a :py:class:`Labware`

    It provides functions to return positions used in operations on the well
    such as :py:meth:`top`, :py:meth:`bottom`
    """
    def __init__(self, well_props: 'WellDefinition',
                 parent: Location,
                 display_name: str,
                 has_tip: bool,
                 api_level: APIVersion) -> None:
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
        self._api_version = api_level
        self._display_name = display_name
        self._position\
            = Point(well_props['x'],
                    well_props['y'],
                    well_props['z'] + well_props['depth']) + parent.point

        if not parent.labware:
            raise ValueError("Wells must have a parent")
        self._parent = parent.labware
        self._has_tip = has_tip
        self._shape = well_props['shape']
        if well_props['shape'] == 'rectangular':
            self._length: Optional[float] = well_props['xDimension']
            self._width: Optional[float] = well_props['yDimension']
            self._diameter: Optional[float] = None
        elif well_props['shape'] == 'circular':
            self._length = None
            self._width = None
            self._diameter = well_props['diameter']
        else:
            raise ValueError(
                'Shape "{}" is not a supported well shape'.format(
                    well_props['shape']))
        self.max_volume = well_props['totalLiquidVolume']
        self._depth = well_props['depth']

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    @property  # type: ignore
    @requires_version(2, 0)
    def parent(self) -> 'Labware':
        return self._parent  # type: ignore

    @property  # type: ignore
    @requires_version(2, 0)
    def has_tip(self) -> bool:
        return self._has_tip

    @has_tip.setter
    def has_tip(self, value: bool):
        self._has_tip = value

    @property  # type: ignore
    @requires_version(2, 0)
    def diameter(self) -> Optional[float]:
        return self._diameter

    @property
    def display_name(self):
        return self._display_name

    @requires_version(2, 0)
    def top(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 top-center of the well relative to the deck (with the
                 front-left corner of slot 1 as (0,0,0)). If z is specified,
                 returns a point offset by z mm from top-center
        """
        return self._top(z)

    def _top(self, z: float = 0.0) -> Location:
        # fairly hacky workaround for inheritance issues with LegacyWell
        return Location(self._position + Point(0, 0, z), self)

    @requires_version(2, 0)
    def bottom(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 bottom-center of the well (with the front-left corner of
                 slot 1 as (0,0,0)). If z is specified, returns a point
                 offset by z mm from bottom-center
        """
        return self._bottom(z)

    def _bottom(self, z: float = 0.0) -> Location:
        # inheritance and version check workaround
        top = self._top()
        bottom_z = top.point.z - self._depth + z
        return Location(Point(x=top.point.x, y=top.point.y, z=bottom_z), self)

    @requires_version(2, 0)
    def center(self) -> Location:
        """
        :return: a Point corresponding to the absolute position of the center
                 of the well relative to the deck (with the front-left corner
                 of slot 1 as (0,0,0))
        """
        return self._center()

    def _center(self) -> Location:
        # fairly hacky workaround for inheritance issues with LegacyWell
        top = self._top()
        center_z = top.point.z - (self._depth / 2.0)
        return Location(Point(x=top.point.x, y=top.point.y, z=center_z), self)

    def _from_center_cartesian(
            self, x: float, y: float, z: float) -> Point:
        """
        Specifies an arbitrary point in deck coordinates based
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
        center = self._center()
        if self._shape == 'rectangular':
            x_size: float = self._length  # type: ignore
            y_size: float = self._width  # type: ignore
        else:
            x_size = self._diameter  # type: ignore
            y_size = self._diameter  # type: ignore
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


class Labware(DeckItem):
    """
    This class represents a labware, such as a PCR plate, a tube rack,
    reservoir, tip rack, etc. It defines the physical geometry of the labware,
    and provides methods for accessing wells within the labware.

    It is commonly created by calling :py:meth:`ProtocolContext.load_labware`.

    To access a labware's wells, you can use its well accessor methods:
    :py:meth:`wells_by_name`, :py:meth:`wells`, :py:meth:`columns`,
    :py:meth:`rows`, :py:meth:`rows_by_name`, and :py:meth:`columns_by_name`.
    You can also use an instance of a labware as a Python dictionary, accessing
    wells by their names. The following example shows how to use all of these
    methods to access well A1:

    .. code-block :: python

       labware = context.load_labware('corning_96_wellplate_360ul_flat', 1)
       labware['A1']
       labware.wells_by_name()['A1']
       labware.wells()[0]
       labware.rows()[0][0]
       labware.columns()[0][0]
       labware.rows_by_name()['A'][0]
       labware.columns_by_name()[0][0]

    """
    def __init__(
            self, definition: 'LabwareDefinition',
            parent: Location, label: str = None,
            api_level: APIVersion = None) -> None:
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
        :param APIVersion api_level: the API version to set for the instance.
                                     The :py:class:`.Labware` will
                                     conform to this level. If not specified,
                                     defaults to
                                     :py:attr:`.MAX_SUPPORTED_VERSION`.
        """
        if not api_level:
            api_level = MAX_SUPPORTED_VERSION
        if api_level > MAX_SUPPORTED_VERSION:
            raise RuntimeError(
                f'API version {api_level} is not supported by this '
                f'robot software. Please either reduce your requested API '
                f'version or update your robot.')
        self._api_version = api_level
        if label:
            dn = label
            self._name = dn
        else:
            dn = definition['metadata']['displayName']
            self._name = definition['parameters']['loadName']
        self._display_name = "{} on {}".format(dn, str(parent.labware))
        self._calibrated_offset: Point = Point(0, 0, 0)
        self._wells: Sequence[Well] = []
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
        self._highest_z = self._dimensions['zDimension']

    @property
    def separate_calibration(self) -> bool:
        return False

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    def __getitem__(self, key: str) -> Well:
        return self.wells_by_name()[key]

    @property  # type: ignore
    @requires_version(2, 0)
    def uri(self) -> str:
        """ A string fully identifying the labware.

        :returns: The uri, ``"namespace/loadname/version"``
        """
        return helpers.uri_from_definition(self._definition)

    @property  # type: ignore
    @requires_version(2, 0)
    def parent(self) -> Union['Labware', 'Well', str, 'ModuleGeometry', None]:
        """ The parent of this labware. Usually a slot name.
        """
        return self._parent

    @property  # type: ignore
    @requires_version(2, 0)
    def name(self) -> str:
        """ Can either be the canonical name of the labware, which is used to
        load it, or the label of the labware specified by a user. """
        return self._name

    @name.setter  # type: ignore
    def name(self, new_name):
        """ Set the labware name"""
        self._name = new_name

    @property  # type: ignore
    @requires_version(2, 0)
    def load_name(self) -> str:
        """ The API load name of the labware definition """
        return self._parameters['loadName']

    @property  # type: ignore
    @requires_version(2, 0)
    def parameters(self) -> 'LabwareParameters':
        """Internal properties of a labware including type and quirks"""
        return self._parameters

    @property  # type: ignore
    @requires_version(2, 0)
    def quirks(self) -> List[str]:
        """ Quirks specific to this labware. """
        return self.parameters.get('quirks', [])

    @property  # type: ignore
    @requires_version(2, 0)
    def magdeck_engage_height(self) -> Optional[float]:
        if not self._parameters['isMagneticModuleCompatible']:
            return None
        else:
            return self._parameters['magneticModuleEngageHeight']

    def _build_wells(self) -> Sequence[Well]:
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
                self._is_tiprack,
                self._api_version)
            for well in self._ordering]

    def _create_indexed_dictionary(self, group=0) -> Dict[str, List['Well']]:
        """
        Creates a dict of lists of Wells. Which way the labware is segmented
        determines whether this is a dict of rows or dict of columns. If group
        is 1, then it will collect wells that have the same alphabetic prefix
        and therefore are considered to be in the same row. If group is 2, it
        will collect wells that have the same numeric postfix and therefore
        are considered to be in the same column.
        """
        dict_list: Dict[str, List['Well']] = defaultdict(list)
        for index, well_obj in zip(self._ordering, self._wells):
            match = self._pattern.match(index)
            assert match, 'could not match well name pattern'
            dict_list[match.group(group)].append(well_obj)
        # copy to a non-default-dict
        return {k: v for k, v in dict_list.items()}

    def set_calibration(self, delta: Point):
        """
        Called by save calibration in order to update the offset on the object.
        """
        self._calibrated_offset = Point(x=self._offset.x + delta.x,
                                        y=self._offset.y + delta.y,
                                        z=self._offset.z + delta.z)
        self._wells = self._build_wells()

    @property  # type: ignore
    @requires_version(2, 0)
    def calibrated_offset(self) -> Point:
        return self._calibrated_offset

    @requires_version(2, 0)
    def well(self, idx) -> Well:
        """Deprecated---use result of `wells` or `wells_by_name`"""
        if isinstance(idx, int):
            res = self._wells[idx]
        elif isinstance(idx, str):
            res = self.wells_by_name()[idx]
        else:
            res = NotImplemented
        return res

    @requires_version(2, 0)
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
            res = [self.wells_by_name()[idx] for idx in args]
        else:
            raise TypeError
        return list(res)

    @requires_version(2, 0)
    def wells_by_name(self) -> Dict[str, Well]:
        """
        Accessor function used to create a look-up table of Wells by name.

        With indexing one can treat it as a typical python
        dictionary whose keys are well names. To access well A1, for example,
        simply write: labware.wells_by_name()['A1']

        :return: Dictionary of well objects keyed by well name
        """
        return {well: wellObj
                for well, wellObj in zip(self._ordering, self._wells)}

    @requires_version(2, 0)
    def wells_by_index(self) -> Dict[str, Well]:
        MODULE_LOG.warning(
            'wells_by_index is deprecated and will be deleted in version '
            '3.12.0. please wells_by_name or dict access')
        return self.wells_by_name()

    @requires_version(2, 0)
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

    @requires_version(2, 0)
    def rows_by_name(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by row name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example, simply write: labware.rows_by_name()['A']
        This will output ['A1', 'A2', 'A3', 'A4'...].

        :return: Dictionary of Well lists keyed by row name
        """
        row_dict = self._create_indexed_dictionary(group=1)
        return row_dict

    @requires_version(2, 0)
    def rows_by_index(self) -> Dict[str, List[Well]]:
        MODULE_LOG.warning(
            'rows_by_index is deprecated and will be deleted in version '
            '3.12.0. please use rows_by_name')
        return self.rows_by_name()

    @requires_version(2, 0)
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

    @requires_version(2, 0)
    def columns_by_name(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by column name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example,
        simply write: labware.columns_by_name()['1']
        This will output ['A1', 'B1', 'C1', 'D1'...].

        :return: Dictionary of Well lists keyed by column name
        """
        col_dict = self._create_indexed_dictionary(group=2)
        return col_dict

    @requires_version(2, 0)
    def columns_by_index(self) -> Dict[str, List[Well]]:
        MODULE_LOG.warning(
            'columns_by_index is deprecated and will be deleted in version '
            '3.12.0. please use columns_by_name')
        return self.columns_by_name()

    @property  # type: ignore
    @requires_version(2, 0)
    def highest_z(self) -> float:
        """
        The z-coordinate of the tallest single point anywhere on the labware.

        This is drawn from the 'dimensions'/'zDimension' elements of the
        labware definition and takes into account the calibration offset.
        """
        return self._highest_z + self._calibrated_offset.z

    @highest_z.setter
    def highest_z(self, new_height: float):
        """
        The z-coordinate of the tallest single point anywhere on the labware.
        This is drawn from the 'dimensions'/'zDimension' elements of the
        labware definition and takes into account the calibration offset.
        """
        self._highest_z = new_height

    @property
    def _is_tiprack(self) -> bool:
        """ as is_tiprack but not subject to version checking for speed """
        return self._parameters['isTiprack']

    @property  # type: ignore
    @requires_version(2, 0)
    def is_tiprack(self) -> bool:
        return self._is_tiprack

    @property  # type: ignore
    @requires_version(2, 0)
    def tip_length(self) -> float:
        return self._parameters['tipLength']

    @tip_length.setter
    def tip_length(self, length: float):
        self._parameters['tipLength'] = length

    def next_tip(self,
                 num_tips: int = 1,
                 starting_tip: Well = None) -> Optional[Well]:
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

        if starting_tip:
            # Remove columns preceding the one with the pipette's starting tip
            drop_undefined_columns = list(
                dropwhile(lambda x: starting_tip not in x, columns))
            # Remove tips preceding the starting tip in the first column
            drop_undefined_columns[0] = list(
                dropwhile(lambda w: starting_tip is not w,
                          drop_undefined_columns[0]))
            columns = drop_undefined_columns

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

        # In API version 2.2, we no longer reset the tip tracker when a tip
        # is dropped back into a tiprack well. This fixes a behavior where
        # subsequent transfers would reuse the dirty tip. However, sometimes
        # the user explicitly wants to use a dirty tip, and this check would
        # raise an exception if they tried to do so.
        # An extension of work here is to have separate tip trackers for
        # dirty tips and non-present tips; but until then, we can avoid the
        # exception.
        if self._api_version < APIVersion(2, 2):
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
        should be called with ``num_channels=1`` or ``num_channels=8`` for
        single- and multi-channel respectively. If returning more than one
        channel, this method will automatically determine which tips are
        returned based on the start well, the number of channels,
        and the tiprack geometry.

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

    @requires_version(2, 0)
    def reset(self):
        """Reset all tips in a tiprack
        """
        if self._is_tiprack:
            for well in self.wells():
                well.has_tip = True


def _get_path_to_labware(
        load_name: str, namespace: str, version: int, base_path: Path = None
        ) -> Path:
    if namespace == OPENTRONS_NAMESPACE:
        # all labware in OPENTRONS_NAMESPACE is stored in shared data
        return get_shared_data_root() / STANDARD_DEFS_PATH \
               / load_name / f'{version}.json'
    if not base_path:
        base_path = USER_DEFS_PATH
    def_path = base_path / namespace / load_name / f'{version}.json'
    return def_path


def save_definition(
    labware_def: 'LabwareDefinition',
    force: bool = False,
    location: Path = None
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

    verify_definition(labware_def)

    if not namespace or not load_name or not version:
        raise RuntimeError(
            'Could not save definition, labware def is missing a field: ' +
            f'{namespace}, {load_name}, {version}')

    if namespace == OPENTRONS_NAMESPACE:
        raise RuntimeError(
            f'Saving definitions to the "{OPENTRONS_NAMESPACE}" namespace ' +
            'is not permitted')

    def_path = _get_path_to_labware(load_name, namespace, version, location)

    if not force and def_path.is_file():
        raise RuntimeError(
            f'The given definition ({namespace}/{load_name} v{version}) ' +
            'already exists. Cannot save definition without force=True')

    Path(def_path).parent.mkdir(parents=True, exist_ok=True)
    with open(def_path, 'w') as f:
        json.dump(labware_def, f)


def delete_all_custom_labware() -> None:
    if USER_DEFS_PATH.is_dir():
        shutil.rmtree(USER_DEFS_PATH)


def _get_labware_definition_from_bundle(
    bundled_labware: Dict[str, 'LabwareDefinition'],
    load_name: str,
    namespace: str = None,
    version: int = None,
) -> 'LabwareDefinition':
    """
    Look up and return a bundled definition by ``load_name`` + ``namespace``
    + ``version`` and return it or raise an exception. The``namespace`` and
    ``version`` args are optional, they only have to be specified if there is
    ambiguity (eg when multiple labware in the bundle share the same
    ``load_name``)

    :param str load_name: corresponds to 'loadName' key in definition
    :param str namespace: The namespace the labware definition belongs to
    :param int version: The version of the labware definition
    :param Dict bundled_labware: A dictionary of labware definitions to search
    """
    load_name = load_name.lower()

    bundled_candidates = [
        b for b in bundled_labware.values()
        if b['parameters']['loadName'] == load_name]
    if namespace:
        namespace = namespace.lower()
        bundled_candidates = [
            b for b in bundled_candidates if b['namespace'] == namespace]
    if version:
        bundled_candidates = [
            b for b in bundled_candidates if b['version'] == version]

    if len(bundled_candidates) == 1:
        return bundled_candidates[0]
    elif len(bundled_candidates) > 1:
        raise RuntimeError(
            f'Ambiguous labware access. Bundle contains multiple '
            f'labware with load name {load_name}, '
            f'namespace {namespace}, and version {version}.')
    else:
        raise RuntimeError(
            f'No labware found in bundle with load name {load_name}, '
            f'namespace {namespace}, and version {version}.')


def _get_standard_labware_definition(
        load_name: str, namespace: str = None, version: int = None)\
        -> 'LabwareDefinition':

    if version is None:
        checked_version = 1
    else:
        checked_version = version
    error_msg_string = """Unable to find a labware
        definition for "{0}",
        version {1}, in the {2} namespace.
        Please confirm your protocol includes the correct
        labware spelling and (optionally) the correct version
        number and namespace.

        If you are referencing a custom labware in your
        protocol, you must add it to your Custom Labware
        Definitions Folder from the Opentrons App before
        uploading your protocol.
        """

    if namespace is None:
        for fallback_namespace in [OPENTRONS_NAMESPACE, CUSTOM_NAMESPACE]:
            try:
                return _get_standard_labware_definition(
                    load_name, fallback_namespace, checked_version)
            except (FileNotFoundError):
                pass

        raise FileNotFoundError(error_msg_string.format(
                load_name, checked_version, OPENTRONS_NAMESPACE))

    namespace = namespace.lower()
    def_path = _get_path_to_labware(load_name, namespace, checked_version)

    try:
        with open(def_path, 'rb') as f:
            labware_def = json.loads(f.read().decode('utf-8'))
    except FileNotFoundError:
        raise FileNotFoundError(
            f'Labware "{load_name}" not found with version {checked_version} '
            f'in namespace "{namespace}".'
        )

    return labware_def


def verify_definition(contents: Union[
        AnyStr, 'LabwareDefinition', Dict[str, Any]])\
        -> 'LabwareDefinition':
    """ Verify that an input string is a labware definition and return it.

    If the definition is invalid, an exception is raised; otherwise parse the
    json and return the valid definition.

    :raises json.JsonDecodeError: If the definition is not valid json
    :raises jsonschema.ValidationError: If the definition is not valid.
    :returns: The parsed definition
    """
    schema_body = load_shared_data('labware/schemas/2.json').decode('utf-8')
    labware_schema_v2 = json.loads(schema_body)

    if isinstance(contents, dict):
        to_return = contents
    else:
        to_return = json.loads(contents)
    jsonschema.validate(to_return, labware_schema_v2)
    # we can type ignore this because if it passes the jsonschema it has
    # the correct structure
    return to_return  # type: ignore


def get_labware_definition(
    load_name: str,
    namespace: str = None,
    version: int = None,
    bundled_defs: Dict[str, 'LabwareDefinition'] = None,
    extra_defs: Dict[str, 'LabwareDefinition'] = None
) -> 'LabwareDefinition':
    """
    Look up and return a definition by load_name + namespace + version and
        return it or raise an exception

    :param str load_name: corresponds to 'loadName' key in definition
    :param str namespace: The namespace the labware definition belongs to.
        If unspecified, will search 'opentrons' then 'custom_beta'
    :param int version: The version of the labware definition. If unspecified,
        will use version 1.
    :param bundled_defs: A bundle of labware definitions to exlusively use for
        finding labware definitions, if specified
    :param extra_defs: An extra set of definitions (in addition to the system
        definitions) in which to search
    """
    load_name = load_name.lower()

    if bundled_defs is not None:
        return _get_labware_definition_from_bundle(
            bundled_defs, load_name, namespace, version)

    checked_extras = extra_defs or {}

    try:
        return _get_labware_definition_from_bundle(
            checked_extras, load_name, namespace, version)
    except (FileNotFoundError, RuntimeError):
        pass

    return _get_standard_labware_definition(
        load_name, namespace, version)


def get_all_labware_definitions() -> List[str]:
    """
    Return a list of standard and custom labware definitions with load_name +
        name_space + version existing on the robot
    """
    labware_list = ModifiedList()

    def _check_for_subdirectories(path):
        with os.scandir(path) as top_path:
            for sub_dir in top_path:
                if sub_dir.is_dir():
                    labware_list.append(sub_dir.name)

    # check for standard labware
    _check_for_subdirectories(get_shared_data_root() / STANDARD_DEFS_PATH)

    # check for custom labware
    for namespace in os.scandir(USER_DEFS_PATH):
        _check_for_subdirectories(namespace)

    return labware_list


def quirks_from_any_parent(
        loc: Union[Labware, Well, str, 'ModuleGeometry', None]) -> List[str]:
    """ Walk the tree of wells and labwares and extract quirks """
    def recursive_get_quirks(obj, found):
        if isinstance(obj, Labware):
            return found + obj.quirks
        elif isinstance(obj, Well):
            return recursive_get_quirks(obj.parent, found)
        else:
            return found
    return recursive_get_quirks(loc, [])


def split_tipracks(tip_racks: List[Labware]) -> Tuple[Labware, List[Labware]]:
    try:
        rest = tip_racks[1:]
    except IndexError:
        rest = []
    return tip_racks[0], rest


def select_tiprack_from_list(
        tip_racks: List[Labware],
        num_channels: int,
        starting_point: Well = None) -> Tuple[Labware, Well]:

    try:
        first, rest = split_tipracks(tip_racks)
    except IndexError:
        raise OutOfTipsError

    if starting_point:
        assert starting_point.parent is first
    else:
        starting_point = first.wells()[0]

    next_tip = first.next_tip(num_channels, starting_point)
    if next_tip:
        return first, next_tip
    else:
        return select_tiprack_from_list(rest, num_channels)


def filter_tipracks_to_start(
        starting_point: Well,
        tipracks: List[Labware]) -> List[Labware]:
    return list(dropwhile(
        lambda tr: starting_point.parent is not tr, tipracks))


def _get_parent_identifier(labware: 'Labware') -> str:
    """
    Helper function to return whether a labware is on top of a
    module or not.
    """
    parent = labware.parent
    # TODO (lc, 07-14-2020): Once we implement calibrations per slot,
    # this function should either return a slot using `first_parent` or
    # the module it is attached to.
    if isinstance(parent, DeckItem) and parent.separate_calibration:
        # treat a given labware on a given module type as same
        return parent.load_name
    else:
        return ''  # treat all slots as same


def get_labware_hash(labware: 'Labware'):
    return helpers.hash_labware_def(labware._definition)


def _get_labware_path(labware: 'Labware'):
    return f'{get_labware_hash(labware)}{_get_parent_identifier(labware)}.json'


def load_from_definition(
        definition: 'LabwareDefinition',
        parent: Location,
        label: str = None,
        api_level: APIVersion = None) -> Labware:
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
    :param APIVersion api_level: the API version to set for the loaded labware
                                 instance. The :py:class:`.Labware` will
                                 conform to this level. If not specified,
                                 defaults to :py:attr:`.MAX_SUPPORTED_VERSION`.
    """
    labware = Labware(definition, parent, label, api_level)
    lookup_path = _get_labware_path(labware)
    offset = get.get_labware_calibration(lookup_path)
    labware.set_calibration(offset)
    return labware


def save_calibration(labware: 'Labware', delta: Point):
    definition = labware._definition
    labware_path = _get_labware_path(labware)
    parent = _get_parent_identifier(labware)
    modify.save_labware_calibration(
        labware_path, definition, delta, parent=parent)
    labware.set_calibration(delta)


def load(
    load_name: str,
    parent: Location,
    label: str = None,
    namespace: str = None,
    version: int = 1,
    bundled_defs: Dict[str, 'LabwareDefinition'] = None,
    extra_defs: Dict[str, 'LabwareDefinition'] = None,
    api_level: APIVersion = None
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
    :param bundled_defs: If specified, a mapping of labware names to labware
        definitions. Only the bundle will be searched for definitions.
    :param extra_defs: If specified, a mapping of labware names to labware
        definitions. If no bundle is passed, these definitions will also be
        searched.
    :param APIVersion api_level: the API version to set for the loaded labware
                                 instance. The :py:class:`.Labware` will
                                 conform to this level. If not specified,
                                 defaults to :py:attr:`.MAX_SUPPORTED_VERSION`.
    """
    definition = get_labware_definition(
        load_name, namespace, version,
        bundled_defs=bundled_defs,
        extra_defs=extra_defs)
    return load_from_definition(definition, parent, label, api_level)
