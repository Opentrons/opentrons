import logging
from typing import Any, Dict

from opentrons.data_storage import database as db_cmds
from opentrons.protocol_api.labware import save_definition
from opentrons.config import CONFIG
from opentrons.legacy_api.containers.placeable import Container, Well

from .util import log_call

log = logging.getLogger(__name__)


LW_NO_EQUIVALENT = {'24-vial-rack', '48-vial-plate', '5ml-3x4',
                    '96-well-plate-20mm', 'MALDI-plate',
                    'T25-flask', 'T75-flask', 'e-gelgol',
                    'hampton-1ml-deep-block', 'point',
                    'rigaku-compact-crystallization-plate',
                    'small_vial_rack_16x45', 'temperature-plate',
                    'tiprack-10ul-H', 'trough-12row-short',
                    'trough-1row-25ml', 'trough-1row-test',
                    'tube-rack-2ml-9x9', 'tube-rack-5ml-96',
                    'tube-rack-80well', 'wheaton_vial_rack'}
""" Labwares that are no longer supported in this version """

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


def _format_labware_definition(labware: Container, labware_name: str)\
        -> Dict[str, Any]:
    lw_dict: Dict[str, Any] = {}
    converted_labware_name = labware_name.replace("-", "_")
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

    wells, first_well = _determine_well_names(labware)

    # Labware Information
    lw_dict['groups'] = [{
        'wells': wells,
        'metadata': {}}]
    lw_dict['parameters'] = {
        'format': 'irregular',
        'isMagneticModuleCompatible': False,
        'loadName': converted_labware_name,
        'isTiprack': is_tiprack}
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

    return lw_dict


def create_new_labware_definition(labware: Container, labware_name: str):
    lw_dict = _format_labware_definition(labware, labware_name)
    # Well Information
    lw_dict['wells'] = {}
    for well in labware.wells():
        well_props = well.properties
        well_coords = well._coordinates
        well_name = well.get_name()
        lw_dict['wells'][well_name] = {
            'x': well_coords['x'],
            'y': well_coords['y'],
            'z': well_coords['z'],
            'totalLiquidVolume': well_props.get('total-liquid-volume', 0),
            'depth': well_props.get('depth', 0)}
        if well_props.get('diameter'):
            lw_dict['wells'][well_name]['diameter'] =\
                well.properties.get('diameter')
            lw_dict['wells'][well_name]['shape'] = 'circular'
        else:
            lw_dict['wells'][well_name]['xDimension'] =\
                well.properties.get('length')
            lw_dict['wells'][well_name]['yDimension'] =\
                well.properties.get('width')
            lw_dict['wells'][well_name]['shape'] = 'rectangular'
    return lw_dict


def perform_migration():
    path_to_save_defs = CONFIG['labware_user_definitions_dir_v2']

    all_containers = filter(
        lambda lw: lw not in MODULE_BLACKLIST,
        db_cmds.list_all_containers())
    labware_to_create = filter(
        lambda x: x not in LW_TRANSLATION.keys(),
        all_containers)

    for lw_name in labware_to_create:
        log.debug(f"Migrating {lw_name} to API v2 format")
        labware = db_cmds.load_container(lw_name)
        if labware.wells():
            labware_def = create_new_labware_definition(labware, lw_name)
            save_definition(labware_def, location=path_to_save_defs)
    log.info("Migration of API V1 labware complete.")
    return True


@log_call(log)
def load(robot, container_name, slot, label=None, share=False):
    """
    Examples
    --------
    >>> from opentrons import containers
    >>> containers.load('96-flat', '1')
    <Deck>/<Slot 1>/<Container 96-flat>
    >>> containers.load('96-flat', '4', 'plate')
    <Deck>/<Slot 4>/<Container plate>
    >>> containers.load('non-existent-type', '4') # doctest: +ELLIPSIS
    Exception: Container type "non-existent-type" not found in file ...
    """
    return None


@log_call(log)
def list():
    return []


@log_call(log)
def create(name, grid, spacing, diameter, depth, volume=0):
    """
    Creates a labware definition based on a rectangular gird, depth, diameter,
    and spacing. Note that this function can only create labware with regularly
    spaced wells in a rectangular format, of equal height, depth, and radius.
    Irregular labware defintions will have to be made in other ways or modified
    using a regular definition as a starting point. Also, upon creation a
    definition always has its lower-left well at (0, 0, 0), such that this
    labware _must_ be calibrated before use.

    :param name: the name of the labware to be used with `labware.load`
    :param grid: a 2-tuple of integers representing (<n_columns>, <n_rows>)
    :param spacing: a 2-tuple of floats representing
        (<col_spacing, <row_spacing)
    :param diameter: a float representing the internal diameter of each well
    :param depth: a float representing the distance from the top of each well
        to the internal bottom of the same well
    :param volume: [optional] the maximum volume of each well
    :return: the labware object created by this function
    """
    return None
