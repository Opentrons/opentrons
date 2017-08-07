from collections import OrderedDict
import json
import os

from opentrons.containers.persisted_containers import get_persisted_container
from opentrons.containers import persisted_containers
from opentrons.containers.placeable import (
    Deck,
    Slot,
    Container,
    Well,
    WellSeries,
    unpack_location
)
from opentrons.containers.calibrator import apply_calibration
from opentrons.util import environment

__all__ = [
    get_persisted_container,
    Deck,
    Slot,
    Container,
    Well,
    WellSeries,
    unpack_location,
    apply_calibration]


def load(robot, container_name, slot, label=None):
    """
    Examples
    --------
    >>> from opentrons import containers
    >>> containers.load('96-flat', 'A1')
    <Deck>/<Slot A1>/<Container 96-flat>
    >>> containers.load('96-flat', 'A2', 'plate')
    <Deck>/<Slot A2>/<Container plate>
    >>> containers.load('non-existent-type', 'A2') # doctest: +ELLIPSIS
    Exception: Container type "non-existent-type" not found in file ...
    """
    if not label:
        label = container_name
    return robot.add_container(container_name, slot, label)


def list():
    return persisted_containers.list_container_names()


def create(name, grid, spacing, diameter, depth, volume=0):
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
    json_container = container_to_json(custom_container, name)
    save_custom_container(json_container)
    persisted_containers.load_all_persisted_containers_from_disk()


def container_to_json(c, name):
    locations = []
    for w in c:
        x, y, z = w.coordinates()
        locations.append((
            w.get_name(),
            {
                'x': x, 'y': y, 'z': z,
                'depth': w.z_size(),
                'diameter': w.x_size(),
                'total-liquid-volume': w.max_volume()
            }
        ))
    return {name: {'locations': OrderedDict(locations)}}


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
