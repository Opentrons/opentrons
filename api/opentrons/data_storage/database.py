import sqlite3
from opentrons.containers.placeable import Container, Well
from opentrons.data_storage import database_queries as db_queries
from opentrons.util import environment
from opentrons.util.vector import Vector

database_path = environment.get_path('DATABASE_FILE')

# ======================== Private Functions ======================== #


def _parse_container_obj(container: Container):
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
    for well in iter(container):
        _create_well_obj_in_db(db, container_name, well)


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

    container = Container()
    container.properties['type'] = container_type
    container._coordinates = Vector(rel_coords)
    for well in wells:
        container.add(*_load_well_object_from_db(db, well))
    return container


def _update_container_object_in_db(db, container: Container):
    db_queries.update_container(
        db,
        container.get_type(),
        **_parse_container_obj(container)
    )


def _delete_container_object_in_db(db, container_name: str):
    db_queries.delete_wells_by_container_name(db, container_name)
    db_queries.delete_container(db, container_name)


def _create_well_obj_in_db(db, container_name: str, well: Well):
    well_data = _parse_well_obj(well)
    db_queries.insert_well_into_db(
        db_conn=db, container_name=container_name, **well_data
    )


# FIXME: This has ugly output because of the way that
# wells are added to containers. fix this by fixing placeables....
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


def _get_db_version(db):
    version = db_queries.get_user_version(db)[0]
    return version

# ======================== END Private Functions ======================== #


# ======================== Public Functions ======================== #
def save_new_container(container: Container, container_name: str):
    db_conn = sqlite3.connect(database_path)
    return _create_container_obj_in_db(db_conn, container, container_name)


def load_container(container_name: str):
    db_conn = sqlite3.connect(database_path)
    return _load_container_object_from_db(db_conn, container_name)


def overwrite_container(container: Container):
    db_conn = sqlite3.connect(database_path)
    return _update_container_object_in_db(db_conn, container)


def delete_container(container_name):
    db_conn = sqlite3.connect(database_path)
    return _delete_container_object_in_db(db_conn, container_name)


def list_all_containers():
    db_conn = sqlite3.connect(database_path)
    return _list_all_containers_by_name(db_conn)


def change_database(db_path: str):
    global database_path
    database_path = db_path


def get_version():
    '''Get the Opentrons-defined database version'''
    db_conn = sqlite3.connect(database_path)
    return _get_db_version(db_conn)


def set_version(version):
    db_conn = sqlite3.connect(database_path)
    db_queries.set_user_version(db_conn, version)

# ======================== END Public Functions ======================== #
