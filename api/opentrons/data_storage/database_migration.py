import sqlite3
import os

from opentrons.data_storage import database
from opentrons.data_storage.old_container_loading import \
    load_all_containers_from_disk, \
    list_container_names, \
    get_persisted_container
from opentrons.util import environment
from opentrons.data_storage.schema_changes import \
    create_table_ContainerWells, create_table_Containers
from opentrons.util.vector import Vector


def rotate_well_offset(well):
    x, y, z = well._coordinates
    well._coordinates = Vector(y, x, z)
    return well


def flip_wells(wells):
    sorted_wells = sorted(wells, key=lambda well: well._coordinates[1])
    opposite_y_offsets = reversed(
        [well._coordinates[1] for well in sorted_wells])

    for well, opposite_offset in zip(sorted_wells, opposite_y_offsets):
        x, y, z = well._coordinates
        well._coordinates = Vector(x, opposite_offset, 0)
        length, width = (well.properties['length'], well.properties['width'])
        well.properties['length'] = width
        well.properties['width'] = length


def rotate_container_for_alpha(container):
    x, y, z = container._coordinates
    container._coordinates = Vector(y, x, z)  # flipping x and y

    flip_wells(
        [
            rotate_well_offset(well)
            for well in container.wells()
        ]
    )

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
    db_path = environment.get_path('DATABASE_FILE')
    conn = sqlite3.connect(db_path)
    db_version = database.get_version()
    if db_version == 0:
        os.remove(db_path)
        conn = sqlite3.connect(db_path)
        execute_schema_change(conn, create_table_ContainerWells)
        execute_schema_change(conn, create_table_Containers)
        migrate_containers_and_wells()
        database.set_version(1)
