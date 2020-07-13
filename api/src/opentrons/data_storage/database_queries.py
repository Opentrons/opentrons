import typing

# ------------- Configuration Functions -------------#
from collections import namedtuple


def get_user_version(db_conn):
    with db_conn:
        cursor = db_conn.cursor()
        cursor.execute('PRAGMA user_version')
        return cursor.fetchone()


def set_user_version(db_conn, version):
    with db_conn:
        cursor = db_conn.cursor()
        cursor.execute('PRAGMA user_version={}'.format(version,))
        return cursor.fetchone()

# ------------ END Configuration Functions -----------#


# ------------- Container Functions -------------#
def get_all_container_names(db_conn):
    with db_conn:
        cursor = db_conn.cursor()
        cursor.execute('SELECT name from Containers')
        return cursor.fetchall()


def create_container(db_conn, container_name, x, y, z):
    with db_conn:
        db_conn.execute(
            'INSERT INTO Containers VALUES (?, ?, ?, ?)',
            (container_name, x, y, z,)
        )


def get_container_by_name(db_conn, container_name):
    with db_conn:
        cursor = db_conn.cursor()
        cursor.execute(
            'SELECT * from Containers WHERE name=?',
            (container_name,)
        )
        return cursor.fetchone()


def update_container(db_conn, container_name, x, y, z):
    with db_conn:
        db_conn.execute(
            '''
            UPDATE Containers SET
            relative_x=?,
            relative_y=?,
            relative_z=?
            WHERE name=?
            ''',
            (x, y, z, container_name,)
        )


def delete_container(db_conn, container_name):
    with db_conn:
        db_conn.execute(
            'DELETE FROM Containers WHERE name=?',
            (container_name,)
        )


# ------------ END Container Functions -----------#


# ------------- Well Functions -------------#


WellRow = namedtuple("WellRow", [
    'container_name',
    'location',
    'x',
    'y',
    'z',
    'depth',
    'volume',
    'diameter',
    'length',
    'width'
])


def insert_well_into_db(db_conn, well: WellRow):
    with db_conn:
        db_conn.execute(
            'INSERT INTO ContainerWells VALUES (?,?,?,?,?,?,?,?,?,?)',
            well
        )


def insert_wells_into_db(db_conn, wells: typing.Iterable[WellRow]):
    with db_conn:
        db_conn.executemany(
            'INSERT INTO ContainerWells VALUES (?,?,?,?,?,?,?,?,?,?)',
            wells
        )


def get_wells_by_container_name(db_conn, container_name):
    with db_conn:
        cursor = db_conn.cursor()
        cursor.execute(
            'SELECT * from ContainerWells WHERE container_name=?',
            (container_name,)
        )
        return cursor.fetchall()


def delete_wells_by_container_name(db_conn, container_name):
    with db_conn:
        db_conn.execute(
            'DELETE FROM ContainerWells WHERE container_name=?',
            (container_name,)
        )

# ------------ END Well Functions -----------#
