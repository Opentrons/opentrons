import sqlite3

from opentrons.data_storage import database_crud_funcs as db_crud
from opentrons.util import environment
from opentrons.util.vector import Vector
from opentrons.containers.placeable import Container, Well



default_database = environment.get_path('DATABASE_FILE')
db_conn = sqlite3.connect(default_database)


#------------- Private Functions -------------#
def _parse_container_obj(container: Container):
    return container._coordinates

def _parse_well_obj(well: Well):
    relative_coords = well._coordinates + well.bottom()[1]
    location, depth = well.get_name(), well.z_size()
    diameter = well.properties.get('diameter', None)
    volume = well.properties.get('total-liquid-volume', None)
    width, length = well.properties['width'], well.properties['length']
    return (location, *relative_coords, depth, volume, diameter, length, width)

def _create_container_obj_in_db(db, container: Container, container_name: str):
    db_crud.create_container(db, container_name, *_parse_container_obj(container))
    for well in container.wells():
        _create_well_obj_in_db(db, container_name, well)

def _load_container_object_from_db(db, container_name: str):
    container_type, *rel_coords = db_crud.get_container_by_name(db, container_name)
    wells = db_crud.get_wells_by_container_name(db, container_name)
    container = Container()
    container.properties['type'] = container_type
    container._coordinates = Vector(rel_coords)
    for well in wells:
        container.add(*_load_well_object_from_db(db, well))
    return container

def _update_container_object_in_db(db, container: Container):
    db_crud.update_container(db, container.get_type(), *_parse_container_obj(container))

def _create_well_obj_in_db(db, container_name: str, well: Well):
    well_data = _parse_well_obj(well)
    db_crud.insert_well_into_db(db, container_name, *well_data)

#FIXME: This has ugly output because of the way that wells are added to containers. fix this by fixing placeables....
def _load_well_object_from_db(db, well_data):
    container_name, location, x,y, z, depth, volume, diameter, length, width = well_data
    props = zip(['depth', 'total-liquid-volume','diameter','length','width'],
                [depth, volume, diameter, length, width])
    property_dict = {k: v for k,v in props if v}
    well = Well(properties = property_dict)
    # subtract half the size, because
    # Placeable assigns X-Y to bottom-left corner, but db assigns X-Y to well center
    x -= (well.x_size() / 2)
    y -= (well.y_size() / 2)
    well_coordinates = (x, y, z)
    return (well, location, well_coordinates)

def _list_all_containers_by_name(db):
    clean_list = [container for container, in db_crud.get_all_container_names(db)]
    return clean_list
#------------ END Private Functions -----------#


#--------------- Public Functions -------------#
def save_new_container(container: Container, container_name: str):
    return _create_container_obj_in_db(db_conn, container, container_name)

def load_container(container_name: str):
    return _load_container_object_from_db(db_conn, container_name)

def overwrite_container(container: Container):
    return _update_container_object_in_db(db_conn, container)

def list_all_containers():
    return _list_all_containers_by_name(db_conn)

def change_database(db_path: str):
    global db_conn
    new_db = sqlite3.connect(db_path)
    db_conn.close()
    db_conn = new_db

#-------------- END Public Functions -----------#