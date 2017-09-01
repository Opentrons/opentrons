import sqlite3
from opentrons.containers import get_persisted_container
from opentrons import containers
import database_crud_funcs
from opentrons.util import environment

db_path = environment.get_path('DATABASE_FILE')
containers_table = """ CREATE TABLE IF NOT EXISTS Containers (
                                    name TEXT PRIMARY KEY,
                                    relative_x INTEGER DEFAULT 0,
                                    relative_y INTEGER DEFAULT 0,
                                    relative_z INTEGER DEFAULT 0
                                ); """

# Think we might want to use rows and columns instead of A1 or B2
container_wells = """CREATE TABLE IF NOT EXISTS ContainerWells (
                                container_name TEXT NOT NULL references Containers(name),
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


def migrate_containers_and_wells(db_file):
    db_conn = create_connection(db_file)
    for container_name in containers.list():
        container = get_persisted_container(container_name)
        insert_container_obj_in_db(db_conn, container, container_name)

def create_table(conn, create_table_sql):
    """ create a table from the create_table_sql statement
    :param conn: Connection object
    :param create_table_sql: a CREATE TABLE statement
    :return:
    """
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)

def main():
    # create a database connection
    conn = create_connection(db_path)
    if conn is not None:
        create_table(conn, containers_table)
        create_table(conn, container_wells)
        migrate_containers_and_wells(db_path)

    else:
        print("Error! cannot create the database connection.")

if __name__ == '__main__':
    main()
