from opentrons.containers.placeable import Well, Container
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

    # subtract half the size, because
    # Placeable assigns X-Y to bottom-left corner, but
    # persisted container files assign X-Y to center of each Well
    x -= (well.x_size() / 2)
    y -= (well.y_size() / 2)

    well_coordinates = (x, y, z)
    return well, well_coordinates


# check equivalence of Container from this method with prior
def json_to_container(json_defn: dict) -> Container:
    container_data = json_defn.copy()
    container = Container()
    container._coordinates = Vector(0, 0, 0)

    wells = container_data.get('wells')
    for well_name, json_well in wells.items():
        well, coordinates = _json_to_well(json_well)
        container.add(well, well_name, coordinates)

    return container


def _well_to_json(well: Well) -> dict:
    # Placeable does some weird stuff w/ xyz. Probably need to reverse the
    # effect of the well.x_size and well.y_size modification made on load.
    # Check.
    x, y, z = well.coordinates()
    x += (well.x_size() * 2)
    y += (well.y_size() * 2)
    well_json = {'x': x, 'y': y, 'z': z}
    well_json.update(well.properties)
    return well_json


# TODO (ben 20180207): rename everything to "labware"
# check round-trip
def container_to_json(container: Container) -> dict:
    metadata = {'name': container.get_name()}
    wells = {
        well_name: _well_to_json(well)
        for well_name, well in container.children_by_name.items()}
    groups = {}
    for w in wells.keys():
        num = int(w[1:])
        if num in groups.keys():
            groups[num].append(w)
        else:
            groups[num] = [w]

    ordering = [sorted(groups[idx]) for idx in sorted(groups.keys())]
    return {'metadata': metadata, 'wells': wells, 'ordering': ordering}
