from collections import OrderedDict
import itertools
import logging
import json
from opentrons.config import CONFIG
from opentrons.data_storage import database
from opentrons.util.vector import Vector
from opentrons.types import Point
from .placeable import (
    Deck,
    Slot,
    Container,
    Well,
    WellSeries,
    unpack_location,
    location_to_list,
    get_container
)
from opentrons.helpers import helpers

from opentrons.protocol_api import labware as new_labware

__all__ = [
    'Deck',
    'Slot',
    'Container',
    'Well',
    'WellSeries',
    'unpack_location',
    'location_to_list',
    'get_container']

log = logging.getLogger(__name__)


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

    # OT-One users specify columns in the A1, B3 fashion
    # below methods help convert to the 1, 2, etc integer names
    def is_ot_one_slot_name(s):
        return isinstance(s, str) and len(s) == 2 and s[0] in 'ABCD'

    def convert_ot_one_slot_names(s):
        col = 'ABCD'.index(slot[0])
        row = int(slot[1]) - 1
        slot_number = col + (row * robot.get_max_robot_cols()) + 1
        log.warning('Changing deprecated slot name "{}" to "{}"'.format(
            slot, slot_number))
        return slot_number

    if isinstance(slot, str):
        # convert to integer
        try:
            slot = int(slot)
        except (ValueError, TypeError):
            if is_ot_one_slot_name(slot):
                slot = convert_ot_one_slot_names(slot)

    if helpers.is_number(slot):
        # test that it is within correct range
        if not (1 <= slot <= len(robot.deck)):
            raise ValueError('Unknown slot: {}'.format(slot))
        slot = str(slot)

    return robot.add_container(container_name, slot, label, share)


def list():
    return database.list_all_containers()


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
    columns, rows = grid
    col_spacing, row_spacing = spacing
    custom_container = Container()
    properties = {
        'type': 'custom',
        'diameter': diameter,
        'height': depth,
        'total-liquid-volume': volume
    }

    for c in range(columns):
        for r in range(rows):
            well = Well(properties=properties)
            well_name = chr(r + ord('A')) + str(1 + c)
            coordinates = (c * col_spacing, (rows - r - 1) * row_spacing, 0)
            custom_container.add(well, well_name, coordinates)
    database.save_new_container(custom_container, name)
    return database.load_container(name)


# FIXME: [Jared - 8/31/17] This is not clean
# fix it by using the same reference points
# in saved containers and Container/Well objects
def container_to_json(container, name):
    locations = []
    for w in container:
        x, y, z = w._coordinates + w.bottom()[1]
        properties_dict = {
            'x': x, 'y': y, 'z': z,
            'depth': w.z_size(),
            'total-liquid-volume': w.max_volume()
        }
        if w.properties.get('diameter') is not None:
            properties_dict.update({'diameter': w.properties['diameter']})
        else:
            properties_dict.update({'width': w.properties['width'],
                                    'length': w.properties['length']})
        locations.append((
            w.get_name(),
            properties_dict

        ))
    return {name: {'origin-offset': dict(zip('xyz', container._coordinates)),
                   'locations': OrderedDict(locations)}}


def save_custom_container(data):
    raise RuntimeError(
        "This method is deprecated and should not be used. To save a custom"
        "labware, please use opentrons.containers.create()")


def _load_new_well(well_data, saved_offset, lw_format):
    # There are two key hacks in here to make troughs work:
    # - do not specify the size of the well
    # - specify the center without subtracting the size (since
    #   the size is 0) in x, and _add_ 7/16 of the size in y
    #   so that the nominal center leaves the nozzle centered in
    #   an imaginary well instead of centering itself over the
    #   top wall of the trough.
    props = {
        'depth': well_data['depth'],
        'total-liquid-volume': well_data['totalLiquidVolume'],
    }
    if well_data['shape'] == 'circular':
        props['diameter'] = well_data['diameter']
    elif well_data['shape'] == 'rectangular':
        if lw_format != 'trough':
            props['length'] = well_data['yDimension']
            props['width'] = well_data['xDimension']
    else:
        raise ValueError(
            f"Bad definition for well shape: {well_data['shape']}")
    well = Well(properties=props)

    if lw_format == 'trough':
        well_tuple = (
            well_data['x'] + saved_offset.x,
            well_data['y'] + 7*well_data['yDimension']/16 + saved_offset.y,
            well_data['z'] + saved_offset.z)
    else:
        well_tuple = (
            well_data['x'] - well.x_size()/2 + saved_offset.x,
            well_data['y'] - well.y_size()/2 + saved_offset.y,
            well_data['z'] + saved_offset.z)
    return (well, well_tuple)


def _look_up_offsets(labware_hash):
    calibration_path = CONFIG['labware_calibration_offsets_dir_v4']
    labware_offset_path = calibration_path/'{}.json'.format(labware_hash)
    if labware_offset_path.exists():
        calibration_data = new_labware._read_file(str(labware_offset_path))
        offset_array = calibration_data['default']['offset']
        return Point(x=offset_array[0], y=offset_array[1], z=offset_array[2])
    else:
        return Point(x=0, y=0, z=0)


def save_new_offsets(labware_hash, delta):
    calibration_path = CONFIG['labware_calibration_offsets_dir_v4']
    if not calibration_path.exists():
        calibration_path.mkdir(parents=True, exist_ok=True)
    labware_offset_path = calibration_path/'{}.json'.format(labware_hash)
    calibration_data = new_labware._helper_offset_data_format(
        str(labware_offset_path), delta)
    with labware_offset_path.open('w') as f:
        json.dump(calibration_data, f)


def load_new_labware(container_name):
    """ Load a labware in the new schema into a placeable, by name

    :raises KeyError: If the labware name is not found
    """
    defn = new_labware.get_labware_definition(load_name=container_name)
    return load_new_labware_def(defn)


def load_new_labware_def(definition):
    """ Load a labware definition in the new schema into a placeable
    """
    labware_hash = new_labware._hash_labware_def(definition)
    saved_offset = _look_up_offsets(labware_hash)
    container = Container()
    container_name = definition['parameters']['loadName']
    log.info(f"Container name {container_name}, hash {labware_hash}")
    container.properties['labware_hash'] = labware_hash
    container.properties['type'] = container_name
    lw_format = definition['parameters']['format']

    container._coordinates = Vector(definition['cornerOffsetFromSlot'])
    for well_name in itertools.chain(*definition['ordering']):
        well_obj, well_pos = _load_new_well(
            definition['wells'][well_name], saved_offset, lw_format)
        container.add(well_obj, well_name, well_pos)
    return container
