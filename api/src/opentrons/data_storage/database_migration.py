import logging
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

log = logging.getLogger(__name__)


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


def _migrate_container(container_name):
    print('migrating {} from json to database'.format(container_name))
    container = get_persisted_container(container_name)
    container = rotate_container_for_alpha(container)
    print(
        "CONTAINER: {}, {}".format(
            container_name,
            container._coordinates))

    database.save_new_container(container, container_name)


def _ensure_containers_and_wells():
    """ Load all persisted containers in to the labware database
    """

    log.info("Loading json containers...")
    load_all_containers_from_disk()
    json_containers = list_container_names()
    log.info("Json container file load complete, listing database")
    current_containers = database.list_all_containers()
    to_update = set(json_containers) - set(current_containers)
    msg = f"Found {len(to_update)} containers to add. Starting migration..."
    log.info(msg)
    for container_name in to_update:
        _migrate_container(container_name)
    current_containers = database.list_all_containers()
    missing = set(json_containers) - set(current_containers)
    if missing:
        msg = f"MIGRATION FAILED: MISSING {missing}"
        log.error(msg)
    else:
        log.info("Database migration complete")


def _ensure_trash():
    """ Ensure that the tall and short fixed trash containers are present

    This is a separate step because the robot singleton needs them, so
    they need to be present whenever the singleton is constructed on import.
    The rest of the containers are not necessarily needed, and so are handled
    elsewhere.
    """
    load_all_containers_from_disk()

    to_load = {'fixed-trash', 'tall-fixed-trash'}
    present = set(database.list_all_containers())
    to_update = to_load - present
    log.info(f"_ensure_trash: loading {to_update}")
    for container_name in to_update:
        _migrate_container(container_name)


def execute_schema_change(conn, sql_command):
    c = conn.cursor()
    c.execute(sql_command)


def _do_schema_changes():
    db_path = str(CONFIG['labware_database_file'])
    conn = sqlite3.connect(db_path)
    db_version = database.get_version()
    if db_version == 0:
        log.info("doing database schema migration")
        try:
            execute_schema_change(conn, create_table_ContainerWells)
        except sqlite3.OperationalError:
            log.warning(
                "Creation of container wells failed, robot may have been "
                "interrupted during last boot")
        try:
            execute_schema_change(conn, create_table_Containers)
        except sqlite3.OperationalError:
            log.warning(
                "Creation of containers failed, robot may have been "
                "interrupted during last boot")
        database.set_version(1)
    return conn


def check_version_and_perform_full_migration():
    """
    Migrate all labware to the database (if necessary). Only needs to be
    performed if protocols will run using the labware database.
    """
    log.info("full database migration requested")
    _do_schema_changes()
    _ensure_containers_and_wells()


def check_version_and_perform_minimal_migrations():
    """
    Perform the minimal set of migrations to make sure import-constructed
    objects work. Should be performed in early import regardless of feature
    flags
    """
    log.info("minimal database migration requested")
    _do_schema_changes()
    _ensure_trash()
