# Uncomment to enable logging during tests
# import logging
# from logging.config import dictConfig

import asyncio
import os
import re
import shutil
import tempfile
import json
from collections import namedtuple
from functools import partial
from uuid import uuid4 as uuid

import pytest
from opentrons.api import models
from opentrons.data_storage import database
from opentrons.server import rpc
from opentrons import config
from opentrons.config import advanced_settings as advs
from opentrons.server import init
from opentrons.deck_calibration import endpoints
from opentrons.util import environment

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

# Note: When dummy_db or robot fixtures are used, this db is copied into a
# a temp testing_db that is deleted in between tests to allow for db mutation
MAIN_TESTER_DB = str(os.path.join(
    os.path.dirname(
        globals()["__file__"]), 'testing_database.db')
)


def state(topic, state):
    def _match(item):
        return \
            item['topic'] == topic and \
            item['payload'].state == state

    return _match


def log_by_axis(log, axis):
    from functools import reduce

    def reducer(e1, e2):
        return {
            axis: e1[axis] + [round(e2[axis])]
            for axis in axis
        }

    return reduce(reducer, log, {axis: [] for axis in axis})


def print_db_path(db):
    cursor = database.db_conn.cursor()
    cursor.execute("PRAGMA database_list")
    db_info = cursor.fetchone()
    print("Database: ", db_info[2])


@pytest.fixture(autouse=True)
def clear_feature_flags():
    ff_file = config.get_config_index().get('featureFlagFile')
    if os.path.exists(ff_file):
        os.remove(ff_file)
    yield
    if os.path.exists(ff_file):
        os.remove(ff_file)


@pytest.fixture
def wifi_keys_tempdir():
    old_wifi_keys = environment.settings['WIFI_KEYS_DIR']
    with tempfile.TemporaryDirectory() as td:
        environment.settings['WIFI_KEYS_DIR'] = td
        yield td
        environment.settings['WIFI_KEYS_DIR'] = old_wifi_keys


@pytest.fixture(autouse=True)
def labware_test_data():
    index = config.get_config_index()
    user_def_dir = index.get('labware', {}).get('userDefinitionDir', '')
    offset_dir = index.get('labware', {}).get('offsetDir', '')
    deck_calibration_dir = os.path.dirname(index.get('deckCalibrationFile'))
    dummy_lw_name = '4-well-plate'
    filename = '{}.json'.format(dummy_lw_name)
    dummy_lw_defn = {
      "metadata": {"name": dummy_lw_name},
      "wells": {
        "A1": {"x": 40, "y": 40, "z": 30,
               "depth": 26, "diameter": 10, "total-liquid-volume": 78.6},
        "A2": {"x": 40, "y": 80, "z": 30,
               "depth": 26, "diameter": 10, "total-liquid-volume": 78.6},
        "B1": {"x": 80, "y": 40, "z": 30,
               "depth": 26, "diameter": 10, "total-liquid-volume": 78.6},
        "B2": {"x": 80, "y": 80, "z": 30,
               "depth": 26, "diameter": 10, "total-liquid-volume": 78.6}},
      "ordering": [["A1", "B1"],
                   ["A2", "B2"]]}
    dummy_lw_offset = {"x": 10, "y": -10, "z": 100}
    os.makedirs(user_def_dir, exist_ok=True)
    with open(os.path.join(user_def_dir, filename), 'w') as usr_def:
        json.dump(dummy_lw_defn, usr_def)
    os.makedirs(offset_dir, exist_ok=True)
    with open(os.path.join(offset_dir, filename), 'w') as offs:
        json.dump(dummy_lw_offset, offs)
    os.makedirs(deck_calibration_dir, exist_ok=True)
    yield
    shutil.rmtree(os.path.dirname(user_def_dir), ignore_errors=True)
    shutil.rmtree(os.path.dirname(offset_dir), ignore_errors=True)
    shutil.rmtree(deck_calibration_dir, ignore_errors=True)


# Builds a temp db to allow mutations during testing
@pytest.fixture(autouse=True)
def dummy_db(tmpdir):
    temp_db_path = str(tmpdir.mkdir('testing').join("database.db"))
    shutil.copy2(MAIN_TESTER_DB, temp_db_path)
    database.change_database(temp_db_path)
    yield None
    database.change_database(MAIN_TESTER_DB)
    os.remove(temp_db_path)


# -------feature flag fixtures-------------
@pytest.fixture
def calibrate_bottom_flag():
    advs.set_adv_setting('calibrateToBottom', True)
    yield
    advs.set_adv_setting('calibrateToBottom', False)


@pytest.fixture
def short_trash_flag():
    advs.set_adv_setting('shortFixedTrash', True)
    yield
    advs.set_adv_setting('shortFixedTrash', False)


@pytest.fixture
def split_labware_def():
    advs.set_adv_setting('splitLabwareDefinitions', True)
    yield
    advs.set_adv_setting('splitLabwareDefinitions', False)


