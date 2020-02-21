# pylama:ignore=E252
from opentrons.legacy_api.containers.placeable import Well, Container
from opentrons.util.vector import Vector
from numbers import Number
from typing import Tuple

"""
Methods for converting between Well<->json and Container<->json.

Current implementation of json->Container and json->Well based on
`opentrons.data_storage.old_container_loading.create_container_obj_from_dict`
"""


def _json_to_well(
        json_well: dict) -> Tuple[Well, Tuple[Number, Number, Number]]:
    well_properties = json_well.copy()
    x = well_properties.pop('x')
    y = well_properties.pop('y')
    z = well_properties.pop('z')
    assert isinstance(x, Number)
    assert isinstance(y, Number)
    assert isinstance(z, Number)

    well = Well(properties=well_properties)

    well_coordinates = (x, y, z)
    return well, well_coordinates


def json_to_labware(json_defn: dict) -> Container:
    container_data = json_defn.copy()
    container = Container()
    container._coordinates = Vector(0, 0, 0)

    wells = container_data['wells']
    for well_name, json_well in wells.items():
        well, coordinates = _json_to_well(json_well)
        container.add(well, well_name, coordinates)
    container.ordering = json_defn['ordering']

    return container


def _well_to_json(well: Well) -> dict:
    x, y, z = map(lambda num: round(num, 3), well.coordinates())
    well_json = {'x': x, 'y': y, 'z': z}
    well_json.update(well.properties)
    return well_json


def labware_to_json(container: Container, container_name: str=None) -> dict:
    if container_name is None:
        container_name = container.get_name()
    metadata = {'name': container_name}
    wells = {
        well_name: _well_to_json(well)
        for well_name, well in container.children_by_name.items()}
    if container.ordering:
        ordering = container.ordering
    else:
        groups: dict = {}
        for w in wells.keys():
            num = int(w[1:])
            if num in groups.keys():
                groups[num].append(w)
            else:
                groups[num] = [w]
        ordering = [sorted(groups[idx]) for idx in sorted(groups.keys())]

    return {'metadata': metadata, 'wells': wells, 'ordering': ordering}


# Aliases until we get rid of "container" nomenclature
container_to_json = labware_to_json
json_to_container = json_to_labware
