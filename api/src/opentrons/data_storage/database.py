# pylama:ignore=E252
import sqlite3
# import warnings
from typing import List
from opentrons.legacy_api.containers.placeable\
    import Container, Well, Module, Placeable
from opentrons.data_storage import database_queries as db_queries
from opentrons.util.vector import Vector
from opentrons.config import CONFIG
import logging
import os

SUPPORTED_MODULES = ['magdeck', 'tempdeck']

log = logging.getLogger(__file__)

# ======================== Private Functions ======================== #


def _parse_container_obj(container: Container):
    # Note: in the new labware system, container coordinates are always (0,0,0)
    return dict(zip('xyz', container._coordinates))


def _parse_well_obj(well: Well):
    r_x, r_y, r_z = well._coordinates + well.bottom()[1]
    location, depth = well.get_name(), well.z_size()
    diameter = well.properties.get('diameter', None)
    volume = well.properties.get('total-liquid-volume', None)
    width, length = well.properties['width'], well.properties['length']
    return {
        'location': location,
        'x': r_x,
        'y': r_y,
        'z': r_z,
        'depth': depth,
        'volume': volume,
        'diameter': diameter,
        'length': length,
        'width': width
    }


def _create_container_obj_in_db(db, container: Container, container_name: str):
    db_queries.create_container(
        db, container_name, **_parse_container_obj(container)
    )

    well_data = (_parse_well_obj(well) for well in iter(container))
    well_rows = (db_queries.WellRow(container_name=container_name, **w)
                 for w in well_data)
    db_queries.insert_wells_into_db(db, well_rows)


def _load_container_object_from_db(db, container_name: str):
    db_data = db_queries.get_container_by_name(db, container_name)
    if not db_data:
        raise ValueError(
            "No container with name {} found in Containers database"
            .format(container_name)
        )

    container_type, *rel_coords = db_data
    wells = db_queries.get_wells_by_container_name(db, container_name)
    if not wells:
        raise ResourceWarning(
            "No wells for container {} found in ContainerWells database"
            .format(container_name)
        )

    if container_name in SUPPORTED_MODULES:
        container: Placeable = Module()
    else:
        container = Container()

    container.properties['type'] = container_type
    container._coordinates = Vector(rel_coords)
    log.debug("Loading {} with coords {}".format(rel_coords, container_type))
    for well in wells:
        container.add(*_load_well_object_from_db(db, well))
    return container


def _update_container_object_in_db(db, container: Container):
    coords = _parse_container_obj(container)
    log.debug("Updating {} with coordinates {}".format(
        container.get_type(), coords))
    db_queries.update_container(
        db,
        container.get_type(),
        **coords
    )


def _delete_container_object_in_db(db, container_name: str):
    db_queries.delete_wells_by_container_name(db, container_name)
    db_queries.delete_container(db, container_name)


def _create_well_obj_in_db(db, container_name: str, well: Well):
    well_data = _parse_well_obj(well)
    db_queries.insert_well_into_db(
        db_conn=db,
        well=db_queries.WellRow(container_name=container_name, **well_data)
    )


def _load_well_object_from_db(db, well_data):
    container_name, location, x, y, z, \
        depth, volume, diameter, length, width = well_data

    props = zip(['depth', 'total-liquid-volume',
                 'diameter', 'length', 'width'],
                [depth, volume, diameter, length, width])
    property_dict = {k: v for k, v in props if v}
    well = Well(properties=property_dict)
    # subtract half the size, because
    # Placeable assigns X-Y to bottom-left corner,
    # but db assigns X-Y to well center
    x -= (well.x_size() / 2)
    y -= (well.y_size() / 2)
    well_coordinates = (x, y, z)
    return (well, location, well_coordinates)


def _list_all_containers_by_name(db):
    clean_list = [container for container,
                  in db_queries.get_all_container_names(db)]
    return clean_list


def _load_module_dict_from_db(db, module_name):
    db_data = db_queries.get_container_by_name(db, module_name)
    if not db_data:
        raise ValueError(
            "No module with name {} found in Containers database table"
            .format(module_name)
        )
    _, *rel_coords = db_data
    return rel_coords


def _get_db_version(db):
    version = db_queries.get_user_version(db)[0]
    return version

# ======================== END Private Functions ======================== #


# ======================== Public Functions ======================== #
def save_new_container(container: Container, container_name: str) -> bool:
    db_conn = sqlite3.connect(str(CONFIG['labware_database_file']))
    _create_container_obj_in_db(db_conn, container, container_name)
    res = True  # old create fn does not return anything
    return res


def load_container(container_name: str) -> Container:
    db_conn = sqlite3.connect(str(CONFIG['labware_database_file']))
    res = _load_container_object_from_db(db_conn, container_name)
    return res


def overwrite_container(container: Container) -> bool:
    log.debug("Overwriting container definition: {}".format(
        container.get_type()))
    db_conn = sqlite3.connect(str(CONFIG['labware_database_file']))
    _update_container_object_in_db(db_conn, container)
    res = True  # old overwrite fn does not return anything
    return res


def delete_container(container_name) -> bool:
    db_conn = sqlite3.connect(str(CONFIG['labware_database_file']))
    _delete_container_object_in_db(db_conn, container_name)
    res = True  # old delete fn does not return anything
    return res


def list_all_containers() -> List[str]:
    db_conn = sqlite3.connect(str(CONFIG['labware_database_file']))
    res = _list_all_containers_by_name(db_conn)
    return res


def load_module(module_name: str) -> Container:
    db_conn = sqlite3.connect(str(CONFIG['labware_database_file']))
    res = _load_module_dict_from_db(db_conn, module_name)
    return res


def get_version():
    '''Get the Opentrons-defined database version'''
    db_conn = sqlite3.connect(str(CONFIG['labware_database_file']))
    return _get_db_version(db_conn)


def set_version(version):
    db_conn = sqlite3.connect(str(CONFIG['labware_database_file']))
    db_queries.set_user_version(db_conn, version)


def reset():
    """ Unmount and remove the sqlite database (used in robot reset) """
    if os.path.exists(str(CONFIG['labware_database_file'])):
        os.remove(str(CONFIG['labware_database_file']))
    # Not an os.path.join because it is a suffix to the full filename
    journal_path = str(CONFIG['labware_database_file']) + '-journal'
    if os.path.exists(journal_path):
        os.remove(journal_path)

# ======================== END Public Functions ======================== #
