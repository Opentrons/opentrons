import sqlite3
from opentrons.data_storage import database
from opentrons.data_storage.old_container_loading import \
    load_all_containers_from_disk, \
    list_container_names, \
    get_persisted_container
from opentrons.util import environment

containers_table = """ CREATE TABLE IF NOT EXISTS Containers (
                                    name TEXT PRIMARY KEY,
                                    relative_x INTEGER DEFAULT 0,
                                    relative_y INTEGER DEFAULT 0,
                                    relative_z INTEGER DEFAULT 0
                                ); """

# Think we might want to use rows and columns instead of A1 or B2
container_wells = """CREATE TABLE IF NOT EXISTS ContainerWells (
                        container_name TEXT NOT NULL
                            references Containers(name),
                        location TEXT NOT NULL,
                        relative_x INTEGER DEFAULT 0,
                        relative_y INTEGER DEFAULT 0,
                        relative_z INTEGER DEFAULT 0,
                        depth INTEGER NOT NULL,
                        volume INTEGER,
                        diameter INTEGER,
                        length INTEGER,
                        width INTEGER
                    );"""


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


def create_table(conn, create_table_sql):
    c = conn.cursor()
    c.execute(create_table_sql)


def main():
    db_path = environment.get_path('DATABASE_FILE')
    conn = sqlite3.connect(db_path)
    if conn is not None:
        create_table(conn, containers_table)
        create_table(conn, container_wells)
        migrate_containers_and_wells()

    else:
        print("Error! cannot create the database connection.")


if __name__ == '__main__':
    main()
