import logging
from math import sin, cos, pi
from collections import deque

from ..labware import (
    Labware,
    get_all_labware_definitions,
    load_from_definition,
    get_labware_definition,
    save_definition,
    Well,
    WellShape,
    ModuleGeometry,
    LabwareDefinition,
    DeckItem)
from .util import log_call
from .types import LegacyLocation
from typing import (
    Dict, List, Any, Union, Optional, Tuple, TYPE_CHECKING, Deque)

import jsonschema  # type: ignore

from opentrons.types import Point, Location
from opentrons.data_storage import database as db_cmds
from opentrons.config import CONFIG
from opentrons.legacy_api.containers.placeable import (
    Container, Well as oldWell)
from opentrons.protocols.types import APIVersion

if TYPE_CHECKING:
    from ..contexts import ProtocolContext

log = logging.getLogger(__name__)
# Dict[str, Union[List[Well], Dict[str, Well]]]
AccessorMethodDict = Dict[str, Any]

MODULE_BLACKLIST = ['tempdeck', 'magdeck', 'temperature-plate']

LW_TRANSLATION = {
    '6-well-plate': 'corning_6_wellplate_16.8ml_flat',
    '12-well-plate': 'corning_12_wellplate_6.9_ml',
    '24-well-plate': 'corning_24_wellplate_3.4_ml',
    '48-well-plate': 'corning_48_wellplate_1.6ml_flat',
    '384-plate': 'corning_384_wellplate_112ul_flat',
    '96-deep-well': 'usascientific_96_wellplate_2.4ml_deep',
    '96-flat': 'corning_96_wellplate_360ul_flat',
    '96-PCR-flat': 'biorad_96_wellplate_200ul_pcr',
    '96-PCR-tall': 'biorad_96_wellplate_200ul_pcr',
    'biorad-hardshell-96-PCR': 'biorad_96_wellplate_200ul_pcr',
    'alum-block-pcr-strips': 'opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip',  # noqa(E501)
    'opentrons-aluminum-block-2ml-eppendorf': 'opentrons_24_aluminumblock_generic_2ml_screwcap',       # noqa(E501)
    'opentrons-aluminum-block-2ml-screwcap': 'opentrons_24_aluminumblock_generic_2ml_screwcap',        # noqa(E501)
    'opentrons-aluminum-block-96-PCR-plate': 'opentrons_96_aluminum_biorad_plate_200_ul',  # noqa(E501)
    'opentrons-aluminum-block-PCR-strips-200ul': 'opentrons_96_aluminumblock_generic_pcr_strip_200ul',  # noqa(E501)
    'opentrons-tiprack-300ul': 'opentrons_96_tiprack_300ul',
    'opentrons-tuberack-1.5ml-eppendorf': 'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap',        # noqa(E501)
    'opentrons-tuberack-15_50ml': 'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical',        # noqa(E501)
    'opentrons-tuberack-15ml': 'opentrons_15_tuberack_15_ml_falcon',
    'opentrons-tuberack-2ml-eppendorf': 'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap',            # noqa(E501)
    'opentrons-tuberack-2ml-screwcap': 'opentrons_24_tuberack_generic_2ml_screwcap',              # noqa(E501)
    'opentrons-tuberack-50ml': 'opentrons_6_tuberack_falcon_50ml_conical',
    'PCR-strip-tall': 'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
    'tiprack-10ul': 'opentrons_96_tiprack_10ul',
    'tiprack-200ul': 'tipone_96_tiprack_200ul',
    'tiprack-1000ul': 'opentrons_96_tiprack_1000ul',
    'trash-box': 'agilent_1_reservoir_290ml',
    'trough-12row': 'usascientific_12_reservoir_22ml',
    'tube-rack-.75ml': 'opentrons_24_tuberack_generic_0.75ml_snapcap_acrylic',  # noqa(E501)
    'tube-rack-2ml': 'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap_acrylic',  # noqa(E501)
    'tube-rack-15_50ml': 'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic',  # noqa(E501)
}
""" A table mapping old labware names to new labware names"""


LW_UNMIGRATEABLE = [
    'rigaku-compact-crystallization-plate',
    'small_vial_rack_16x45',
    'tiprack-1000ul-chem',
    'tube-rack-2ml-9x9',
    'tube-rack-5ml-96',
    'tube-rack-80well',
    'wheaton_vial_rack'
]
""" A list of labware we cannot automatically migrate from v1 to v2 """


def _convert_labware_name(labware_name: str) -> str:
    return labware_name.replace("-", "_").lower()


