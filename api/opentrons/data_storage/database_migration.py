import sqlite3
from opentrons.data_storage import database
from opentrons.data_storage.old_container_loading import \
    load_all_containers_from_disk, \
    list_container_names, \
    get_persisted_container
from opentrons.util import environment
from opentrons.data_storage.schema_changes import \
    create_table_ContainerWells, create_table_Containers


def migrate_containers_and_wells():
    print("Loading json containers...")
    load_all_containers_from_disk()
    print("Json container file load complete.")
    print("Starting migration...")
    for container_name in list_container_names():
        print('migrating {} from json to database'.format(container_name))
        container = get_persisted_container(container_name)
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
        execute_schema_change(conn, create_table_ContainerWells)
        execute_schema_change(conn, create_table_Containers)
        migrate_containers_and_wells()
        database.set_version(1)
