""" opentrons.protocol_api.labware: classes and functions for labware handling

This module provides things like :py:class:`Labware`, and :py:class:`Well`
to encapsulate labware instances used in protocols
and their wells. It also provides helper functions to load and save labware
and labware calibration offsets. It contains all the code necessary to
transform from labware symbolic points (such as "well a1 of an opentrons
tiprack") to points in deck coordinates.
"""
import logging

from pathlib import Path
from itertools import dropwhile
from typing import (
    Any, AnyStr, List, Dict,
    Optional, Union, Tuple,
    TYPE_CHECKING)


from opentrons.protocols.api_support.util import (
    requires_version, labware_column_shift)
from opentrons.protocols.implementations.interfaces.labware import \
    LabwareInterface
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocols import labware as labware_module
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.types import Location, Point, LocationLabware
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.definitions import (
    MAX_SUPPORTED_VERSION)
from opentrons.protocols.geometry.deck_item import DeckItem
if TYPE_CHECKING:
    from opentrons.protocols.geometry.module_geometry import ModuleGeometry  # noqa(F401)
    from opentrons_shared_data.labware.dev_types import (
        LabwareDefinition, LabwareParameters)


MODULE_LOG = logging.getLogger(__name__)


class TipSelectionError(Exception):
    pass


class OutOfTipsError(Exception):
    pass