def _determine_well_names(labware: Container):
    # In the instance that the labware only contains one well, we must
    # not index labware.wells() as it is not contained inside a WellSeries
    if isinstance(labware.wells(), oldWell):
        wells = [labware.wells().get_name()]
        first_well = labware.wells()
        return wells, first_well

    return [well.get_name() for well in labware.wells()], labware.wells()[0]


def _add_metadata_from_v1(
        labware: Container, lw_dict: Dict[str, Any], is_tiprack: bool):

    wells, first_well = _determine_well_names(labware)

    # Labware Information
    lw_dict['groups'] = [{
        'wells': wells,
        'metadata': {}}]
    if is_tiprack:
        lw_dict['parameters']['tipLength'] = labware._coordinates['z']
        lw_dict['parameters']['tipOverlap'] = 0

    if (len(wells) > 1) and (len(labware.rows()[0]) > 1)\
            and (wells[0][0] == labware.rows()[0][1]):
        # Very ugly logic to check for row ordering instead of column ordering
        # as some old labwares do not follow our current convention.
        lw_dict['ordering'] = [
            [well.get_name() for well in row] for row in labware.rows()]
    else:
        lw_dict['ordering'] = [
            [well.get_name() for well in col] for col in labware.columns()]
    lw_dict['cornerOffsetFromSlot'] = {
        'x': labware._coordinates['x'],
        'y': labware._coordinates['y'],
        'z': 0
    }

    height_val = first_well.properties.get(
        'depth', first_well.properties.get('height', 0))
    height = height_val + first_well._coordinates['z']
    lw_dict['dimensions'] = {
        'xDimension': 127.76,
        'yDimension': 85.48,
        'zDimension': height
    }


def _format_labware_definition(labware_name: str, labware: Container = None):
    lw_dict: Dict[str, Any] = {}
    lw_dict['wells'] = {}
    converted_labware_name = _convert_labware_name(labware_name)
    is_tiprack = True if 'tip' in converted_labware_name else False

    # Definition Metadata
    lw_dict['brand'] = {'brand': 'opentrons'}
    lw_dict['schemaVersion'] = 2
    lw_dict['version'] = 1
    lw_dict['namespace'] = 'legacy_api'
    lw_dict['metadata'] = {
        'displayName': converted_labware_name,
        'displayCategory': 'tipRack' if is_tiprack else 'other',
        'displayVolumeUnits': 'µL'}
    lw_dict['parameters'] = {
        'format': 'irregular',
        'isMagneticModuleCompatible': False,
        'loadName': converted_labware_name,
        'isTiprack': is_tiprack}

    # If this method is being called with a placeable labware,
    # format metadata based off that labware info.
    if labware:
        _add_metadata_from_v1(labware, lw_dict, is_tiprack)
    return lw_dict, is_tiprack


def _add_well(
        lw_dict: Dict[str, Any],
        well_name: str,
        well_props: Dict[str, Any],
        well_coordinates):
    # Format one API v2 well entry
    lw_dict['wells'][well_name] = {
        'x': well_coordinates['x'],
        'y': well_coordinates['y'],
        'z': well_coordinates['z'],
        'totalLiquidVolume': well_props.get('total-liquid-volume', 0),
        'depth': well_props.get('depth', 0)}
    if well_props.get('diameter'):
        lw_dict['wells'][well_name]['diameter'] = well_props.get('diameter')
        lw_dict['wells'][well_name]['shape'] = 'circular'
    else:
        lw_dict['wells'][well_name]['xDimension'] = well_props.get('length')
        lw_dict['wells'][well_name]['yDimension'] = well_props.get('width')
        lw_dict['wells'][well_name]['shape'] = 'rectangular'


def create_new_labware_definition(labware: Container, labware_name: str):
    # shape metadata/parameter keys for labwares in v2 schema format
    lw_dict, _ = _format_labware_definition(labware_name, labware)
    # Well Information
    for well in labware.wells():
        well_props = well.properties
        well_coords = well._coordinates
        well_name = well.get_name()
        _add_well(lw_dict, well_name, well_props, well_coords)
    return lw_dict


