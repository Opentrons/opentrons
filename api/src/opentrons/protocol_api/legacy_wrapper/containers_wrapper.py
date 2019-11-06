import logging

from ..labware import (
    Labware,
    get_all_labware_definitions,
    save_definition,
    Well,
    WellShape)
from .util import log_call
from typing import Dict, List, Any, Union, Optional, TYPE_CHECKING

import jsonschema  # type: ignore

from opentrons.types import Location, Point
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


def perform_migration():
    path_to_save_defs = CONFIG['labware_user_definitions_dir_v2']
    all_containers = filter(
        lambda lw: lw not in MODULE_BLACKLIST,
        db_cmds.list_all_containers())
    # filter out all module and standard labwares from the database
    labware_to_create = filter(
        lambda x: x not in LW_TRANSLATION.keys(),
        all_containers)
    validation_failure = []
    for lw_name in labware_to_create:
        labware = db_cmds.load_container(lw_name)
        if labware.wells():
            log.info(f"Migrating {lw_name} to API v2 format")
            labware_def = create_new_labware_definition(labware, lw_name)
            try:
                save_definition(labware_def, location=path_to_save_defs)
            except jsonschema.exceptions.ValidationError:
                validation_failure.append(lw_name)
                print(f"validation failure on {lw_name}")
        else:
            log.info(f"Skipping migration of {lw_name} because there are no",
                     "wells associated with this labware.")
    log.info("Migration of API V1 labware complete.")
    return True, validation_failure


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
        super().__init__(
            well_props, parent, display_name, has_tip, api_version)
        self._well_name = well_name
        self._parent_height = labware_height

    @property
    def properties(self) -> Dict:
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
    def get_name(self) -> Optional[str]:
        return self._well_name

    @property
    def depth(self) -> float:
        return self._depth

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
            return AttributeError

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

    @log_call(log)
    def load(
            self,
            container_name: str,
            slot: Union[int, str],
            label: str = None,
            share: bool = False) -> LegacyLabware:
        """ Load a piece of labware by specifying its name and position.

        This method calls :py:meth:`.ProtocolContext.load_labware`;
        see that documentation for more information on arguments and return
        values. Calls to this function should be replaced with calls to
        :py:meth:`.Protocolcontext.load_labware`.

        In addition, this function contains translations between old
        labware names and new labware names.
        """
        if self._ctx._deck_layout[slot] and not share:
            raise RuntimeWarning(
                f'Slot {slot} has child. Use "containers.load(\''
                f'{container_name}\', \'{slot}\', share=True)"')
        elif container_name in MODULE_BLACKLIST:
            raise NotImplementedError(
                "Module load not yet implemented")
        try:
            return LegacyLabware(self._ctx.load_labware(
                container_name, slot, label))
        except FileNotFoundError:
            try:
                container_name = LW_TRANSLATION[container_name]
                return LegacyLabware(self._ctx.load_labware(
                    container_name, slot, label))
            except KeyError:
                return LegacyLabware(self._ctx.load_labware(
                    _convert_labware_name(container_name),
                    slot,
                    label,
                    namespace='legacy_api'))

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

        return LegacyLabware(
            Labware(lw_dict, Location(Point(0, 0, 0), 'deck')))

    @log_call(log)
    def list(self, *args, **kwargs):
        return get_all_labware_definitions()