class Well:
    """
    The Well class represents a  single well in a :py:class:`Labware`

    It provides functions to return positions used in operations on the well
    such as :py:meth:`top`, :py:meth:`bottom`
    """
    def __init__(self,
                 well_implementation: WellImplementation,
                 api_level: Optional[APIVersion] = None):
        """
        Create a well, and track the Point corresponding to the top-center of
        the well (this Point is in absolute deck coordinates)

        """
        self._api_version = api_level or MAX_SUPPORTED_VERSION
        self._impl = well_implementation
        self._geometry = well_implementation.get_geometry()

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    @property  # type: ignore
    @requires_version(2, 0)
    def parent(self) -> 'Labware':
        return Labware(implementation=self._geometry.parent,
                       api_level=self.api_version)

    @property  # type: ignore
    @requires_version(2, 0)
    def has_tip(self) -> bool:
        return self._impl.has_tip()

    @has_tip.setter
    def has_tip(self, value: bool):
        self._impl.set_has_tip(value)

    @property
    def max_volume(self) -> float:
        return self._geometry.max_volume

    @property
    def geometry(self) -> WellGeometry:
        return self._geometry

    @property  # type: ignore
    @requires_version(2, 0)
    def diameter(self) -> Optional[float]:
        return self._geometry.diameter

    @property  # type: ignore
    @requires_version(2, 9)
    def length(self) -> Optional[float]:
        """
        The length of a well, if the labware has
        square wells.
        """
        return self._geometry._length

    @property  # type: ignore
    @requires_version(2, 9)
    def width(self) -> Optional[float]:
        """
        The width of a well, if the labware has
        square wells.
        """
        return self._geometry._width

    @property  # type: ignore
    @requires_version(2, 9)
    def depth(self) -> float:
        """
        The depth of a well in a labware.
        """
        return self._geometry._depth

    @property
    def display_name(self):
        return self._impl.get_display_name()

    @property  # type: ignore
    @requires_version(2, 7)
    def well_name(self) -> str:
        return self._impl.get_name()

    @requires_version(2, 0)
    def top(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 top-center of the well relative to the deck (with the
                 front-left corner of slot 1 as (0,0,0)). If z is specified,
                 returns a point offset by z mm from top-center
        """
        return Location(self._geometry.top(z), self)

    @requires_version(2, 0)
    def bottom(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 bottom-center of the well (with the front-left corner of
                 slot 1 as (0,0,0)). If z is specified, returns a point
                 offset by z mm from bottom-center
        """
        return Location(self._geometry.bottom(z), self)

    @requires_version(2, 0)
    def center(self) -> Location:
        """
        :return: a Point corresponding to the absolute position of the center
                 of the well relative to the deck (with the front-left corner
                 of slot 1 as (0,0,0))
        """
        return Location(self._geometry.center(), self)

    @requires_version(2, 8)
    def from_center_cartesian(self, x: float, y: float, z: float) -> Point:
        """
        Specifies an arbitrary point in deck coordinates based
        on percentages of the radius in each axis. For example, to specify the
        back-right corner of a well at 1/4 of the well depth from the bottom,
        the call would be `from_center_cartesian(1, 1, -0.5)`.

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
        return self._geometry.from_center_cartesian(x, y, z)

    def _from_center_cartesian(self, x: float, y: float, z: float) -> Point:
        """
        Private version of from_center_cartesian. Present only for backward
        compatibility.
        """
        MODULE_LOG.warning("This method is deprecated. Please use "
                           "'from_center_cartesian' instead.")
        return self.from_center_cartesian(x, y, z)

    def __repr__(self):
        return self._impl.get_display_name()

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
            self,
            implementation: LabwareInterface,
            api_level: Optional[APIVersion] = None) -> None:
        """
        :param implementation: The class that implements the public interface
                               of the class.
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
        self._implementation = implementation

    @property
    def separate_calibration(self) -> bool:
        return self._implementation.separate_calibration

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
        return self._implementation.get_uri()

    @property  # type: ignore
    @requires_version(2, 0)
    def parent(self) -> LocationLabware:
        """ The parent of this labware. Usually a slot name.
        """
        return self._implementation.get_geometry().parent.labware.object

    @property  # type: ignore
    @requires_version(2, 0)
    def name(self) -> str:
        """ Can either be the canonical name of the labware, which is used to
        load it, or the label of the labware specified by a user. """
        return self._implementation.get_name()

    @name.setter  # type: ignore
    def name(self, new_name):
        """ Set the labware name"""
        self._implementation.set_name(new_name)

    @property  # type: ignore
    @requires_version(2, 0)
    def load_name(self) -> str:
        """ The API load name of the labware definition """
        return self._implementation.load_name

    @property  # type: ignore
    @requires_version(2, 0)
    def parameters(self) -> 'LabwareParameters':
        """Internal properties of a labware including type and quirks"""
        return self._implementation.get_parameters()

    @property  # type: ignore
    @requires_version(2, 0)
    def quirks(self) -> List[str]:
        """ Quirks specific to this labware. """
        return self._implementation.get_quirks()

    @property  # type: ignore
    @requires_version(2, 0)
    def magdeck_engage_height(self) -> Optional[float]:
        p = self._implementation.get_parameters()
        if not p['isMagneticModuleCompatible']:
            return None
        else:
            return p['magneticModuleEngageHeight']

    def set_calibration(self, delta: Point):
        """
        Called by save calibration in order to update the offset on the object.
        """
        self._implementation.set_calibration(delta)

    @property  # type: ignore
    @requires_version(2, 0)
    def calibrated_offset(self) -> Point:
        return self._implementation.get_calibrated_offset()

    @requires_version(2, 0)
    def well(self, idx) -> Well:
        """Deprecated---use result of `wells` or `wells_by_name`"""
        if isinstance(idx, int):
            res = self._implementation.get_wells()[idx]
        elif isinstance(idx, str):
            res = self._implementation.get_wells_by_name()[idx]
        else:
            res = NotImplemented
        return self._well_from_impl(res)

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
            res = self._implementation.get_wells()
        elif isinstance(args[0], int):
            res = [self._implementation.get_wells()[idx] for idx in args]
        elif isinstance(args[0], str):
            by_name = self._implementation.get_wells_by_name()
            res = [by_name[idx] for idx in args]
        else:
            raise TypeError
        return [self._well_from_impl(w) for w in res]

    @requires_version(2, 0)
    def wells_by_name(self) -> Dict[str, Well]:
        """
        Accessor function used to create a look-up table of Wells by name.

        With indexing one can treat it as a typical python
        dictionary whose keys are well names. To access well A1, for example,
        simply write: labware.wells_by_name()['A1']

        :return: Dictionary of well objects keyed by well name
        """
        wells = self._implementation.get_wells_by_name()
        return {
            k: self._well_from_impl(v)
            for k, v in wells.items()
        }

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
        grid = self._implementation.get_well_grid()
        if not args:
            res = grid.get_rows()
        elif isinstance(args[0], int):
            res = [grid.get_rows()[idx] for idx in args]
        elif isinstance(args[0], str):
            res = [grid.get_row(idx) for idx in args]
        else:
            raise TypeError
        return [[self._well_from_impl(w) for w in row] for row in res]

    @requires_version(2, 0)
    def rows_by_name(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by row name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example, simply write: labware.rows_by_name()['A']
        This will output ['A1', 'A2', 'A3', 'A4'...].

        :return: Dictionary of Well lists keyed by row name
        """
        row_dict = self._implementation.get_well_grid().get_row_dict()
        return {
            k: [
                self._well_from_impl(w) for w in v
            ] for k, v in row_dict.items()
        }

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
        grid = self._implementation.get_well_grid()
        if not args:
            res = grid.get_columns()
        elif isinstance(args[0], int):
            res = [grid.get_columns()[idx] for idx in args]
        elif isinstance(args[0], str):
            res = [grid.get_column(idx) for idx in args]
        else:
            raise TypeError
        return [[self._well_from_impl(w) for w in col] for col in res]

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
        column_dict = self._implementation.get_well_grid().get_column_dict()
        return {
            k: [
                self._well_from_impl(w) for w in v
            ] for k, v in column_dict.items()
        }

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
        return self._implementation.highest_z

    @property
    def _is_tiprack(self) -> bool:
        """ as is_tiprack but not subject to version checking for speed """
        return self._implementation.is_tiprack()

    @property  # type: ignore
    @requires_version(2, 0)
    def is_tiprack(self) -> bool:
        return self._is_tiprack

    @property  # type: ignore
    @requires_version(2, 0)
    def tip_length(self) -> float:
        return self._implementation.get_tip_length()

    @tip_length.setter
    def tip_length(self, length: float):
        self._implementation.set_tip_length(length)

    def next_tip(self,
                 num_tips: int = 1,
                 starting_tip: Optional[Well] = None) -> Optional[Well]:
        """
        Find the next valid well for pick-up.

        Determines the next valid start tip from which to retrieve the
        specified number of tips. There must be at least `num_tips` sequential
        wells for which all wells have tips, in the same column.

        :param num_tips: target number of sequential tips in the same column
        :type num_tips: int
        :param starting_tip: The :py:class:`.Well` from which to start search.
                for an available tip.
        :type starting_tip: :py:class:`.Well`
        :return: the :py:class:`.Well` meeting the target criteria, or None
        """
        assert num_tips > 0, 'Bad call to next_tip: num_tips <= 0'

        well = self._implementation.get_tip_tracker().next_tip(
            num_tips=num_tips,
            starting_tip=starting_tip._impl if starting_tip else None
        )
        return self._well_from_impl(well) if well else None

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

        fail_if_full = self._api_version < APIVersion(2, 2)

        self._implementation.get_tip_tracker().use_tips(
            start_well=start_well._impl,
            num_channels=num_channels,
            fail_if_full=fail_if_full
        )

    def __repr__(self):
        return self._implementation.get_display_name()

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Labware):
            return NotImplemented
        return self._implementation == other._implementation

    def __hash__(self):
        return hash((self._implementation, self._api_version))

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

        well = self._implementation.get_tip_tracker().previous_tip(
            num_tips=num_tips
        )
        return self._well_from_impl(well) if well else None

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

        self._implementation.get_tip_tracker().return_tips(
            start_well=start_well._impl,
            num_channels=num_channels
        )

    @requires_version(2, 0)
    def reset(self):
        """Reset all tips in a tiprack
        """
        if self._is_tiprack:
            self._implementation.reset_tips()

    def _well_from_impl(self, well: WellImplementation) -> Well:
        return Well(well_implementation=well,
                    api_level=self._api_version)


def save_definition(
    labware_def: 'LabwareDefinition',
    force: bool = False,
    location: Optional[Path] = None
) -> None:
    """
    Save a labware definition

    :param labware_def: A deserialized JSON labware definition
    :param bool force: If true, overwrite an existing definition if found.
        Cannot overwrite Opentrons definitions.
    :param location: The path of the labware definition.
    """
    labware_module.save_definition(labware_def=labware_def,
                                   force=force,
                                   location=location)


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
    return labware_module.verify_definition(contents=contents)


def get_labware_definition(
    load_name: str,
    namespace: Optional[str] = None,
    version: Optional[int] = None,
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
    return labware_module.get_labware_definition(
        load_name=load_name,
        namespace=namespace,
        version=version,
        bundled_defs=bundled_defs,
        extra_defs=extra_defs
    )


def get_all_labware_definitions() -> List[str]:
    """
    Return a list of standard and custom labware definitions with load_name +
        name_space + version existing on the robot
    """
    return labware_module.get_all_labware_definitions()


def split_tipracks(tip_racks: List[Labware]) -> Tuple[Labware, List[Labware]]:
    try:
        rest = tip_racks[1:]
    except IndexError:
        rest = []
    return tip_racks[0], rest


def select_tiprack_from_list(
        tip_racks: List[Labware],
        num_channels: int,
        starting_point: Optional[Well] = None) -> Tuple[Labware, Well]:

    try:
        first, rest = split_tipracks(tip_racks)
    except IndexError:
        raise OutOfTipsError

    if starting_point and starting_point.parent != first:
        raise TipSelectionError(
            'The starting tip you selected '
            f'does not exist in {first}')
    elif starting_point:
        first_well = starting_point
    else:
        first_well = first.wells()[0]

    next_tip = first.next_tip(num_channels, first_well)
    if next_tip:
        return first, next_tip
    else:
        return select_tiprack_from_list(rest, num_channels)


def select_tiprack_from_list_paired_pipettes(
        tip_racks: List[Labware],
        p_channels: int,
        s_channels: int,
        starting_point: Optional[Well] = None) -> Tuple[Labware, Well]:
    """
    Helper function utilized in :py:attr:`PairedInstrumentContext`
    to determine which pipette tiprack to pick up from.

    If a starting point is specified, this method with check
    that the parent of that tip was correctly filtered.

    If a starting point is not specified, this method will filter
    tipracks until it finds a well that is not empty.

    :return: A Tuple of the tiprack and well to move to. In this
    instance the starting well is specific to the primary pipette.
    :raises TipSelectionError: if the starting tip specified
    does not exist in the filtered tipracks.
    """
    try:
        first, rest = split_tipracks(tip_racks)
    except IndexError:
        raise OutOfTipsError

    if starting_point and starting_point.parent != first:
        raise TipSelectionError(
            'The starting tip you selected '
            f'does not exist in {first}')
    elif starting_point:
        primary_well = starting_point
    else:
        primary_well = first.wells()[0]

    try:
        secondary_point = labware_column_shift(primary_well, first)
    except IndexError:
        return select_tiprack_from_list_paired_pipettes(
            rest, p_channels, s_channels)

    primary_next_tip = first.next_tip(p_channels, starting_point)
    secondary_next_tip = first.next_tip(s_channels, secondary_point)
    if primary_next_tip and secondary_next_tip:
        return first, primary_next_tip
    else:
        return select_tiprack_from_list_paired_pipettes(
            rest, p_channels, s_channels)


def filter_tipracks_to_start(
        starting_point: Well,
        tipracks: List[Labware]) -> List[Labware]:
    return list(dropwhile(
        lambda tr: starting_point.parent != tr, tipracks))


def next_available_tip(
        starting_tip: Optional[Well],
        tip_racks: List[Labware],
        channels: int) -> Tuple[Labware, Well]:
    start = starting_tip
    if start is None:
        return select_tiprack_from_list(
            tip_racks, channels)
    else:
        return select_tiprack_from_list(
            filter_tipracks_to_start(start, tip_racks),
            channels, start)


def get_labware_hash(labware: 'Labware') -> str:
    return labware_module.get_labware_hash(
        labware._implementation
    )


def get_labware_hash_with_parent(labware: 'Labware') -> str:
    return labware_module.get_labware_hash_with_parent(
        labware._implementation
    )


def load_from_definition(
        definition: 'LabwareDefinition',
        parent: Location,
        label: Optional[str] = None,
        api_level: Optional[APIVersion] = None) -> Labware:
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
    return Labware(
        implementation=labware_module.load_from_definition(
            definition=definition,
            parent=parent,
            label=label
        ),
        api_level=api_level
    )


def save_calibration(labware: 'Labware', delta: Point):
    labware_module.save_calibration(labware._implementation, delta)


def load(
    load_name: str,
    parent: Location,
    label: Optional[str] = None,
    namespace: Optional[str] = None,
    version: int = 1,
    bundled_defs: Optional[Dict[str, 'LabwareDefinition']] = None,
    extra_defs: Optional[Dict[str, 'LabwareDefinition']] = None,
    api_level: Optional[APIVersion] = None
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

    return Labware(
        implementation=labware_module.load(
            load_name=load_name,
            parent=parent,
            label=label,
            namespace=namespace,
            version=version,
            bundled_defs=bundled_defs,
            extra_defs=extra_defs
        ),
        api_level=api_level,
    )
