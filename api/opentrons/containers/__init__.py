from collections import OrderedDict
import json
import os
import warnings

from opentrons.data_storage import database
from opentrons.containers.placeable import (
    Deck,
    Slot,
    Container,
    Well,
    WellSeries,
    unpack_location,
    get_container
)
from opentrons.containers.calibrator import apply_calibration
from opentrons.helpers import helpers
from opentrons.util import environment

__all__ = [
    Deck,
    Slot,
    Container,
    Well,
    WellSeries,
    unpack_location,
    apply_calibration,
    get_container]


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
        return isinstance(s, str) and len(s) is 2 and s[0] in 'ABCD'

    def convert_ot_one_slot_names(s):
        col = 'ABCD'.index(slot[0])
        row = int(slot[1]) - 1
        slot_number = col + (row * robot.get_max_robot_cols()) + 1
        warnings.warn('Changing deprecated slot name "{}" to "{}"'.format(
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


def create(name, grid, spacing, diameter, depth, volume=0, save=False):
    columns, rows = grid
    col_spacing, row_spacing = spacing
    custom_container = Container()
    properties = {
        'type': 'custom',
        'diameter': diameter,
        'height': depth,
        'total-liquid-volume': volume
    }

    for r in range(rows):
        for c in range(columns):
            well = Well(properties=properties)
            well_name = chr(c + ord('A')) + str(1 + r)
            coordinates = (c * col_spacing, r * row_spacing, 0)
            custom_container.add(well, well_name, coordinates)
    if save:
        database.save_new_container(custom_container, name)
    return custom_container


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
    container_file_path = environment.get_path('CONTAINERS_FILE')
    if not os.path.isfile(container_file_path):
        with open(container_file_path, 'w') as f:
            f.write(json.dumps({'containers': {}}))
    with open(container_file_path, 'r+') as f:
        old_data = json.load(f)
        old_data['containers'].update(data)
        f.seek(0)
        f.write(json.dumps(old_data, indent=4))
        f.truncate()
