'''
    ATTENTION: This file was is for loading of json container files.
    It is only being kept so that old json files can be migrated.
'''

# TODO: Delete this file.

import copy
import json
import numbers
import os
import pkg_resources
from collections import OrderedDict
from typing import Dict, Any, List
from opentrons.legacy_api.containers.placeable import Container, Well
from opentrons.config import infer_config_base_dir
from opentrons.util.vector import Vector

persisted_containers_dict: Dict[str, Any] = {}
containers_file_list: List[str] = []

containers_dir_path = pkg_resources.resource_filename(
    'opentrons.config',
    'containers'
)

default_containers_path = os.path.join(
    containers_dir_path,
    'default-containers.json'
)


def load_containers_from_file_list(file_list):
    for file_name in file_list:
        load_containers_from_file_path(file_name)


def load_all_containers_from_disk():
    containers_file_list.clear()
    containers_file_list.extend(
        get_custom_container_files() + [default_containers_path]
    )

    load_containers_from_file_list(
        containers_file_list
    )


# TODO: How should we handle faulty container paths?
def load_containers_from_file_path(file_path):
    with open(file_path) as f:
        persisted_containers_dict.update(json.load(
            f,
            object_pairs_hook=OrderedDict
        ).get('containers', [(None, None)]))


def get_custom_container_files():
    """
    Traverses environment.get_path('CONTAINERS_DIR') to retrieve
    all .json files
    """

    def is_special_file(name):
        return name.startswith('.')

    res = []

    top = infer_config_base_dir()/'containers'
    for root, dirnames, files in os.walk(top):
        for name in filter(is_special_file, dirnames):
            dirnames.remove(name)

        res.extend(
            [
                os.path.join(root, name) for name in files
                if not is_special_file(name) and name.endswith('.json')
            ])

    return res


def get_persisted_container(container_name: str) -> Container:
    container_data = persisted_containers_dict.get(container_name)
    if not container_data:
        raise ValueError(
            'Container type "{}" not found in files: {}'.format(
                container_name, containers_file_list
            )
        )
    return create_container_obj_from_dict(container_data)


def list_container_names():
    c_list = [n for n in persisted_containers_dict.keys()]
    return sorted(c_list, key=lambda s: s.lower())


def load_all_containers():
    containers = []
    for container_name, container_data in persisted_containers_dict.items():
        try:
            containers.append(
                create_container_obj_from_dict(container_data)
            )
        except Exception as e:
            print('Failed to load container: {}'.format(container_name))
            raise e
    return containers


def create_container_obj_from_dict(container_data: dict) -> Container:
    """

    Example input:
    container data for a "24-plate":
    {
         "origin-offset":{
            "x":13.3,
            "y":17.5
         },
         "locations":{
            "A1":{
               "x":0.0,
               "total-liquid-volume":3400,
               "y":0.0,
               "depth":16.2,
               "z":0,
               "diameter":15.62
            },
            "A2":{
               "x":0.0,
               "total-liquid-volume":3400,
               "y":19.3,
               "depth":16.2,
               "z":0,
               "diameter":15.62
            }

    Exampl input #2:
    "trough-12row":

    {
         "locations":{
            "A1":{
               "x":0,
               "y":0,
               "z":0,
               "depth":40,
               "length":8,
               "width":70,
               "total-liquid-volume":22000
            },
            "A2":{
               "x":0,
               "y":9,
               "z":0,
               "depth":40,
               "length":8,
               "width":70,
               "total-liquid-volume":22000
            },
            "A3":{
               "x":0,
               "y":18,
               "z":0,
               "depth":40,
               "length":8,
               "width":70,
               "total-liquid-volume":22000
            }
    """
    container_data = copy.deepcopy(container_data)
    origin_offsets = container_data.get('origin-offset', {})
    origin_offset_x = origin_offsets.get('x', 0)
    origin_offset_y = origin_offsets.get('y', 0)
    origin_offset_z = origin_offsets.get('z', 0)

    container = Container()
    locations = container_data['locations']
    container._coordinates = Vector(
        origin_offset_x,
        origin_offset_y,
        origin_offset_z
    )
    for well_name, well_properties in locations.items():
        x = well_properties.pop('x')
        y = well_properties.pop('y')
        z = well_properties.pop('z')
        assert isinstance(x, numbers.Number)
        assert isinstance(y, numbers.Number)
        assert isinstance(z, numbers.Number)

        well = Well(properties=well_properties)

        # subtract half the size, because
        # Placeable assigns X-Y to bottom-left corner, but
        # persisted container files assign X-Y to center of each Well
        x -= (well.x_size() / 2)
        y -= (well.y_size() / 2)

        well_coordinates = (x, y, z)
        container.add(well, well_name, well_coordinates)
    return container
