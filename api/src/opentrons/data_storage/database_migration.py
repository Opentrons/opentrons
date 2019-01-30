import sqlite3
from opentrons.data_storage import database
from opentrons.data_storage.old_container_loading import \
    load_all_containers_from_disk, \
    list_container_names, \
    get_persisted_container
from opentrons.config import CONFIG
from opentrons.data_storage.schema_changes import \
    create_table_ContainerWells, create_table_Containers
from opentrons.util.vector import Vector


def transpose_coordinates(wells):
    # Calculate XY coordinates based on width of container
    # TODO (Laura 7/27/2018): This only works for SBS footprint containers.
    # Will need to be changed once correct geometry system implemented
    w = 85.48
    for well in wells:
        old_x, old_y, z = well._coordinates
        offset_y = w-old_x
        well._coordinates = Vector(old_y, offset_y, z)


def add_offset(container):
    # Adds associated origin offset to all well coordinates
    # so that the origin can be transposed
    x, y, _ = container._coordinates
    for well in container.wells():
        old_x, old_y, z = well._coordinates
        dx = x + old_x
        dy = y + old_y
        well._coordinates = Vector(dx, dy, z)

    return container


def rotate_container_for_alpha(container):
    container = add_offset(container)
    _, _, z = container._coordinates
    # Change container coordinates to be at the origin + top of container
    container._coordinates = Vector(0, 0, z)
    transpose_coordinates([well for well in container.wells()])

    return container


# FIXME: (JG 10/6/17) container rotation below is hacky.
# This should be done based on the deck and/or slots in pose tracking
def migrate_containers_and_wells():
    print("Loading json containers...")
    load_all_containers_from_disk()
    print("Json container file load complete.")
    print("Starting migration...")
    for container_name in list_container_names():
        print('migrating {} from json to database'.format(container_name))
        container = get_persisted_container(container_name)

        container = rotate_container_for_alpha(container)
        print(
            "CONTAINER: {}, {}".format(
                container_name,
                container._coordinates))

        database.save_new_container(container, container_name)
    print("Database migration complete!")


def execute_schema_change(conn, sql_command):
    c = conn.cursor()
    c.execute(sql_command)


# FIXME: (JG 9/20/17) just for temporary migrations,
# should have a more thought out structure for migrations
# and schema changes
def check_version_and_perform_necessary_migrations():
    db_path = str(CONFIG['labware_database_file'])
    conn = sqlite3.connect(db_path)
    db_version = database.get_version()
    if db_version == 0:
        execute_schema_change(conn, create_table_ContainerWells)
        execute_schema_change(conn, create_table_Containers)
        migrate_containers_and_wells()
        database.set_version(1)