def perform_migration() -> Tuple[Dict[str, str], List[str]]:
    path_to_save_defs = CONFIG['labware_user_definitions_dir_v2']
    all_containers = filter(
        lambda lw: lw not in MODULE_BLACKLIST,
        db_cmds.list_all_containers())
    already_migrated = get_all_labware_definitions()
    # filter out all module and standard labwares from the database
    labware_to_create = filter(
        lambda x: x not in list(LW_TRANSLATION.keys()) + LW_UNMIGRATEABLE,
        all_containers)
    failures = []
    migrated: Dict[str, str] = {}
    for lw_name in labware_to_create:
        labware = db_cmds.load_container(lw_name)
        if labware.wells():
            labware_def = create_new_labware_definition(labware, lw_name)
            if labware_def['parameters']['loadName'] in already_migrated:
                log.debug(
                    f"Skipping migration of {lw_name} because it has already "
                    "been migrated as "
                    f"{labware_def['parameters']['loadName']}")
                continue
            try:
                log.info(f"Migrating {lw_name} to API v2 format")
                save_definition(labware_def, location=path_to_save_defs)
                migrated[lw_name] = labware_def['parameters']['loadName']
            except jsonschema.exceptions.ValidationError:
                failures.append(lw_name)
        else:
            log.debug(f"Skipping migration of {lw_name} because there are no",
                      "wells associated with this labware.")
    log.info("Migration of API V1 labware complete.")
    return migrated, failures


