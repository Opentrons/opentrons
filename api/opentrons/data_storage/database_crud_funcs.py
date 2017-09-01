import sqlite3

#------------- Container Functions -------------#
def get_all_container_names(db_conn, container_name):
    with db_conn:
        cursor = db_conn.cursor()
        cursor.execute('SELECT name from Containers')
        return cursor.fetchall()

def create_container(db_conn, container_name, x, y, z):
    with db_conn:
        db_conn.execute('INSERT INTO Containers VALUES (?, ?, ?, ?)', (container_name, x,y,z,))

def get_container_by_name(db_conn, container_name):
    with db_conn:
        cursor = db_conn.cursor()
        cursor.execute('SELECT * from Containers WHERE name=?', (container_name,))
        return cursor.fetchone()

def update_container(db_conn, container_name, x, y, z):
    with db_conn:
       db_conn.execute('UPDATE Containers SET relative_x=?, relative_y=?, relative_z=? WHERE name=?',
                       (x,y,z,container_name,))
#------------ END Container Functions -----------#


#------------- Well Functions -------------#
def insert_well_into_db(db_conn, container_name, location, x, y, z,
                        depth, volume, diameter, length, width):
    with db_conn:
        db_conn.execute('INSERT INTO ContainerWells VALUES (?,?,?,?,?,?,?,?,?,?)', (container_name, location, x,y,z,
                                                                  depth, volume, diameter, length, width,))

def get_wells_by_container_name(db_conn, container_name):
    with db_conn:
        cursor = db_conn.cursor()
        cursor.execute('SELECT * from ContainerWells WHERE container_name=?', (container_name,))
        return cursor.fetchall()
#------------ END Well Functions -----------#



