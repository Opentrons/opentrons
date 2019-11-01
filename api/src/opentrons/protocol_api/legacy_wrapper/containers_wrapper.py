import functools
import inspect
import logging
from typing import Any, Dict

import jsonschema  # type: ignore

from opentrons.data_storage import database as db_cmds
from opentrons.protocol_api.labware import save_definition
from opentrons.config import CONFIG
from opentrons.legacy_api.containers.placeable import Container, Well

from .util import log_call, decorator_maker
from opentrons import types
from opentrons.protocol_api import labware as lw
# from opentrons.protocol_api.contexts import ProtocolContext
from typing import List, Union, Callable, Dict

log = logging.getLogger(__name__)

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


def _determine_well_names(labware: Container):
    # In the instance that the labware only contains one well, we must
    # not index labware.wells() as it is not contained inside a WellSeries
    if isinstance(labware.wells(), Well):
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


def _convert_labware_name(labware_name: str) -> str:
    return labware_name.replace("-", "_").lower()


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
    return lw_dict


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
    lw_dict = _format_labware_definition(labware_name, labware)
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


# class Containers():
#     def __init__(self,
#                  protocol_ctx: ProtocolContext):
#         self._ctx = protocol_ctx
#
#     @log_call(log)
#     def load(self,
#              container_name: str,
#              slot: types.DeckLocation,
#              label: str = None,
#              share: bool = False):
#         """
#         Examples
#         --------
#         >>> from opentrons import containers
#         >>> containers.load('96-flat', '1')
#         <Deck>/<Slot 1>/<Container 96-flat>
#         >>> containers.load('96-flat', '4', 'plate')
#         <Deck>/<Slot 4>/<Container plate>
#         >>> containers.load('non-existent-type', '4') # doctest: +ELLIPSIS
#         Exception: Container type "non-existent-type" not found in file ...
#         """
#         if self._ctx._deck_layout[slot] and not share:
#             raise RuntimeWarning(
#                 f'Slot {slot} has child. Use "containers.load(\''
#                 f'{container_name}\', \'{slot}\', share=True)"')
#
#         try:
#             return self._ctx.load_labware(
#                 container_name, slot, label, legacy=True)
#         except FileNotFoundError:
#             container_name = container_name.replace('-', '_')
#             return self._ctx.load_labware(
#                 container_name,
#                 slot,
#                 label,
#                 namespace='legacy_api',
#                 legacy=True)
#
#     @log_call(log)
#     def list(self):
#         return lw.get_all_labware_definitions()
#
#     @log_call(log)
#     def create(self, name, grid, spacing, diameter, depth, volume=0):
#         """
#         Creates a labware definition based on a rectangular gird, depth,
#         diameter, and spacing. Note that this function can only create labware
#         with regularly spaced wells in a rectangular format, of equal height,
#         depth, and radius. Irregular labware defintions will have to be made in
#         other ways or modified using a regular definition as a starting point.
#         Also, upon creation a definition always has its lower-left well at
#         (0, 0, 0), such that this labware _must_ be calibrated before use.
#
#         :param name: the name of the labware to be used with `labware.load`
#         :param grid: a 2-tuple of integers representing (<n_columns>, <n_rows>)
#         :param spacing: a 2-tuple of floats representing
#             (<col_spacing, <row_spacing)
#         :param diameter: a float representing the internal diameter of each
#             well
#         :param depth: a float representing the distance from the top of each
#             well to the internal bottom of the same well
#         :param volume: [optional] the maximum volume of each well
#         :return: the labware object created by this function
#         """
#         return None



# def determine_signature_1(f, *args):
#
#     @functools.wraps(determine_signature_1)
#     def _decorator(f: Callable) -> Callable:
#
#         if args:
#             @functools.wraps(f)
#             def _wrapper(*args):
#                 return f(*args)
#         return _wrapper
#
#     return _decorator
#
#
# def determine_signature_2(f, *args):
#
#     @functools.wraps(determine_signature_2)
#     def _decorator(f: Callable) -> Callable:
#
#         if not args:
#             @functools.wraps(f)
#             def _wrapper():
#                 return f()
#         return _wrapper
#
#     return _decorator


