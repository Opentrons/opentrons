import os
import json
import pkg_resources


from opentrons_sdk.containers.container import (
    Container,
    Deck,
    Slot,
    Well
)


containers_dir_path = pkg_resources.resource_filename(
    'opentrons_sdk.config',
    'containers'
)
legacy_containers_json_path = os.path.join(
    containers_dir_path,
    'legacy_containers.json'
)

legacy_containers_dict = json.load(open(legacy_containers_json_path))


def get_legacy_container(container_name : str) -> Container:
    container_data = legacy_containers_dict.get(container_name)
    if not container_data:
        return Exception(
            'Legacy container "{}" does not exist'.format(container_name)
        )

    return create_container_obj_from_dict(container_data)


def create_container_obj_from_dict(container_data : dict) -> (str, Container):
    """
    "24-plate":{
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
    """

    name = list(container_data.keys())[0]
    origin_offset_x = container_data.get('origin-offset', {}).get('x') or 0
    origin_offset_y = container_data.get('origin-offset', {}).get('y') or 0

    container = Container()

    locations = container_data.get('locations')

    for well_name, well_properties in locations.items():
        x = well_properties.pop('x')
        y = well_properties.pop('y')
        z = well_properties.pop('z')

        assert (
            'depth' in well_properties &&
            'total-liquid-volume' in well_properties &&
            'diameter' in well_properties &&
        )
        assert isinstance(x, int) && isinstance(y, int) && isinstance(z, int)

        well = Well(properties=well_properties)

        well_coordinates = (
            x + origin_offset_x,
            y + origin_offset_y,
            z
        )
        container.add(well, well_name, well_coordinates)

    return (name, Container())
