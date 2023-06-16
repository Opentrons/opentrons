""" opentrons.protocol_api.labware: classes and functions for labware handling

This module provides things like :py:class:`Labware`, and :py:class:`Well`
to encapsulate labware instances used in protocols
and their wells. It also provides helper functions to load and save labware
and labware calibration offsets. It contains all the code necessary to
transform from labware symbolic points (such as "well a1 of an opentrons
tiprack") to points in deck coordinates.
"""
from __future__ import annotations

import logging

from itertools import dropwhile
from typing import TYPE_CHECKING, Any, List, Dict, Optional, Union, Tuple, cast

from opentrons_shared_data.labware.dev_types import LabwareDefinition, LabwareParameters

from opentrons.types import Location, Point
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import requires_version, APIVersionError

# TODO(mc, 2022-09-02): re-exports provided for backwards compatibility
# remove when their usage is no longer needed
from opentrons.protocols.labware import (  # noqa: F401
    get_labware_definition as get_labware_definition,
    get_all_labware_definitions as get_all_labware_definitions,
    verify_definition as verify_definition,
    save_definition as save_definition,
)

from . import validation
from ._liquid import Liquid
from ._types import OffDeckType
from .core import well_grid
from .core.engine import ENGINE_CORE_API_VERSION
from .core.labware import AbstractLabware
from .core.module import AbstractModuleCore
from .core.core_map import LoadedCoreMap
from .core.legacy.legacy_labware_core import LegacyLabwareCore
from .core.legacy.legacy_well_core import LegacyWellCore
from .core.legacy.well_geometry import WellGeometry


if TYPE_CHECKING:
    from .core.common import LabwareCore, WellCore, ProtocolCore
    from .protocol_context import ModuleTypes


_log = logging.getLogger(__name__)