class LegacyWell(Well):
    """
    Class that inherits from :py:class:`opentrons.protocol_api.labware.Well`.
    In addition to all the properties found on a regular well,
    :py:class:`.LegacyWell` allows the user to look at special properties
    about the wells for a given labware.
    """
    def __init__(
            self,
            well_props: Dict[str, Any],
            parent: Location,
            display_name: str,
            has_tip: bool,
            api_version: APIVersion,
            labware_height: float = None,
            well_name: str = None):
        self._well = super().__init__(
            well_props, parent, display_name, has_tip, api_version)
        self._well_name = well_name
        self._parent_height = labware_height

    @property
    def properties(self) -> Dict[str, Any]:
        return {
            'depth': self.depth,
            'total-liquid-volume': self.max_volume,
            'diameter': self.diameter,
            'width': self.width,
            'length': self.length,
            'height': self.height,
            'has_tip': self.has_tip,
            'shape': self.shape,
            'parent': self.parent
            }

    @property
    def parent(self) -> 'LegacyLabware':
        return self._parent  # type: ignore

    def get_name(self) -> Optional[str]:
        return self._well_name

    @property
    def depth(self) -> float:
        return self._depth

    def get_trace(self):
        current_obj = self.parent
        while current_obj:
            yield current_obj
            current_obj = getattr(current_obj, 'parent')

    @property
    def width(self) -> float:
        return self._width

    @property
    def length(self) -> float:
        return self._length

    @property
    def shape(self) -> Optional[WellShape]:
        return self._shape

    @property
    def height(self) -> Optional[float]:
        return self._parent_height

    def top(self,
            z: float = 0.0,
            radius: float = 0.0,
            degrees: float = 0,
            reference=None) -> LegacyLocation:
        """
        Returns :py:class:`.LegacyLocation` ( a NamedTuple of
        :py:class:`.LegacyWell`, :py:class:`.Point`) where
        the vector points to the top of the placeable. This can be passed
        into any :py:class:`.Robot` or :py:class:`.Pipette` method
        ``location`` argument.

        If ``reference`` (a :py:class:`.Placeable`) is provided, the return
        value will be in that placeable's coordinate system.

        The ``radius`` and ``degrees`` arguments are interpreted as
        in :py:meth:`.from_center` (except that ``degrees`` is in degrees, not
        radians). They can be used to specify a further distance from the top
        center of the well; for instance, calling
        ``top(radius=0.5, degrees=180)`` will move half the radius in the 180
        degree direction from the center of the well.

        The ``z`` argument is a distance in mm to move in z from the top, and
        can be used to hover above or below the top. For instance, calling
        ``top(z=-1)`` will move 1mm below the top.

        :param z: Absolute distance in mm to move  in ``z`` from the top. Note
                  that unlike the other arguments, this is a distance, not a
                  ratio.
        :param degrees: Direction in which to move ``radius`` from the top
                        center.
        :param radius: Ratio of the placeable's radius to move in the direction
                       specified by ``degrees`` from the top center.
        :returns: A tuple of the placeable and the offset. This can be passed
                  into any :py:class:`.Robot` or :py:class:`.Pipette` method
                  ``location`` argument.
        """
        coordinates = self.from_center(
            r=radius,
            theta=(degrees / 180) * pi,
            h=1,
            reference=reference)
        return LegacyLocation(labware=self,
                              offset=coordinates.offset + Point(0, 0, z))

    def bottom(self, z: float = 0.0, radius: float = 0.0,
               degrees: float = 0.0,
               reference=None) -> LegacyLocation:
        """
        Returns :py:class:`.LegacyLocation` ( a NamedTuple of
        :py:class:`.LegacyWell`, :py:class:`.Point`) where
        the vector points to the bottom of the placeable. This can be passed
        into any :py:class:`.Robot` or :py:class:`.Pipette` method
        ``location`` argument.

        If ``reference`` (a :py:class:`.Placeable`) is provided, the return
        value will be in that placeable's coordinate system.

        The ``radius`` and ``degrees`` arguments are interpreted as
        in :py:meth:`.from_center` (except that ``degrees`` is in degrees, not
        radians). They can be used to specify a further distance from the
        bottom center of the well; for instance, calling
        ``bottom(radius=0.5, degrees=180)`` will move half the radius in the
        180 degree direction from the center of the well.

        The ``z`` argument is a distance in mm to move in z from the bottom,
        and can be used to hover above the bottom. For instance, calling
        ``bottom(z=1)`` will move 1mm above the bottom.

        :param z: Absolute distance in mm to move  in ``z`` from the bottom.
                  Note that unlike the other arguments, this is a distance, not
                  a ratio.
        :param degrees: Direction in which to move ``radius`` from the bottom
                        center.
        :param radius: Ratio of the placeable's radius to move in the direction
                       specified by ``degrees`` from the bottom center.
        :param reference: An optional placeable for the vector to be relative
                          to.
        :returns: A tuple of the placeable and the offset. This can be passed
                  into any :py:class:`.Robot` or :py:class:`.Pipette` method
                  ``location`` argument.
        """
        coordinates = self.from_center(r=radius,
                                       theta=(degrees / 180) * pi,
                                       h=-1,
                                       reference=reference)
        return LegacyLocation(labware=self,
                              offset=coordinates.offset + Point(0, 0, z))

    def center(
            self,
            reference: Union['LegacyLabware', 'LegacyWell'] = None)\
            -> LegacyLocation:
        """
        Returns :py:class:`.LegacyLocation` ( a NamedTuple of
        :py:class:`.LegacyWell`, :py:class:`.Point`) where
        the vector points to the center of the well, in ``x``, ``y``,
        and ``z``. This can be passed into any :py:class:`.Robot` or
        :py:class:`.Pipette` method ``location`` argument.

        If ``reference`` (a :py:class:`.Placeable`) is provided, the return
        value will be in that placeable's coordinate system.

        :param reference: An optional placeable for the vector to be relative
                          to.
        :returns: A tuple of the placeable and the offset. This can be passed
                  into any :py:class:`.Robot` or :py:class:`.Pipette` method
                  ``location`` argument.
        """
        return self.from_center(reference=reference)

    def _from_center_polar(
            self, r: float = None, theta: float = None, h: float = None)\
            -> Point:
        center = self._center()
        if self._shape is WellShape.RECTANGULAR:
            radius = self._length / 2  # to match placeable
        else:
            radius = self._diameter / 2  # type: ignore

        z_size = self._depth
        checked_r = r or 0.0
        checked_theta = theta or 0.0
        checked_h = h or 0.0
        scaled_r = radius * checked_r
        return Point(
            x=center.point.x + (scaled_r*cos(checked_theta)),
            y=center.point.y + (scaled_r*sin(checked_theta)),
            z=center.point.z + checked_h * (z_size/2)
        )

    def from_center(
            self,
            x: float = None, y: float = None, z: float = None,
            r: float = None, theta: float = None, h: float = None,
            reference: Union['LegacyLabware', 'LegacyWell'] = None)\
            -> LegacyLocation:
        """
        Accepts a set of ratios for Cartesian or ratios/angle for Polar
        and returns :py:class:`.Vector` using ``reference`` as origin.

        Though both polar and cartesian arguments are accepted, only one
        set should be used at the same time, and the set selected should be
        entirely used. In addition, all variables in the set should be used.

        For instance, if you want to use cartesian coordinates, you must
        specify all of ``x``, ``y``, and ``z`` as numbers; if you want to
        use polar coordinates, you must specify all of ``theta``, ``r`` and
        ``h`` as numbers.

        While ``theta`` is an absolute angle in radians, the other values are
        actually ratios which are multiplied by the relevant dimensions of the
        placeable on which ``from_center`` is called. For instance, calling
        ``from_center(x=0.5, y=0.5, z=0.5)`` does not mean "500 micromenters
        from the center in each dimension", but "half the x size, half the y
        size, and half the z size from the center". Similarly,
        ``from_center(r=0.5, theta=3.14, h=0.5)`` means "half the radius
        dimension at 180 degrees, and half the height upwards".

        :param x: Ratio of the x dimension of the placeable to move from the
                  center.
        :param y: Ratio of the y dimension of the placeable to move from the
                  center.
        :param z: Ratio of the z dimension of the placeable to move from the
                  center.
        :param r: Ratio of the radius to move from the center.
        :param theta: Angle in radians at which to move the percentage of the
                      radius specified by ``r`` from the center.
        :param h: Percentage of the height to move up in z from the center.
        :param reference: If specified, an origin to add to the offset vector
                          specified by the other arguments.
        :returns: A vector from either the origin or the specified reference.
                  This can be passed into any :py:class:`.Robot` or
                  :py:class:`.Pipette` method ``location`` argument.
        """
        if reference not in (self, None):
            raise NotImplementedError('external references not supported')

        if x is not None or y is not None or z is not None:
            from_center_absolute = self._from_center_cartesian(
                x or 0.0, y or 0.0, z or 0.0)
        elif r is not None or theta is not None or h is not None:
            from_center_absolute = self._from_center_polar(r, theta, h)
        else:
            from_center_absolute = super().center().point

        offset = from_center_absolute\
            - self._from_center_cartesian(-1, -1, -1)
        return LegacyLocation(
                labware=self,
                offset=offset)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, (LegacyWell, Well)):
            return NotImplemented
        if isinstance(other, Well) and not isinstance(other, LegacyWell):
            return False
        return super().top().point == super(LegacyWell, other).top().point


