import pytest
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
    print("Database: ",db_info[2])

def build_temp_db(tmpdir):
    pass
    # temp_db_path=tmpdir.mkdir('testing').join("database.db")
    # print(str(temp_db_path))
    # shutil.copy2(db_path(), str(temp_db_path))
    # database.change_database(str(temp_db_path))

def dummy_db(path):
    shutil.copy2(db_path(), path)
    database.change_database(str(temp_db_path))