_IGNORE_API_VERSION_BREAKPOINT = APIVersion(2, 13)
"""API version after which to respect... the API version setting.

At this API version and below, `Labware` objects were always
erroneously constructed set to MAX_SUPPORTED_VERSION.
"""


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

    def __init__(self, parent: Labware, core: WellCore, api_version: APIVersion):
        if api_version <= _IGNORE_API_VERSION_BREAKPOINT:
            api_version = _IGNORE_API_VERSION_BREAKPOINT

        self._parent = parent
        self._core = core
        self._api_version = api_version

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def parent(self) -> Labware:
        return self._parent

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def has_tip(self) -> bool:
        """If parent labware is a tip rack, whether this well contains a tip."""
        return self._core.has_tip()

    @has_tip.setter
    def has_tip(self, value: bool) -> None:
        _log.warning(
            "Setting the `Well.has_tip` property manually has been deprecated"
            " and will raise an error in a future version of the Python Protocol API."
        )

        self._core.set_has_tip(value)

    @property
    def max_volume(self) -> float:
        return self._core.get_max_volume()

    @property
    def geometry(self) -> WellGeometry:
        if isinstance(self._core, LegacyWellCore):
            return self._core.geometry
        raise APIVersionError("Well.geometry has been deprecated.")

    @property  # type: ignore
    @requires_version(2, 0)
    def diameter(self) -> Optional[float]:
        return self._core.diameter

    @property  # type: ignore
    @requires_version(2, 9)
    def length(self) -> Optional[float]:
        """
        The length of a well, if the labware has
        square wells.
        """
        return self._core.length

    @property  # type: ignore
    @requires_version(2, 9)
    def width(self) -> Optional[float]:
        """
        The width of a well, if the labware has
        square wells.
        """
        return self._core.width

    @property  # type: ignore
    @requires_version(2, 9)
    def depth(self) -> float:
        """
        The depth of a well in a labware.
        """
        return self._core.depth

    @property
    def display_name(self) -> str:
        return self._core.get_display_name()

    @property  # type: ignore
    @requires_version(2, 7)
    def well_name(self) -> str:
        return self._core.get_name()

    @requires_version(2, 0)
    def top(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 top-center of the well relative to the deck (with the
                 front-left corner of slot 1 as (0,0,0)). If z is specified,
                 returns a point offset by z mm from top-center
        """
        return Location(self._core.get_top(z_offset=z), self)

    @requires_version(2, 0)
    def bottom(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 bottom-center of the well (with the front-left corner of
                 slot 1 as (0,0,0)). If z is specified, returns a point
                 offset by z mm from bottom-center
        """
        return Location(self._core.get_bottom(z_offset=z), self)

    @requires_version(2, 0)
    def center(self) -> Location:
        """
        :return: a Point corresponding to the absolute position of the center
                 of the well relative to the deck (with the front-left corner
                 of slot 1 as (0,0,0))
        """
        return Location(self._core.get_center(), self)

    @requires_version(2, 8)
    def from_center_cartesian(self, x: float, y: float, z: float) -> Point:
        """
        Specifies an arbitrary point in deck coordinates based
        on percentages of the radius in each axis. For example, to specify the
        back-right corner of a well at 1/4 of the well depth from the bottom,
        the call would be ``from_center_cartesian(1, 1, -0.5)``.

        No checks are performed to ensure that the resulting position will be
        inside of the well.

        :param x: a float in the range [-1.0, 1.0] for a percentage of half of
            the radius/length in the X axis
        :param y: a float in the range [-1.0, 1.0] for a percentage of half of
            the radius/width in the Y axis
        :param z: a float in the range [-1.0, 1.0] for a percentage of half of
            the height above/below the center

        :return: a :py:class:`opentrons.types.Point` representing the specified
                 location in absolute deck coordinates
        """
        return self._core.from_center_cartesian(x, y, z)

    @requires_version(2, 14)
    def load_liquid(self, liquid: Liquid, volume: float) -> None:
        """
        Load a liquid into a well.

        :param Liquid liquid: The liquid to load into the well.
        :param float volume: The volume of liquid to load, in µL.
        """
        self._core.load_liquid(
            liquid=liquid,
            volume=volume,
        )

    def _from_center_cartesian(self, x: float, y: float, z: float) -> Point:
        """
        Private version of from_center_cartesian. Present only for backward
        compatibility.
        """
        _log.warning(
            "This method is deprecated. Please use 'from_center_cartesian' instead."
        )
        return self.from_center_cartesian(x, y, z)

    def __repr__(self) -> str:
        return self._core.get_display_name()

    def __eq__(self, other: object) -> bool:
        """
        Assuming that equality of wells in this system is having the same
        absolute coordinates for the top.
        """
        if not isinstance(other, Well):
            return NotImplemented
        return self.top().point == other.top().point

    def __hash__(self) -> int:
        return hash(self.top().point)


class Labware:
    """
    This class represents a labware, such as a PCR plate, a tube rack,
    reservoir, tip rack, etc. It defines the physical geometry of the labware,
    and provides methods for accessing wells within the labware.

    It is commonly created by calling ``ProtocolContext.load_labware()``.

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
        core: AbstractLabware[Any],
        api_version: APIVersion,
        protocol_core: ProtocolCore,
        core_map: LoadedCoreMap,
    ) -> None:
        """
        :param core: The class that implements the public interface
                               of the class.
        :param APIVersion api_level: the API version to set for the instance.
                                     The :py:class:`.Labware` will
                                     conform to this level. If not specified,
                                     defaults to
                                     :py:attr:`.MAX_SUPPORTED_VERSION`.
        """
        if api_version <= _IGNORE_API_VERSION_BREAKPOINT:
            api_version = _IGNORE_API_VERSION_BREAKPOINT

        self._api_version = api_version
        self._core: LabwareCore = core
        self._protocol_core = protocol_core
        self._core_map = core_map

        well_columns = core.get_well_columns()
        self._well_grid = well_grid.create(columns=well_columns)
        self._wells_by_name = {
            well_name: Well(
                parent=self, core=core.get_well_core(well_name), api_version=api_version
            )
            for column in well_columns
            for well_name in column
        }

    @property
    def separate_calibration(self) -> bool:
        if self._api_version >= ENGINE_CORE_API_VERSION:
            raise APIVersionError("Labware.separate_calibration has been removed")

        _log.warning(
            "Labware.separate_calibrations is a deprecated internal property."
            " It no longer has meaning, but will always return `False`"
        )
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
        """A string fully identifying the labware.

        :returns: The uri, ``"namespace/loadname/version"``
        """
        return self._core.get_uri()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def parent(self) -> Union[str, ModuleTypes, OffDeckType]:
        """The parent of this labware.

        If the labware is on the deck, a `str` deck slot name will be returned.
        If on a module, the parent :py:class:`ModuleContext` will be returned.
        If off deck, :py:obj:`OFF_DECK` will be returned.

        .. versionchanged:: 2.14
            Return type for module parent changed to :py:class:`ModuleContext`.
            Prior to this version, an internal geometry interface is returned.
        .. versionchanged:: 2.15
            Will now return :py:obj:`OFF_DECK` if the labware is off-deck.
            Formerly, if the labware was removed by using ``del`` on :py:obj:`.deck`,
            this would return where it was before its removal.
        """
        if isinstance(self._core, LegacyLabwareCore):
            # Type ignoring to preserve backwards compatibility
            return self._core.get_geometry().parent.labware.object  # type: ignore

        assert self._protocol_core and self._core_map, "Labware initialized incorrectly"

        labware_location = self._protocol_core.get_labware_location(self._core)

        if isinstance(labware_location, AbstractModuleCore):
            return self._core_map.get(labware_location)

        return labware_location

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def name(self) -> str:
        """Can either be the canonical name of the labware, which is used to
        load it, or the label of the labware specified by a user."""
        return self._core.get_name()

    @name.setter
    def name(self, new_name: str) -> None:
        """Set the labware name.

        .. deprecated: 2.14
            Set the name of labware in `load_labware` instead.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            raise APIVersionError("Labware.name setter has been deprecated")

        # TODO(mc, 2023-02-06): this assert should be enough for mypy
        # investigate if upgrading mypy allows the `cast` to be removed
        assert isinstance(self._core, LegacyLabwareCore)
        cast(LegacyLabwareCore, self._core).set_name(new_name)

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def load_name(self) -> str:
        """The API load name of the labware definition"""
        return self._core.load_name

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def parameters(self) -> "LabwareParameters":
        """Internal properties of a labware including type and quirks"""
        return self._core.get_parameters()

    @property  # type: ignore
    @requires_version(2, 0)
    def quirks(self) -> List[str]:
        """Quirks specific to this labware."""
        return self._core.get_quirks()

    # TODO(mm, 2023-02-08):
    # Specify units and origin after we resolve RSS-110.
    # Remove warning once we resolve RSS-109 more broadly.
    @property  # type: ignore
    @requires_version(2, 0)
    def magdeck_engage_height(self) -> Optional[float]:
        """Return the default magnet engage height that
        :py:meth:`.MagneticModuleContext.engage` will use for this labware.

        .. warning::
            This currently returns confusing and unpredictable results that do not
            necessarily match what :py:meth:`.MagneticModuleContext.engage` will
            actually choose for its default height.

            The confusion is related to how this height's units and origin point are
            defined, and differences between Magnetic Module generations.

            For now, we recommend you avoid accessing this property directly.
        """
        # Return the raw value straight from the labware definition. For several
        # reasons (see RSS-109), this may not match the actual default height chosen
        # by MagneticModuleContext.engage().
        p = self._core.get_parameters()
        if not p["isMagneticModuleCompatible"]:
            return None
        else:
            return p["magneticModuleEngageHeight"]

    def set_calibration(self, delta: Point) -> None:
        """
        An internal, deprecated method used for updating the offset on the object.

        .. deprecated:: 2.14
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            raise APIVersionError(
                "Labware.set_calibration() is not supported when apiLevel is 2.14 or higher."
                " Use a lower apiLevel"
                " or use the Opentrons App's Labware Position Check."
            )
        self._core.set_calibration(delta)

    @requires_version(2, 12)
    def set_offset(self, x: float, y: float, z: float) -> None:
        """Set the labware's position offset.

        The offset is an x, y, z vector in deck coordinates
        (see :ref:`protocol-api-deck-coords`) that the motion system
        will add to any movement targeting this labware instance.

        The offset will *not* apply to any other labware instances,
        even if those labware are of the same type.

        .. caution::
            This method is *only* for use with mechanisms like
            :obj:`opentrons.execute.get_protocol_api`, which lack an interactive way
            to adjust labware offsets. (See :ref:`advanced-control`.)

            If you're uploading a protocol via the Opentrons App, don't use this method,
            because it will produce undefined behavior.
            Instead, use Labware Position Check in the app.

            Because protocols using :ref:`API version <v2-versioning>` 2.14 or higher
            can currently *only* be uploaded via the Opentrons App, it doesn't make
            sense to use this method with them. Trying to do so will raise an exception.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            # TODO(mm, 2023-02-13): See Jira RCORE-535.
            #
            # Until that issue is resolved, the only way to simulate or run a
            # >=ENGINE_CORE_API_VERSION protocol is through the Opentrons App.
            # Therefore, in >=ENGINE_CORE_API_VERSION protocols,
            # there's no legitimate way to use this method.
            raise APIVersionError(
                "Labware.set_offset() is not supported when apiLevel is 2.14 or higher."
                " Use a lower apiLevel"
                " or use the Opentrons App's Labware Position Check."
            )
        else:
            self._core.set_calibration(Point(x=x, y=y, z=z))

    @property  # type: ignore
    @requires_version(2, 0)
    def calibrated_offset(self) -> Point:
        return self._core.get_calibrated_offset()

    @requires_version(2, 0)
    def well(self, idx: Union[int, str]) -> Well:
        """Deprecated---use result of `wells` or `wells_by_name`"""
        if isinstance(idx, int):
            return self.wells()[idx]
        elif isinstance(idx, str):
            return self.wells_by_name()[idx]
        else:
            raise TypeError(
                f"`Labware.well` must be called with an `int` or `str`, but got {idx}"
            )

    @requires_version(2, 0)
    def wells(self, *args: Union[str, int]) -> List[Well]:
        """
        Accessor function used to generate a list of wells in top -> down,
        left -> right order. This is representative of moving down `rows` and
        across `columns` (e.g. 'A1', 'B1', 'C1'...'A2', 'B2', 'C2')

        With indexing one can treat it as a typical python
        list. To access well A1, for example, write: labware.wells()[0]

        Note that this method takes args for backward-compatibility, but use
        of args is deprecated and will be removed in future versions. Args
        can be either strings or integers, but must all be the same type (e.g.:
        `self.wells(1, 4, 8)` or `self.wells('A1', 'B2')`, but
        `self.wells('A1', 4)` is invalid.

        :return: Ordered list of all wells in a labware
        """
        if not args:
            return list(self._wells_by_name.values())

        elif validation.is_all_integers(args):
            wells = self.wells()
            return [wells[idx] for idx in args]

        elif validation.is_all_strings(args):
            wells_by_name = self.wells_by_name()
            return [wells_by_name[idx] for idx in args]

        else:
            raise TypeError(
                "`Labware.wells` must be called with all `int`'s or all `str`'s,"
                f" but was called with {args}"
            )

    @requires_version(2, 0)
    def wells_by_name(self) -> Dict[str, Well]:
        """
        Accessor function used to create a look-up table of Wells by name.

        With indexing one can treat it as a typical python
        dictionary whose keys are well names. To access well A1, for example,
        write: labware.wells_by_name()['A1']

        :return: Dictionary of well objects keyed by well name
        """
        return dict(self._wells_by_name)

    @requires_version(2, 0)
    def wells_by_index(self) -> Dict[str, Well]:
        """
        .. deprecated:: 2.0
            Use :py:meth:`wells_by_name` or dict access instead.
        """
        _log.warning(
            "wells_by_index is deprecated. Use wells_by_name or dict access instead."
        )
        return self.wells_by_name()

    @requires_version(2, 0)
    def rows(self, *args: Union[int, str]) -> List[List[Well]]:
        """
        Accessor function used to navigate through a labware by row.

        With indexing one can treat it as a typical python nested list.
        To access row A for example, write: labware.rows()[0]. This
        will output ['A1', 'A2', 'A3', 'A4'...]

        Note that this method takes args for backward-compatibility, but use
        of args is deprecated and will be removed in future versions. Args
        can be either strings or integers, but must all be the same type (e.g.:
        `self.rows(1, 4, 8)` or `self.rows('A', 'B')`, but  `self.rows('A', 4)`
        is invalid.

        :return: A list of row lists
        """
        if not args:
            return [
                [self._wells_by_name[well_name] for well_name in row]
                for row in self._well_grid.rows_by_name.values()
            ]

        elif validation.is_all_integers(args):
            rows = self.rows()
            return [rows[idx] for idx in args]

        elif validation.is_all_strings(args):
            rows_by_name = self.rows_by_name()
            return [rows_by_name[idx] for idx in args]

        else:
            raise TypeError(
                "`Labware.rows` must be called with all `int`'s or all `str`'s,"
                f" but was called with {args}"
            )

    @requires_version(2, 0)
    def rows_by_name(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by row name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example, write: labware.rows_by_name()['A']
        This will output ['A1', 'A2', 'A3', 'A4'...].

        :return: Dictionary of Well lists keyed by row name
        """
        return {
            row_name: [self._wells_by_name[well_name] for well_name in row]
            for row_name, row in self._well_grid.rows_by_name.items()
        }

    @requires_version(2, 0)
    def rows_by_index(self) -> Dict[str, List[Well]]:
        """
        .. deprecated:: 2.0
            Use :py:meth:`rows_by_name` instead.
        """
        _log.warning("rows_by_index is deprecated. Use rows_by_name instead.")
        return self.rows_by_name()

    @requires_version(2, 0)
    def columns(self, *args: Union[int, str]) -> List[List[Well]]:
        """
        Accessor function used to navigate through a labware by column.

        With indexing one can treat it as a typical python nested list.
        To access row A for example,
        write: labware.columns()[0]
        This will output ['A1', 'B1', 'C1', 'D1'...].

        Note that this method takes args for backward-compatibility, but use
        of args is deprecated and will be removed in future versions. Args
        can be either strings or integers, but must all be the same type (e.g.:
        `self.columns(1, 4, 8)` or `self.columns('1', '2')`, but
        `self.columns('1', 4)` is invalid.

        :return: A list of column lists
        """
        if not args:
            return [
                [self._wells_by_name[well_name] for well_name in column]
                for column in self._well_grid.columns_by_name.values()
            ]

        elif validation.is_all_integers(args):
            columns = self.columns()
            return [columns[idx] for idx in args]

        elif validation.is_all_strings(args):
            columns_by_name = self.columns_by_name()
            return [columns_by_name[idx] for idx in args]

        else:
            raise TypeError(
                "`Labware.columns` must be called with all `int`'s or all `str`'s,"
                f" but was called with {args}"
            )

    @requires_version(2, 0)
    def columns_by_name(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by column name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example,
        write: labware.columns_by_name()['1']
        This will output ['A1', 'B1', 'C1', 'D1'...].

        :return: Dictionary of Well lists keyed by column name
        """
        return {
            column_name: [self._wells_by_name[well_name] for well_name in column]
            for column_name, column in self._well_grid.columns_by_name.items()
        }

    @requires_version(2, 0)
    def columns_by_index(self) -> Dict[str, List[Well]]:
        """
        .. deprecated:: 2.0
            Use :py:meth:`columns_by_name` instead.
        """
        _log.warning("columns_by_index is deprecated. Use columns_by_name instead.")
        return self.columns_by_name()

    @property  # type: ignore
    @requires_version(2, 0)
    def highest_z(self) -> float:
        """
        The z-coordinate of the tallest single point anywhere on the labware.

        This is drawn from the 'dimensions'/'zDimension' elements of the
        labware definition and takes into account the calibration offset.
        """
        return self._core.highest_z

    @property
    def _is_tiprack(self) -> bool:
        """as is_tiprack but not subject to version checking for speed"""
        return self._core.is_tip_rack()

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def is_tiprack(self) -> bool:
        return self._is_tiprack

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def tip_length(self) -> float:
        return self._core.get_tip_length()

    @tip_length.setter
    def tip_length(self, length: float) -> None:
        """
        Set the tip rack's tip length.

        .. deprecated: 2.14
            Ensure tip length is set properly in your tip rack's definition
            and/or use the Opentrons App's tip length calibration feature.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            raise APIVersionError("Labware.tip_length setter has been deprecated")

        # TODO(mc, 2023-02-06): this assert should be enough for mypy
        # invvestigate if upgrading mypy allows the `cast` to be removed
        assert isinstance(self._core, LegacyLabwareCore)
        cast(LegacyLabwareCore, self._core).set_tip_length(length)

    # TODO(mc, 2022-11-09): implementation detail; deprecate public method
    def next_tip(
        self, num_tips: int = 1, starting_tip: Optional[Well] = None
    ) -> Optional[Well]:
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
        assert num_tips > 0, f"num_tips must be positive integer, but got {num_tips}"

        well_name = self._core.get_next_tip(
            num_tips=num_tips,
            starting_tip=starting_tip._core if starting_tip else None,
        )

        return self._wells_by_name[well_name] if well_name is not None else None

    def use_tips(self, start_well: Well, num_channels: int = 1) -> None:
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

        .. deprecated:: 2.14
            Modification of tip tracking state outside :py:meth:`.reset` has been deprecated.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            raise APIVersionError(
                "Labware.use_tips has been deprecated."
                " To modify tip state, use Labware.reset"
            )

        assert num_channels > 0, "Bad call to use_tips: num_channels<=0"
        fail_if_full = self._api_version < APIVersion(2, 2)

        # TODO(mc, 2023-02-13): this assert should be enough for mypy
        # investigate if upgrading mypy allows the `cast` to be removed
        assert isinstance(self._core, LegacyLabwareCore)
        cast(LegacyLabwareCore, self._core).get_tip_tracker().use_tips(
            start_well=start_well._core,
            num_channels=num_channels,
            fail_if_full=fail_if_full,
        )

    def __repr__(self) -> str:
        return self._core.get_display_name()

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Labware):
            return NotImplemented
        return self._core == other._core

    def __hash__(self) -> int:
        return hash((self._core, self._api_version))

    def previous_tip(self, num_tips: int = 1) -> Optional[Well]:
        """
        Find the best well to drop a tip in.

        This is the well from which the last tip was picked up, if there's
        room. It can be used to return tips to the tip tracker.

        :param num_tips: target number of tips to return, sequential in a
                         column
        :type num_tips: int
        :return: The :py:class:`.Well` meeting the target criteria, or ``None``

        .. versionchanged:: 2.14
            This method has been removed.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            raise APIVersionError(
                "Labware.previous_tip is unsupported in this API version."
            )

        # This logic is the inverse of :py:meth:`next_tip`
        assert num_tips > 0, "Bad call to previous_tip: num_tips <= 0"
        # TODO(mc, 2023-02-13): this assert should be enough for mypy
        # investigate if upgrading mypy allows the `cast` to be removed
        assert isinstance(self._core, LegacyLabwareCore)
        well_core = (
            cast(LegacyLabwareCore, self._core)
            .get_tip_tracker()
            .previous_tip(num_tips=num_tips)
        )
        return self._wells_by_name[well_core.get_name()] if well_core else None

    # TODO(mc, 2022-11-09): implementation detail; deprecate public method
    def return_tips(self, start_well: Well, num_channels: int = 1) -> None:
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

        .. versionchanged:: 2.14
            This method has been removed. Use :py:meth:`.reset` instead.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            raise APIVersionError(
                "Labware.return_tips() is unsupported in this API version."
                " Use Labware.reset() instead."
            )

        # This logic is the inverse of :py:meth:`use_tips`
        assert num_channels > 0, "Bad call to return_tips: num_channels <= 0"

        # TODO(mc, 2023-02-13): this assert should be enough for mypy
        # investigate if upgrading mypy allows the `cast` to be removed
        assert isinstance(self._core, LegacyLabwareCore)
        cast(LegacyLabwareCore, self._core).get_tip_tracker().return_tips(
            start_well=start_well._core, num_channels=num_channels
        )

    @requires_version(2, 0)
    def reset(self) -> None:
        """Reset all tips in a tip rack.

        .. versionchanged:: 2.14
            This method will raise an exception if you call it on a labware that isn't
            a tip rack. Formerly, it would do nothing.
        """
        self._core.reset_tips()


# TODO(mc, 2022-11-09): implementation detail, move to core
def split_tipracks(tip_racks: List[Labware]) -> Tuple[Labware, List[Labware]]:
    try:
        rest = tip_racks[1:]
    except IndexError:
        rest = []
    return tip_racks[0], rest


# TODO(mc, 2022-11-09): implementation detail, move to core
def select_tiprack_from_list(
    tip_racks: List[Labware], num_channels: int, starting_point: Optional[Well] = None
) -> Tuple[Labware, Well]:

    try:
        first, rest = split_tipracks(tip_racks)
    except IndexError:
        raise OutOfTipsError

    if starting_point and starting_point.parent != first:
        raise TipSelectionError(
            "The starting tip you selected " f"does not exist in {first}"
        )
    elif starting_point:
        first_well = starting_point
    else:
        first_well = first.wells()[0]

    next_tip = first.next_tip(num_channels, first_well)
    if next_tip:
        return first, next_tip
    else:
        return select_tiprack_from_list(rest, num_channels)


# TODO(mc, 2022-11-09): implementation detail, move to core
def filter_tipracks_to_start(
    starting_point: Well, tipracks: List[Labware]
) -> List[Labware]:
    return list(dropwhile(lambda tr: starting_point.parent != tr, tipracks))


# TODO(mc, 2022-11-09): implementation detail, move to core
def next_available_tip(
    starting_tip: Optional[Well], tip_racks: List[Labware], channels: int
) -> Tuple[Labware, Well]:
    start = starting_tip
    if start is None:
        return select_tiprack_from_list(tip_racks, channels)
    else:
        return select_tiprack_from_list(
            filter_tipracks_to_start(start, tip_racks), channels, start
        )


# TODO(mc, 2022-11-09): implementation detail, move somewhere else
# only used in old calibration flows by robot-server
def load_from_definition(
    definition: "LabwareDefinition",
    parent: Location,
    label: Optional[str] = None,
    api_level: Optional[APIVersion] = None,
) -> Labware:
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
    :param api_level: the API version to set for the loaded labware
                      instance. The :py:class:`.Labware` will
                      conform to this level. If not specified,
                      defaults to ``APIVersion(2, 13)``.
    """
    return Labware(
        core=LegacyLabwareCore(
            definition=definition,
            parent=parent,
            label=label,
        ),
        api_version=api_level or APIVersion(2, 13),
        protocol_core=None,  # type: ignore[arg-type]
        core_map=None,  # type: ignore[arg-type]
    )


# TODO(mc, 2022-11-09): implementation detail, move somewhere else
# only used in old calibration flows by robot-server
def load(
    load_name: str,
    parent: Location,
    label: Optional[str] = None,
    namespace: Optional[str] = None,
    version: int = 1,
    bundled_defs: Optional[Dict[str, LabwareDefinition]] = None,
    extra_defs: Optional[Dict[str, LabwareDefinition]] = None,
    api_level: Optional[APIVersion] = None,
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
    :param api_level: the API version to set for the loaded labware
                      instance. The :py:class:`.Labware` will
                      conform to this level. If not specified,
                      defaults to ``APIVersion(2, 13)``.
    """
    definition = get_labware_definition(
        load_name,
        namespace,
        version,
        bundled_defs=bundled_defs,
        extra_defs=extra_defs,
    )

    return load_from_definition(definition, parent, label, api_level)