# -----end feature flag fixtures-----------


@pytest.fixture
async def async_client(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))
    endpoints.session = None
    return cli


@pytest.fixture
def dc_session(virtual_smoothie_env, monkeypatch):
    """
    Mock session manager for deck calibation
    """
    ses = endpoints.SessionManager()
    monkeypatch.setattr(endpoints, 'session', ses)
    return ses


@pytest.fixture
def robot(dummy_db):
    from opentrons.legacy_api.robot import Robot
    return Robot()


@pytest.fixture(params=["dinosaur.py"])
def protocol(request):
    try:
        root = request.getfixturevalue('protocol_file')
    except Exception:
        root = request.param

    filename = os.path.join(os.path.dirname(__file__), 'data', root)

    with open(filename) as file:
        text = ''.join(list(file))
        return Protocol(text=text, filename=filename)


@pytest.fixture(params=["no_clear_tips.py"])
def tip_clear_protocol(request):
    try:
        root = request.getfixturevalue('protocol_file')
    except Exception:
        root = request.param

    filename = os.path.join(os.path.dirname(__file__), 'data', root)

    with open(filename) as file:
        text = ''.join(list(file))
        return Protocol(text=text, filename=filename)


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
    from aiohttp import web
    from opentrons.server import error_middleware
    root = None
    try:
        root = request.getfixturevalue('root')
        if not root:
            root = main_router
        # Assume test fixture has init to attach test loop
        root.init(loop)
    except Exception:
        pass

    app = web.Application(loop=loop, middlewares=[error_middleware])
    server = rpc.RPCServer(app, root)
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


@pytest.fixture
def connect(session, test_client):
    async def _connect():
        client = await test_client(session.server.app)
        return await client.ws_connect('/')
    return _connect


def setup_testing_env():
    database.change_database(MAIN_TESTER_DB)


@pytest.fixture
def virtual_smoothie_env(monkeypatch):
    # TODO (ben 20180426): move this to the .env file
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    yield
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')


@pytest.fixture
def main_router(
            loop,
            virtual_smoothie_env,
            monkeypatch
        ):
    from opentrons.api.routers import MainRouter
    from opentrons import robot

    with MainRouter(loop=loop) as router:
        router.wait_until = partial(
            wait_until,
            notifications=router.notifications,
            loop=loop)
        yield router

    robot.reset()


async def wait_until(matcher, notifications, timeout=1, loop=None):
    result = []
    for coro in iter(notifications.__anext__, None):
        done, pending = await asyncio.wait([coro], timeout=timeout)

        if pending:
            [task.cancel() for task in pending]
            raise TimeoutError('Notifications: {0}'.format(result))

        result += [done.pop().result()]

        if matcher(result[-1]):
            return result


@pytest.fixture
def model(robot):
    from opentrons.legacy_api.containers import load
    from opentrons.legacy_api.instruments.pipette import Pipette

    pipette = Pipette(robot, ul_per_mm=18.5, max_volume=300, mount='right')
    plate = load(robot, '96-flat', '1')

    instrument = models.Instrument(pipette)
    container = models.Container(plate)

    return namedtuple('model', 'robot instrument container')(
            robot=robot,
            instrument=instrument,
            container=container
        )


@pytest.fixture
def model_with_trough(robot):
    from opentrons.legacy_api.containers import load
    from opentrons.legacy_api.instruments.pipette import Pipette

    pipette = Pipette(robot, ul_per_mm=18.5, max_volume=300, mount='right')
    plate = load(robot, 'trough-12row', '1')

    instrument = models.Instrument(pipette)
    container = models.Container(plate)

    return namedtuple('model', 'robot instrument container')(
            robot=robot,
            instrument=instrument,
            container=container
        )


@pytest.fixture
def smoothie(monkeypatch):
    from opentrons.drivers.smoothie_drivers.driver_3_0 import \
         SmoothieDriver_3_0_0 as SmoothieDriver
    from opentrons.config import robot_configs

    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    driver = SmoothieDriver(robot_configs.load())
    driver.connect()
    yield driver
    driver.disconnect()
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')


@pytest.fixture
def hardware_controller_lockfile():
    old_lockfile = environment.settings['HARDWARE_CONTROLLER_LOCKFILE']
    with tempfile.NamedTemporaryFile() as td:
        environment.settings['HARDWARE_CONTROLLER_LOCKFILE'] = td
        yield td
        environment.settings['HARDWARE_CONTROLLER_LOCKFILE'] = old_lockfile


@pytest.fixture
def running_on_pi():
    oldpi = os.environ.get('RUNNING_ON_PI')
    os.environ['RUNNING_ON_PI'] = '1'
    yield
    if None is oldpi:
        os.environ.pop('RUNNING_ON_PI')
    else:
        os.environ['RUNNING_ON_PI'] = oldpi


setup_testing_env()
