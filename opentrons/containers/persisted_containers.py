from collections import OrderedDict
import copy
import json
import numbers
import os
import pkg_resources

from opentrons.containers.placeable import Container, Well
from opentrons.util import environment


persisted_containers_dict = {}
persisted_containers_file_list = []


def load_persisted_containers_from_file_list(file_list):
    for file_name in file_list:
        load_persisted_containers_from_file_path(file_name)


def load_all_persisted_containers_from_disk():
    persisted_containers_file_list.clear()
    persisted_containers_file_list.extend(
        [persisted_containers_json_path] + get_custom_container_files()
    )

    load_persisted_containers_from_file_list(
        persisted_containers_file_list
    )


def load_persisted_containers_from_file_path(file_path):
    with open(file_path) as f:
        persisted_containers_dict.update(json.load(
            f,
            object_pairs_hook=OrderedDict
        )['containers'])


containers_dir_path = pkg_resources.resource_filename(
    'opentrons.config',
    'containers'
)

persisted_containers_json_path = os.path.join(
    containers_dir_path,
    'default-containers.json'
)


def get_custom_container_files():
    """
    Traverses environment.get_path('CONTAINERS_DIR') to retrieve
    all .json files
    """
    def is_special_file(name):
        return name.startswith('.')

    res = []

    top = environment.get_path('CONTAINERS_DIR')
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
            ('Container type "{}" not found in files: {}')
            .format(container_name, persisted_containers_file_list)
        )
    return create_container_obj_from_dict(container_data)


def list_container_names():
    c_list = [n for n in persisted_containers_dict.keys()]
    return sorted(c_list, key=lambda s: s.lower())


def load_all_persisted_containers():
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
    origin_offset_x = container_data.get('origin-offset', {}).get('x') or 0
    origin_offset_y = container_data.get('origin-offset', {}).get('y') or 0

    container = Container()
    locations = container_data.get('locations')

    for well_name, well_properties in locations.items():
        x = well_properties.pop('x')
        y = well_properties.pop('y')
        z = well_properties.pop('z')

        # assert 'depth' in well_properties
        # assert 'diameter' in well_properties
        # assert 'length' in well_properties
        # assert 'width' in well_properties
        # assert 'total-liquid-volume' in well_properties
        assert isinstance(x, numbers.Number)
        assert isinstance(y, numbers.Number)
        assert isinstance(z, numbers.Number)

        well = Well(properties=well_properties)

        # subtract half the size, because
        # Placeable assigns X-Y to bottom-left corner, but
        # persisted container files assign X-Y to center of each Well
        x -= (well.x_size() / 2)
        y -= (well.y_size() / 2)

        well_coordinates = (
            x + origin_offset_x,
            y + origin_offset_y,
            z
        )

        container.add(well, well_name, well_coordinates)

    return container


# Load default persisted containers from API distribution
# and whatever containers we find in environment.get_path('CONTAINERS_DIR')
load_all_persisted_containers_from_disk()
