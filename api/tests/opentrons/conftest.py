# Uncomment to enable logging during tests
import logging
from logging.config import dictConfig

import pytest
import os
import shutil
import re

from collections import namedtuple
from opentrons.server import rpc
from uuid import uuid4 as uuid
from opentrons.data_storage import database

# Uncomment to enable logging during tests

logging_config = dict(
    version=1,
    formatters={
        'basic': {
            'format':
            '[Line %(lineno)s] %(message)s'
        }
    },
    handlers={
        'debug': {
            'class': 'logging.StreamHandler',
            'formatter': 'basic',
        }
    },
    loggers={
        '__main__': {
            'handlers': ['debug'],
            'level': logging.DEBUG
        },
        'opentrons.server': {
            'handlers': ['debug'],
            'level': logging.DEBUG
        },
    }
)
dictConfig(logging_config)

Session = namedtuple(
    'Session',
    ['server', 'socket', 'token', 'call'])

Protocol = namedtuple(
    'Protocol',
    ['text', 'filename'])

# Note: When dummy_db or robot fixtures are used, this db is copied into a
# a temp testing_db that is deleted in between tests to allow for db mutation
MAIN_TESTER_DB = str(os.path.join(
    os.path.dirname(
        globals()["__file__"]), 'testing_database.db')
)


def print_db_path(db):
    cursor = database.db_conn.cursor()
    cursor.execute("PRAGMA database_list")
    db_info = cursor.fetchone()
    print("Database: ", db_info[2])


# Builds a temp db to allow mutations during testing
@pytest.fixture
def dummy_db(tmpdir):
    temp_db_path = str(tmpdir.mkdir('testing').join("database.db"))
    shutil.copy2(MAIN_TESTER_DB, temp_db_path)
    database.change_database(temp_db_path)
    yield None
    database.change_database(MAIN_TESTER_DB)
    os.remove(temp_db_path)


@pytest.fixture
def robot(dummy_db):
    from opentrons import Robot
    return Robot()


@pytest.fixture(params=["dinosaur.py"])
def protocol(request):
    try:
        root = request.getfuncargvalue('protocol_file')
    except Exception as e:
        root = request.param

    filename = os.path.join(os.path.dirname(__file__), 'data', root)

    with open(filename) as file:
        text = ''.join(list(file))
        return Protocol(text=text, filename=filename)


@pytest.fixture
def main_router(loop):
    from opentrons.api import MainRouter
    with MainRouter(loop=loop) as router:
        yield router


@pytest.fixture
def session_manager(main_router):
    return main_router.session_manager


@pytest.fixture
def session(loop, test_client, request, main_router):
    """
    Create testing session. Tests using this fixture are expected
    to have @pytest.mark.parametrize('root', [value]) decorator set.
    If not set root will be defaulted to None
    """
    root = None
    try:
        root = request.getfuncargvalue('root')
        if not root:
            root = main_router
        # Assume test fixture has init to attach test loop
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


def fuzzy_assert(result, expected):
    expected_re = ['.*'.join(['^'] + item + ['$']) for item in expected]

    assert len(result) == len(expected_re), \
        'result and expected have different length'

    for res, exp in zip(result, expected_re):
        assert re.compile(
            exp.lower()).match(res.lower()), "{} didn't match {}" \
            .format(res, exp)


def setup_testing_env():
    database.change_database(MAIN_TESTER_DB)


setup_testing_env()
