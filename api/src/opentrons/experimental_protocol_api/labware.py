""" opentrons.protocol_api.labware: classes and functions for labware handling

This module provides things like :py:class:`Labware`, and :py:class:`Well`
to encapsulate labware instances used in protocols
and their wells. It also provides helper functions to load and save labware
and labware calibration offsets. It contains all the code necessary to
transform from labware symbolic points (such as "well a1 of an opentrons
tiprack") to points in deck coordinates.
"""
import logging

from typing import (
    List, Dict, Optional, TYPE_CHECKING
)

from opentrons.protocols.api_support.util import (
    requires_version)
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.types import Location, Point, LocationLabware
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.geometry.deck_item import DeckItem
if TYPE_CHECKING:
    from opentrons.protocols.geometry.module_geometry import ModuleGeometry  # noqa: F401, E501
    from opentrons_shared_data.labware.dev_types import (
        LabwareParameters)


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

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def parent(self) -> 'Labware':
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def has_tip(self) -> bool:
        raise NotImplementedError()

    @has_tip.setter
    def has_tip(self, value: bool):
        raise NotImplementedError()

    @property
    def max_volume(self) -> float:
        raise NotImplementedError()

    @property
    def geometry(self) -> WellGeometry:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def diameter(self) -> Optional[float]:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 9)
    def length(self) -> Optional[float]:
        """
        The length of a well, if the labware has
        square wells.
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 9)
    def width(self) -> Optional[float]:
        """
        The width of a well, if the labware has
        square wells.
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 9)
    def depth(self) -> float:
        """
        The depth of a well in a labware.
        """
        raise NotImplementedError()

    @property
    def display_name(self):
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 7)
    def well_name(self) -> str:
        raise NotImplementedError()

    @requires_version(2, 0)
    def top(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 top-center of the well relative to the deck (with the
                 front-left corner of slot 1 as (0,0,0)). If z is specified,
                 returns a point offset by z mm from top-center
        """
        raise NotImplementedError()

    @requires_version(2, 0)
    def bottom(self, z: float = 0.0) -> Location:
        """
        :param z: the z distance in mm
        :return: a Point corresponding to the absolute position of the
                 bottom-center of the well (with the front-left corner of
                 slot 1 as (0,0,0)). If z is specified, returns a point
                 offset by z mm from bottom-center
        """
        raise NotImplementedError()

    @requires_version(2, 0)
    def center(self) -> Location:
        """
        :return: a Point corresponding to the absolute position of the center
                 of the well relative to the deck (with the front-left corner
                 of slot 1 as (0,0,0))
        """
        raise NotImplementedError()

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
        raise NotImplementedError()

    def __repr__(self) -> str:
        raise NotImplementedError()

    def __eq__(self, other: object) -> bool:
        """
        Assuming that equality of wells in this system is having the same
        absolute coordinates for the top.
        """
        raise NotImplementedError()

    def __hash__(self):
        raise NotImplementedError()


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
    @property
    def separate_calibration(self) -> bool:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        raise NotImplementedError()

    def __getitem__(self, key: str) -> Well:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def uri(self) -> str:
        """ A string fully identifying the labware.

        :returns: The uri, ``"namespace/loadname/version"``
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def parent(self) -> LocationLabware:
        """ The parent of this labware. Usually a slot name.
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def name(self) -> str:
        """ Can either be the canonical name of the labware, which is used to
        load it, or the label of the labware specified by a user. """
        raise NotImplementedError()

    @name.setter  # type: ignore
    def name(self, new_name) -> None:
        """ Set the labware name"""
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def load_name(self) -> str:
        """ The API load name of the labware definition """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def parameters(self) -> 'LabwareParameters':
        """Internal properties of a labware including type and quirks"""
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def quirks(self) -> List[str]:
        """ Quirks specific to this labware. """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def magdeck_engage_height(self) -> Optional[float]:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def calibrated_offset(self) -> Point:
        raise NotImplementedError()

    @requires_version(2, 0)
    def well(self, idx) -> Well:
        """Deprecated---use result of `wells` or `wells_by_name`"""
        raise NotImplementedError()

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
        raise NotImplementedError()

    @requires_version(2, 0)
    def wells_by_name(self) -> Dict[str, Well]:
        """
        Accessor function used to create a look-up table of Wells by name.

        With indexing one can treat it as a typical python
        dictionary whose keys are well names. To access well A1, for example,
        simply write: labware.wells_by_name()['A1']

        :return: Dictionary of well objects keyed by well name
        """
        raise NotImplementedError()

    @requires_version(2, 0)
    def wells_by_index(self) -> Dict[str, Well]:
        MODULE_LOG.warning(
            'wells_by_index is deprecated and will be deleted in version '
            '3.12.0. please wells_by_name or dict access')
        raise NotImplementedError()

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
        raise NotImplementedError()

    @requires_version(2, 0)
    def rows_by_name(self) -> Dict[str, List[Well]]:
        """
        Accessor function used to navigate through a labware by row name.

        With indexing one can treat it as a typical python dictionary.
        To access row A for example, simply write: labware.rows_by_name()['A']
        This will output ['A1', 'A2', 'A3', 'A4'...].

        :return: Dictionary of Well lists keyed by row name
        """
        raise NotImplementedError()

    @requires_version(2, 0)
    def rows_by_index(self) -> Dict[str, List[Well]]:
        MODULE_LOG.warning(
            'rows_by_index is deprecated and will be deleted in version '
            '3.12.0. please use rows_by_name')
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

    @requires_version(2, 0)
    def columns_by_index(self) -> Dict[str, List[Well]]:
        MODULE_LOG.warning(
            'columns_by_index is deprecated and will be deleted in version '
            '3.12.0. please use columns_by_name')
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def highest_z(self) -> float:
        """
        The z-coordinate of the tallest single point anywhere on the labware.

        This is drawn from the 'dimensions'/'zDimension' elements of the
        labware definition and takes into account the calibration offset.
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def is_tiprack(self) -> bool:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def tip_length(self) -> float:
        raise NotImplementedError()

    @tip_length.setter
    def tip_length(self, length: float):
        raise NotImplementedError()

    def __repr__(self) -> str:
        raise NotImplementedError()

    def __eq__(self, other: object) -> bool:
        raise NotImplementedError()

    def __hash__(self):
        raise NotImplementedError()
