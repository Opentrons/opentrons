import sqlite3
import database_crud_funcs
from opentrons.util.vector import Vector
from opentrons.containers.placeable import Container, Well


#FIXME: This should be centralized or an env variable
database_file = './opentrons_database.db'

#------------- Private Functions -------------#
def _parse_container_obj(container):
    return container._coordinates

def _parse_well_obj(well):
    relative_coords = well._coordinates + well.bottom()[1]
    location, depth = well.get_name(), well.z_size()
    diameter = well.properties.get('diameter', None)
    volume = well.properties.get('total-liquid-volume', None)
    width, length = well.properties['width'], well.properties['length']
    return (location, *relative_coords, depth, volume, diameter, length, width)

def _create_connection(db_file):
    """ create a database connection to the SQLite database
        specified by db_file
    :param db_file: database file
    :return: Connection object or None
    """
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(e)
    return None
#------------ END Private Functions -----------#



#--------------- Public Functions -------------#
def create_container_obj_in_db(db, container, container_name):
    database_crud_funcs.create_container(db, container_name, *_parse_container_obj(container))
    for well in container.wells():
        create_well_obj_in_db(db, container_name, well)

def load_container_object_from_db(container_name):
    db = _create_connection(database_file)
    container_type, *rel_coords = database_crud_funcs.get_container_by_name(db, container_name)
    wells = database_crud_funcs.get_wells_by_container_name(db, container_name)
    container = Container()
    container.properties['type'] = container_type
    container._coordinates = Vector(rel_coords)
    for well in wells:
        container.add(*load_well_object_from_db(well))
    return container

def update_container_object_in_db(db, container, container_name):
    db = _create_connection(database_file)
    database_crud_funcs.update_container(db, container_name, *_parse_container_obj(container))

def create_well_obj_in_db(db, container_name, well):
    well_data = _parse_well_obj()
    database_crud_funcs.insert_well_into_db(db, container_name, *well_data)

#FIXME: This has ugly output because of the way that wells are added to containers. fix this by fixing placeables....
def load_well_object_from_db(well_data):
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

def list_all_container_names():
    return get_all_container_names()
#-------------- END Public Functions -----------#