class LegacyLabware(lw.Labware):
    def __init__(self, definition: dict,
                 parent: types.Location, label: str = None) -> None:
        super().__init__(definition, parent)
        self._wells_by_index = super().wells()
        self._wells_by_name = super().wells_by_name()
        self._columns = super().columns()
        self._rows = super().rows()
        self._properties = {
            'length': self.dimensions['xDimension'],
            'width': self.dimensions['yDimension'],
            'height': self.dimensions['zDimension'],
            'type': self.display_name,
            'magdeck_engage_height': self.magdeck_engage_height
            }

    def get_index_by_name(self, name):
        """
        Retrieves child's name by index
        """
        return self._wells_by_index.index(self._wells_by_name[name])

    def get_wells_by_xy(self, **kwargs) -> Union[lw.Well, List[lw.Well]]:
        x = kwargs.get('x', None)
        y = kwargs.get('y', None)
        if x is None and isinstance(y, int):
            return self._rows[y]
        elif y is None and isinstance(x, int):
            return self._columns[x]
        elif isinstance(x, int) and isinstance(y, int):
            return self._columns[x][y]
        else:
            raise ValueError('Labware.wells(x=, y=) expects ints')

    def get_wells_by_to_and_length(self, *args, **kwargs):
        start = args[0] if len(args) else 0
        stop = kwargs.get('to', None)
        step = kwargs.get('step', 1)
        length = kwargs.get('length', 1)

        if isinstance(start, str):
            start = self.get_index_by_name(start)
        if not stop:
            indices = slice(start, length + start, step)
        else:
            if isinstance(stop, str):
                stop = self.get_index_by_name(stop)
            indices = slice(start, stop, step)
        return self._wells_by_index[indices]

    @property
    def properties(self) -> Dict:
        return self._properties

    # def __call__(self, *args, **kwargs):
    #     """
    #     Passes all arguments to Wells() and returns result
    #     """
    #     return self.wells(*args, **kwargs)
    #
    # def __getitem__(self, name: Union[str, int, slice]):
    #     if isinstance(name, int) or isinstance(name, str):
    #         return self.wells(name)
    #     elif isinstance(name, slice):
    #         return self.wells()[slice]
    #     else:
    #         raise TypeError('Expected int, slice, or str, got '
    #                         f'{type(name)} instead')
    #
    def get_well_by_type(
            self,
            well: Union[int, str, slice]) -> Union[List[lw.Well], lw.Well]:
        if isinstance(well, int):
            return self._wells_by_index[well]
        elif isinstance(well, str):
            return self._wells_by_name[well]
        else:
            raise TypeError(f"Type {type(well)} is not compatible.")

    @staticmethod
    @decorator_maker
    def wells(*args,
              **kwargs) -> List[Union[List[lw.Well], lw.Well]]:
        """
        Returns child Well or list of child Wells
        """
        if not kwargs:
            if not args:
                return self._wells_by_index
            elif len(args) == 1:
                return self.get_well_by_type(args[0])
            else:
                new_wells = []
                for arg in args:
                    if isinstance(arg, List):
                        for item in arg:
                            new_wells.append(self.get_well_by_type(item))
                    else:
                        new_wells.append(self.get_well_by_type(arg))
                return new_wells
        else:
            if 'x' in kwargs or 'y' in kwargs:
                return self.get_wells_by_xy(**kwargs)
            else:
                return self.get_wells_by_to_and_length(*args, **kwargs)

    # @property
    # def wells(self):
    #     return self._wells_by_index

    def well(self, name: str) -> lw.Well:
        """
        Returns well by :name:
        """
        return super().__getitem__(name)

    @decorator_maker
    def columns(self, *args):
        if len(args) == 1:
            return super().columns(*args)[0]
        else:
            return super().columns(*args)

    def cols(self, *args):
        return self.columns(*args)

    def rows(self, *args):
        if len(args) == 1:
            return super().rows(*args)[0]
        else:
            return super().rows(*args)
