import os
import shutil
from opentrons.data_storage import database


def approx(pos):
    return int(sum(pos))


def db_path():
    path = globals()["__file__"]
    return os.path.join(os.path.dirname(path), 'testing_database.db')


def print_db_path(db):
    cursor = database.db_conn.cursor()
    cursor.execute("PRAGMA database_list")
    db_info = cursor.fetchone()
    print("Database: ", db_info[2])


def build_temp_db(tmpdir):
    temp_db_fd = tmpdir.mkdir('testing').join("database.db")
    shutil.copy2(db_path(), str(temp_db_fd))
    database.change_database(str(temp_db_fd))