class LegacyLabware():
    def __init__(self, labware: Labware) -> None:
        self.lw_obj = labware
        self.set_calibration(Point(0, 0, 0))
        self._definition = self.lw_obj._definition
        self._wells_by_index = self.lw_obj.wells()
        self._wells_by_name = self.lw_obj.wells_by_name()
        self._columns = self.lw_obj.columns()
        self._columns_by_name = self.lw_obj.columns_by_name()
        self._rows = self.lw_obj.rows()
        self._rows_by_name = self.lw_obj.rows_by_name()
        self._properties = {
            'length': self.lw_obj._dimensions['xDimension'],
            'width': self.lw_obj._dimensions['yDimension'],
            'height': self.lw_obj._dimensions['zDimension'],
            'type': self.lw_obj._display_name,
            'magdeck_engage_height': self.lw_obj.magdeck_engage_height
            }

        # Lookup table used specifically for the weird `well` and `cols`
        # method(s) in placeable that people used
        self._accessor_methods: Dict[str, object] = {
            'well': self.wells,
            'cols': self.columns
        }

        # Lookup table for methods that either return a dict or lists
        # to describe rows/cols/wells
        self._map_list_and_dict: AccessorMethodDict = {  # typing: ignore
            'wells': {
                'list': self._wells_by_index, 'dict': self._wells_by_name},
            'columns': {
                'list': self._columns, 'dict': self._columns_by_name},
            'rows': {
                'list': self._rows, 'dict': self._rows_by_name}
            }

    def __getattr__(self, attr):
        # For the use-case of methods `well` or `cols`
        try:
            return self._accessor_methods[attr]
        except KeyError:
            raise AttributeError()

    def __getitem__(self, name) -> Well:
        # For the use-case of labware[0] or labware['A1']
        if isinstance(name, int) or isinstance(name, slice):
            return self._map_list_and_dict['wells']['list'][name]
        elif isinstance(name, str):
            return self._map_list_and_dict['wells']['dict'][name]
        else:
            raise TypeError('Expected int, slice or string')

    @property
    def properties(self) -> Dict:
        return self._properties

    @property
    def parent(self):
        return self.lw_obj.parent

    @property
    def uri(self) -> str:
        """ A string fully identifying the labware.

        :returns: The uri, ``"namespace/loadname/version"``
        """
        return self.lw_obj.uri

    @property
    def name(self) -> str:
        """ Can either be the canonical name of the labware, which is used to
        load it, or the label of the labware specified by a user. """
        return self.lw_obj.name

    @name.setter
    def name(self, new_name):
        """ Set the labware name"""
        self.lw_obj.name = new_name

    @property
    def quirks(self) -> List[str]:
        """ Quirks specific to this labware. """
        return self.lw_obj.quirks

    @property
    def magdeck_engage_height(self) -> Optional[float]:
        return self.lw_obj.magdeck_engage_height

    @property
    def columns(self):
        return WellSeries(
            wells_dict=self._columns_by_name,
            wells_list=self._columns,
            labware_object=self,
            method_flag='columns')

    @property
    def rows(self):
        return WellSeries(
            wells_dict=self._rows_by_name,
            wells_list=self._rows,
            labware_object=self,
            method_flag='rows')

    @property
    def highest_z(self) -> float:
        """
        The z-coordinate of the tallest single point anywhere on the labware.

        This is drawn from the 'dimensions'/'zDimension' elements of the
        labware definition and takes into account the calibration offset.
        """
        return self.lw_obj.highest_z

    @property
    def is_tiprack(self) -> bool:
        return self.lw_obj.is_tiprack

    @property
    def tip_length(self) -> float:
        return self.lw_obj.is_tiprack

    @tip_length.setter
    def tip_length(self, length: float):
        self.lw_obj._parameters['tipLength'] = length

    def set_calibration(self, delta: Point):
        """
        Called by save calibration in order to update the offset on the object.
        """
        offset = self.lw_obj._offset
        self.lw_obj._calibrated_offset = Point(x=offset.x + delta.x,
                                               y=offset.y + delta.y,
                                               z=offset.z + delta.z)
        self.lw_obj._wells = self._build_wells()

    @property
    def calibrated_offset(self) -> Point:
        return self.lw_obj._calibrated_offset

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
        return self.lw_obj.next_tip(num_tips, starting_tip)

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
        self.lw_obj.use_tips(start_well, num_channels)

    def __repr__(self):
        return self.lw_obj._display_name

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
        return self.lw_obj.previous_tip(num_tips)

    def return_tips(self, start_well: Well, num_channels: int = 1):
        """
        Re-adds tips to the tip tracker

        This method should be called when a tip is dropped in a tiprack. It
        should be called with ``num_channels=1`` or ``num_channels=8`` for
        single-and multi-channel respectively. If returning more than one
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
        return self.lw_obj.return_tips(start_well, num_channels)

    def reset(self):
        """Reset all tips in a tiprack
        """
        if self.lw_obj.is_tiprack:
            for well in self.lw_obj.wells():
                well.has_tip = True

    def _get_wells_by_xy(
            self, method_name=None, **kwargs) -> Union[Well, List[Well]]:
        x = kwargs.get('x', None)
        y = kwargs.get('y', None)
        if method_name != 'wells':
            raise ValueError(
                f'You cannot use X and Y with {method_name} method')
        if x is None and isinstance(y, int):
            return self._rows[y]
        elif y is None and isinstance(x, int):
            return self._columns[x]
        elif isinstance(x, int) and isinstance(y, int):
            return self._columns[x][y]
        else:
            raise ValueError('Labware.wells(x=, y=) expects ints')

    def _get_wells_by_to_and_length(self, *args, method_name=None, **kwargs):
        # Method used specifically for length/to/step kwargs allowed in apiv1
        # Strangely, it keeps 3 instances of a given labware's wells
        # so that it can do a "wrapping" behavior.
        start = args[0] if len(args) else 0
        stop = kwargs.get('to', None)
        step = kwargs.get('step', 1)
        length = kwargs.get('length', 1)

        wells_list = self._map_list_and_dict[method_name]['list']
        wells_dict = self._map_list_and_dict[method_name]['dict']
        wrapped_wells = [w
                         for i in range(3)
                         for w in wells_list]
        total_wells = len(wells_list)

        if isinstance(start, str):
            start = wells_list.index(wells_dict[start])
        if stop:
            if isinstance(stop, str):
                stop = wells_list.index(wells_dict[start])
            if stop > start:
                stop += 1
                step = step * -1 if step < 0 else step
            elif stop < start:
                stop -= 1
                step = step * -1 if step > 0 else step
            new_wells = wrapped_wells[
                start + total_wells:stop + total_wells:step]
        else:
            if length < 0:
                length *= -1
                step = step * -1 if step > 0 else step
            new_wells = wrapped_wells[start + total_wells::step][:length]

        if len(new_wells) == 1:
            return new_wells[0]
        else:
            return new_wells

    def _get_well_by_type(
            self,
            well: Union[int, str, slice],
            method_name) -> Union[List[Well], Well]:
        if isinstance(well, int):
            return self._map_list_and_dict[method_name]['list'][well]
        elif isinstance(well, str):
            return self._map_list_and_dict[method_name]['dict'][well]
        else:
            raise TypeError(f"Type {type(well)} is not compatible.")

    def wells(self,
              *args,
              **kwargs):  # type: ignore
        """
        Returns child Well or list of child Wells
        """
        if not args and not kwargs:
            return WellSeries(self._wells_by_name, self._wells_by_index, self)

        if args and isinstance(args[0], list):
            args = args[0]  # type: ignore

        if len(args) > 1:
            return [self._get_well_by_type(n, 'wells') for n in args]
        else:
            return self.handle_args('wells', *args, **kwargs)

    def handle_args(self, method_name: str, *args, **kwargs)\
            -> Union[List[Well], Well]:

        if 'x' in kwargs or 'y' in kwargs:
            return self._get_wells_by_xy(method_name=method_name, **kwargs)
        elif 'to' in kwargs or 'length' in kwargs or 'step' in kwargs:
            return self._get_wells_by_to_and_length(
                *args, method_name=method_name, **kwargs)
        elif len(args) == 1:
            return self._get_well_by_type(
                args[0],
                method_name)
        else:
            raise IndexError('Unable to parse through well list.')

    def method_columns(self, *args, **kwargs):
        if not args:
            return WellSeries(self._columns_by_name, self._columns, self)
        if len(args) == 1:
            return self._get_well_by_type(*args, 'columns')
        elif len(args) > 1:
            return [self._get_well_by_type(n, 'columns') for n in args]
        else:
            return self.handle_args('columns', *args, **kwargs)

    def method_rows(self, *args, **kwargs):
        if not args:
            return WellSeries(self._rows_by_name, self._rows, self)
        if len(args) == 1:
            return self._get_well_by_type(*args, 'rows')
        elif len(args) > 1:
            return [self._get_well_by_type(n, 'rows') for n in args]
        else:
            return self.handle_args('rows', *args, **kwargs)

    def _build_wells(self) -> List[Well]:
        """
        This function is used to create one instance of wells to be used by all
        accessor functions. It is only called again if a new offset needs
        to be applied.
        """
        return [
            LegacyWell(
                self.lw_obj._well_definition[well],
                Location(self.lw_obj._calibrated_offset, self.lw_obj),
                "{} of {}".format(well, self.lw_obj._display_name),
                self.lw_obj.is_tiprack,
                self.lw_obj.api_version,
                self.lw_obj._dimensions['zDimension'],
                well_name=well)
            for well in self.lw_obj._ordering]


class WellSeries(LegacyLabware):
    """
    This is a greatly cut down version of WellSeries found in placeable.py
    The main purpose of this class is to allow behavior which switches
    the method signature of columns/rows when someone wants to
    call a well like `plate.rows('A')`
    """

    def __init__(
            self,
            wells_dict: Dict,
            wells_list: List,
            labware_object: LegacyLabware,
            method_flag: str = None,
            name: str = None):

        self.lw_object = labware_object
        self.items = wells_dict
        self.values = wells_list
        self.method_flag = method_flag

    def __getitem__(self, name):
        if isinstance(name, slice):
            return self.values[name]
        elif isinstance(name, int):
            return self.values[name]
        elif isinstance(name, str):
            return self.items[name]
        else:
            raise TypeError('Expected int, slice or string')

    def __call__(self, *args, **kwargs):
        if self.method_flag == 'columns':
            return self.lw_object.method_columns(*args)
        elif self.method_flag == 'rows':
            return self.lw_object.method_rows(*args)
        else:
            raise TypeError(f'You cannot call {self.__name__}')

    def __iter__(self):
        return iter(self.values)


class LegacyDeckItem(DeckItem):
    def __init__(self, share_type: str):
        self._highest_z = 0.0
        self._labware: Deque = deque()
        self._type = share_type

    @property
    def highest_z(self):
        return self._highest_z

    @highest_z.setter
    def highest_z(self, new_z):
        self._highest_z = new_z

    @property
    def share_type(self):
        return self._type

    @share_type.setter
    def share_type(self, type: str):
        self._type = type

    def add_item(self, item: Labware):
        self._labware.appendleft(item)
        self.recalculate_z_for_slot()

    def recalculate_z_for_slot(self):
        if self.share_type == 'share':
            self.highest_z = max([lw.highest_z for lw in self._labware])
        else:
            self.highest_z = self._labware[0].highest_z


class Containers:
    """ A backwards-compatibility shim for the `New Protocol API`_.

    This class provides a replacement for the `opentrons.labware` and
    `opentrons.containers` global instances. Like those global instances,
    this class shims labware load functions for ease of use. This class should
    not be instantiated by user code, and use of its methods should be
    replaced with use of the corresponding functions of
    :py:class:`.ProtocolContext`. For information on how to replace calls to
    methods of this class, see the method documentation.
    """

    def __init__(self, ctx: 'ProtocolContext') -> None:
        self._ctx = ctx
        self._labware_mappings: Dict[Labware, LegacyLabware] = {}

    @property
    def labware_mappings(self) -> Dict[Labware, LegacyLabware]:
        """ Reverse of LegacyLabware.lw_obj """
        return self._labware_mappings

    def _determine_share_logic(
            self,
            new_labware: Labware,
            old_labware: LegacyDeckItem):
        # In order for the z height to be calculated correctly,
        # we need to be sure that the share type is set correctly.
        if old_labware.share_type == 'normal':
            old_labware.share_type = 'share'

        old_labware.add_item(new_labware)

    @log_call(log)
    def load(
            self,
            container_name: str,
            slot: Union[int, str],
            label: str = None,
            share: bool = False) -> 'LegacyLabware':
        """ Load a piece of labware by specifying its name and position.

        This method calls :py:meth:`.ProtocolContext.load_labware`;
        see that documentation for more information on arguments and return
        values. Calls to this function should be replaced with calls to
        :py:meth:`.Protocolcontext.load_labware`.

        In addition, this function contains translations between old
        labware names and new labware names.
        """
        slot_int = self._ctx._deck_layout._check_name(slot)
        if self._ctx._deck_layout[slot_int] and not share:
            raise RuntimeWarning(
                f'Slot {slot} has child. Use "containers.load(\''
                f'{container_name}\', \'{slot}\', share=True)"')
        elif container_name in MODULE_BLACKLIST:
            raise RuntimeError(
                "load modules using modules.load()")
        defn = self._get_labware_def_with_fallback(container_name)
        if slot_int in self._ctx._deck_layout and\
                isinstance(self._ctx._deck_layout[slot_int], ModuleGeometry):
            geom = self._ctx._deck_layout[slot_int]
            mod = [mod
                   for mod in self._ctx.loaded_modules.values()
                   if mod.geometry is geom][0]
            lw_obj = mod.load_labware_from_definition(defn)
        else:
            lw_obj = self._add_labware_to_deck(defn, slot_int, label, share)
        legacy = LegacyLabware(lw_obj)
        self.labware_mappings[lw_obj] = legacy
        return legacy

    def _get_labware_def_with_fallback(
            self, container_name: str) -> Dict[str, Any]:
        try:
            return get_labware_definition(container_name)
        except FileNotFoundError:
            try:
                container_name = LW_TRANSLATION[container_name]
                return get_labware_definition(container_name)
            except KeyError:
                return get_labware_definition(
                    _convert_labware_name(container_name),
                    namespace='legacy_api')

    def _add_labware_to_deck(self, defn: LabwareDefinition,
                             slot: int, label: Optional[str],
                             share: bool) -> Labware:
        # Manually add LegacyDeckItem to deck if not a module
        parent = self._ctx.deck.position_for(slot)
        labware_object = load_from_definition(
            defn, parent, label, self._ctx.api_version)
        item = self._ctx._deck_layout.get(slot)
        if share and not item:
            raise ValueError(f'There is no other labware in slot {slot}',
                             'please add a labware, then specify,',
                             'share=True')
        elif share and item:
            self._determine_share_logic(labware_object, item)
            self._ctx._deck_layout.recalculate_high_z()

        else:
            deck_item = LegacyDeckItem('normal')
            deck_item.add_item(labware_object)
            self._ctx._deck_layout[slot] = deck_item

        return labware_object

    @log_call(log)
    def create(
            self,
            name,
            grid,
            spacing,
            diameter,
            depth,
            volume=0) -> LegacyLabware:
        columns, rows = grid
        col_spacing, row_spacing = spacing

        lw_dict, is_tiprack = _format_labware_definition(name)

        lw_dict['namespace'] = 'custom_beta'
        if is_tiprack:
            lw_dict['parameters']['tipLength'] = depth
            lw_dict['parameters']['tipOverlap'] = 0

        lw_dict['groups'] = [{'wells': [], 'metadata': {}}]
        lw_dict['ordering'] = []

        for c in range(columns):
            lw_dict['ordering'].append([])
            for r in range(rows):
                well_name = chr(r + ord('A')) + str(1 + c)
                x_coord = c * col_spacing
                y_coord = (rows - r - 1) * row_spacing
                z_coord = depth

                lw_dict['groups'][0]['wells'].append(well_name)
                lw_dict['ordering'][-1].append(well_name)
                lw_dict['wells'][well_name] = {
                     "depth": depth,
                     "shape": "circular",
                     "diameter": diameter,
                     "totalLiquidVolume": volume,
                     "x": x_coord,
                     "y": y_coord,
                     "z": z_coord
                     }

        lw_dict['cornerOffsetFromSlot'] = {'x': 0, 'y': 0, 'z': 0}

        lw_dict['dimensions'] = {
            'xDimension': 127.76,
            'yDimension': 85.48,
            'zDimension': depth}

        path_to_save_defs = CONFIG['labware_user_definitions_dir_v2']
        save_definition(lw_dict, location=path_to_save_defs)

        lw = Labware(lw_dict, Location(Point(0, 0, 0), 'deck'))
        legacy = LegacyLabware(lw)
        self.labware_mappings[lw] = legacy
        return legacy

    @log_call(log)
    def list(self, *args, **kwargs):
        return get_all_labware_definitions()
