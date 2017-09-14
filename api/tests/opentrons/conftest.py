# Uncomment to enable logging during tests
# import logging
# from logging.config import dictConfig

import pytest
import os
import shutil
from collections import namedtuple
from opentrons.server import rpc
from uuid import uuid4 as uuid
from opentrons.data_storage import database

# Uncomment to enable logging during tests

# logging_config = dict(
#     version=1,
#     formatters={
#         'basic': {
#             'format':
#             '[Line %(lineno)s] %(message)s'
#         }
#     },
#     handlers={
#         'debug': {
#             'class': 'logging.StreamHandler',
#             'formatter': 'basic',
#         }
#     },
#     loggers={
#         '__main__': {
#             'handlers': ['debug'],
#             'level': logging.DEBUG
#         },
#         'opentrons.server': {
#             'handlers': ['debug'],
#             'level': logging.DEBUG
#         },
#     }
# )
# dictConfig(logging_config)

Session = namedtuple(
    'Session',
    ['server', 'socket', 'token', 'call'])

Protocol = namedtuple(
    'Protocol',
    ['text', 'filename'])


def print_db_path(db):
    cursor = database.db_conn.cursor()
    cursor.execute("PRAGMA database_list")
    db_info = cursor.fetchone()
    print("Database: ", db_info[2])


def db_path():
    path = globals()["__file__"]
    return os.path.join(os.path.dirname(path), 'testing_database.db')


# Builds a temp db to allow mutations during testing
@pytest.fixture
def build_dummy_temp_db(tmpdir):
    temp_db_fd = tmpdir.mkdir('testing').join("database.db")
    shutil.copy2(db_path(), str(temp_db_fd))
    database.change_database(str(temp_db_fd))
    yield None
    os.remove(str(temp_db_fd))


@pytest.fixture
def robot(build_dummy_temp_db):
    from opentrons import Robot
    return Robot()


@pytest.fixture
def message_broker():
    from opentrons.util.trace import MessageBroker
    return MessageBroker()


@pytest.fixture(params=["dinosaur.py"])
def protocol(request):
    text = None
    filename = os.path.join(os.path.dirname(__file__), 'data', request.param)
    with open(filename) as file:
        text = ''.join(list(file))
    return Protocol(text=text, filename=filename)


@pytest.fixture
def session_manager(loop):
    from opentrons.session import SessionManager
    with SessionManager(loop=loop) as s:
        # We are adding this so more notifications are generated
        # during the run, in addition to default ones
        s.notifications.append_filters(['move-to'])
        yield s
    return


@pytest.fixture
def session(loop, test_client, request, session_manager):
    """
    Create testing session. Tests using this fixture are expected
    to have @pytest.mark.parametrize('root', [value]) decorator set.
    If not set root will be defaulted to None
    """
    root = None
    try:
        root = request.getfuncargvalue('root')
        if not root:
            root = session_manager
        root.init(loop)
    except Exception as e:
        pass


    server = rpc.Server(loop=loop, root=root)
    client = loop.run_until_complete(test_client(server.app))
    socket = loop.run_until_complete(client.ws_connect('/'))
    token = str(uuid())

    async def call(**kwargs):
        request = {
            '$': {
                'token': token
            },
        }
        request.update(kwargs)
        return await socket.send_json(request)

    def finalizer():
        server.shutdown()
    request.addfinalizer(finalizer)
    return Session(server, socket, token, call)
