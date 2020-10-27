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
import os
import shutil

from pathlib import Path
from itertools import dropwhile
from typing import (
    Any, AnyStr, List, Dict,
    Optional, Union, Tuple,
    TYPE_CHECKING)

import jsonschema  # type: ignore

from opentrons.protocols.api_support.util import (
    ModifiedList, requires_version, labware_column_shift)
from opentrons.calibration_storage import get, helpers, modify
from opentrons.protocols.implementations.interfaces.labware import \
    AbstractLabwareImplementation
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocols.implementations.labware import LabwareImplementation
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.types import Location, Point, LocationLabware
from opentrons.protocols.api_support.types import APIVersion
from opentrons_shared_data import load_shared_data, get_shared_data_root
from opentrons.protocols.api_support.definitions import (
    MAX_SUPPORTED_VERSION)
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.api_support.constants import (
    OPENTRONS_NAMESPACE, CUSTOM_NAMESPACE, STANDARD_DEFS_PATH, USER_DEFS_PATH)
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
                 api_level: APIVersion):
        """
        Create a well, and track the Point corresponding to the top-center of
        the well (this Point is in absolute deck coordinates)

        """
        self._api_version = api_level
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
            implementation: AbstractLabwareImplementation,
            api_level: APIVersion = None) -> None:
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
        return self._implementation.get_geometry().parent.labware

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
                 starting_tip: Well = None) -> Optional[Well]:
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
        return id(self)

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
        starting_point: Well = None) -> Tuple[Labware, Well]:
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


def get_labware_hash(labware: 'Labware') -> str:
    return helpers.hash_labware_def(labware._implementation.get_definition())


def get_labware_hash_with_parent(labware: 'Labware') -> str:
    return helpers.hash_labware_def(
        labware._implementation.get_definition()
    ) + _get_parent_identifier(labware)


def _get_labware_path(labware: 'Labware') -> str:
    return f'{get_labware_hash_with_parent(labware)}.json'


def _get_index_file_information(
        labware: 'Labware') -> Tuple[str, 'LabwareDefinition', str]:
    definition = labware._implementation.get_definition()
    labware_path = _get_labware_path(labware)
    parent = _get_parent_identifier(labware)
    return labware_path, definition, parent


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
    labware = Labware(
        implementation=LabwareImplementation(
            definition=definition, parent=parent, label=label
        ),
        api_level=api_level
    )
    index_info = _get_index_file_information(labware)
    offset = get.get_labware_calibration(
        index_info[0], index_info[1], parent=index_info[2])
    labware.set_calibration(offset)
    return labware


def save_calibration(labware: 'Labware', delta: Point):
    index_info = _get_index_file_information(labware)
    modify.save_labware_calibration(
        index_info[0], index_info[1], delta, parent=index_info[2])
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
