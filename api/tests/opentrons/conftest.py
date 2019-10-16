# Uncomment to enable logging during tests
# import logging
# from logging.config import dictConfig
import asyncio
import contextlib
import os
import io
import json
import pathlib
import re
import shutil
import tempfile
from collections import namedtuple
from functools import partial
from uuid import uuid4 as uuid
import zipfile

import pytest

try:
    from opentrons import robot as rb
except ImportError:
    pass
from opentrons.api import models
from opentrons.data_storage import database_migration
from opentrons.server import rpc
from opentrons import config, types
from opentrons.server import init
from opentrons.deck_calibration import endpoints
from opentrons import hardware_control as hc
from opentrons.hardware_control import adapters, API
from opentrons.protocol_api import ProtocolContext
from opentrons.types import Mount


Session = namedtuple(
    'Session',
    ['server', 'socket', 'token', 'call'])

Protocol = namedtuple(
    'Protocol',
    ['text', 'filename', 'filelike'])


@pytest.fixture(autouse=True)
def asyncio_loop_exception_handler(loop):
    def exception_handler(loop, context):
        pytest.fail(str(context))
    loop.set_exception_handler(exception_handler)
    yield
    loop.set_exception_handler(None)


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


@pytest.mark.apiv1
@pytest.fixture(scope='session')
def template_db(tmpdir_factory):
    template_db = tmpdir_factory.mktemp('template_db.sqlite')\
                                .join('opentrons.db')
    config.CONFIG['labware_database_file'] = str(template_db)
    database_migration.check_version_and_perform_full_migration()
    return template_db


@pytest.mark.apiv1
@pytest.fixture(autouse=True)
def config_tempdir(tmpdir, template_db):
    os.environ['OT_API_CONFIG_DIR'] = str(tmpdir)
    config.reload()
    shutil.copyfile(
        template_db, config.CONFIG['labware_database_file'])
    yield tmpdir, template_db


@pytest.fixture(autouse=True)
def clear_feature_flags():
    ff_file = config.CONFIG['feature_flags_file']
    if os.path.exists(ff_file):
        os.remove(ff_file)
    yield
    if os.path.exists(ff_file):
        os.remove(ff_file)


@pytest.fixture
def wifi_keys_tempdir():
    old_wifi_keys = config.CONFIG['wifi_keys_dir']
    with tempfile.TemporaryDirectory() as td:
        config.CONFIG['wifi_keys_dir'] = pathlib.Path(td)
        yield td
        config.CONFIG['wifi_keys_dir'] = old_wifi_keys


# -------feature flag fixtures-------------
@pytest.fixture
def calibrate_bottom_flag():
    config.advanced_settings.set_adv_setting('calibrateToBottom', True)
    yield
    config.advanced_settings.set_adv_setting('calibrateToBottom', False)


@pytest.fixture
def short_trash_flag():
    config.advanced_settings.set_adv_setting('shortFixedTrash', True)
    yield
    config.advanced_settings.set_adv_setting('shortFixedTrash', False)


@pytest.fixture
def old_aspiration(monkeypatch):
    config.advanced_settings.set_adv_setting('useOldAspirationFunctions', True)
    yield
    config.advanced_settings.set_adv_setting(
        'useOldAspirationFunctions', False)

# -----end feature flag fixtures-----------


@contextlib.contextmanager
def using_api2(loop):
    if not os.environ.get('OT_API_FF_useProtocolApi2'):
        pytest.skip('Do not run api v1 tests here')
    hw_manager = adapters.SingletonAdapter(loop)
    try:
        yield hw_manager
    finally:
        asyncio.ensure_future(hw_manager.reset())
        hw_manager.set_config(config.robot_configs.load())


@contextlib.contextmanager
def using_sync_api2(loop):
    if not os.environ.get('OT_API_FF_useProtocolApi2'):
        pytest.skip('Do not run api v2 tests here')
    hardware = adapters.SynchronousAdapter.build(
        API.build_hardware_controller)
    try:
        yield hardware
    finally:
        hardware.reset()
        hardware.set_config(config.robot_configs.load())


@pytest.fixture
def ensure_api2(request, loop):
    with using_api2(loop):
        yield


@pytest.fixture
def ensure_api1(request, loop):
    with using_api1(loop):
        yield


@pytest.mark.apiv1
@contextlib.contextmanager
def using_api1(loop):
    try:
        yield rb
    finally:
        rb.reset()
        rb.config = config.robot_configs.load()


def _should_skip_api1(request):
    return request.node.get_closest_marker('api1_only')\
        and request.param != using_api1


def _should_skip_api2(request):
    return request.node.get_closest_marker('api2_only')\
        and request.param != using_api2


@pytest.fixture(
    params=[
        pytest.param(using_api1, marks=pytest.mark.apiv1),
        pytest.param(using_api2, marks=pytest.mark.apiv2)])
async def async_server(request, virtual_smoothie_env, loop):
    if _should_skip_api1(request):
        pytest.skip('requires api1 only')
    elif _should_skip_api2(request):
        pytest.skip('requires api2 only')
    with request.param(loop) as hw:
        if request.param == using_api1:
            app = init(hw)
            app['api_version'] = 1
        elif request.param == using_api2:
            app = init(hw)
            app['api_version'] = 2
        else:
            pytest.skip('Incorrect api version used')
        yield app
        await app.shutdown()


@pytest.fixture
async def async_client(async_server, loop, aiohttp_client):
    cli = await loop.create_task(aiohttp_client(async_server))
    endpoints.session = None
    yield cli


@pytest.fixture
async def dc_session(request, async_server, monkeypatch, loop):
    """
    Mock session manager for deck calibation
    """
    hw = async_server['com.opentrons.hardware']
    if async_server['api_version'] == 2:
        await hw.cache_instruments({
            types.Mount.LEFT: None,
            types.Mount.RIGHT: 'p300_multi_v1'})
    ses = endpoints.SessionManager(hw)
    endpoints.session = ses
    monkeypatch.setattr(endpoints, 'session', ses)
    yield ses


@pytest.mark.apiv1
def apiv1_singletons_factory(virtual_smoothie_env):
    from opentrons.legacy_api import api
    api.robot.connect()
    api.robot.reset()
    return {'robot': api.robot,
            'instruments': api.instruments,
            'labware': api.labware,
            'modules': api.modules}


@pytest.fixture
def apiv1_singletons(config_tempdir, virtual_smoothie_env):
    return apiv1_singletons_factory(virtual_smoothie_env)


@pytest.mark.apiv2
def apiv2_singletons_factory(virtual_smoothie_env):
    from opentrons.protocol_api import back_compat
    return {**back_compat.build_globals()}


@pytest.fixture
def apiv2_singletons():
    return apiv2_singletons_factory()


@pytest.fixture(
    params=[
        pytest.param(apiv1_singletons_factory, marks=pytest.mark.apiv1),
        pytest.param(apiv2_singletons_factory, marks=pytest.mark.apiv2)])
def singletons(config_tempdir, request, virtual_smoothie_env):
    markers = list(request.node.iter_markers())
    if 'apiv1_only' in markers and 'apiv2' in markers:
        pytest.skip('apiv2 but apiv1 only')
    if 'apiv2_only' in markers and 'apiv1' in markers:
        pytest.skip('apiv1 but apiv2 only')
    return request.param(virtual_smoothie_env)


@pytest.fixture(scope='function')
def robot(singletons):
    return singletons['robot']


@pytest.fixture(scope='function')
def instruments(singletons):
    return singletons['instruments']


@pytest.mark.apiv1
@pytest.fixture(scope='function')
def labware(singletons):
    return singletons['labware']


@pytest.mark.apiv1
@pytest.fixture(scope='function')
def modules(singletons):
    return singletons['modules']


@pytest.fixture(params=["dinosaur.py"])
def protocol(request):
    try:
        root = request.getfixturevalue('protocol_file')
    except Exception:
        root = request.param

    filename = os.path.join(os.path.dirname(__file__), 'data', root)

    file = open(filename)
    text = ''.join(list(file))
    file.seek(0)
    return Protocol(text=text, filename=filename, filelike=file)


@pytest.fixture(params=["no_clear_tips.py"])
def tip_clear_protocol(request):
    try:
        root = request.getfixturevalue('protocol_file')
    except Exception:
        root = request.param

    filename = os.path.join(os.path.dirname(__file__), 'data', root)

    file = open(filename)
    text = ''.join(list(file))
    return Protocol(text=text, filename=filename, filelike=file)


@pytest.fixture
def session_manager(main_router):
    return main_router.session_manager


@pytest.fixture
def session(loop, aiohttp_client, request, main_router):
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
        root.init(loop=loop)
    except Exception:
        pass

    app = web.Application(middlewares=[error_middleware])
    server = rpc.RPCServer(app, root)
    client = loop.run_until_complete(aiohttp_client(server.app))
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

    for idx, (res, exp) in enumerate(zip(result, expected_re)):
        assert re.compile(
            exp.lower()).match(res.lower()), "element {}: {} didn't match {}" \
            .format(idx, res, exp)


@pytest.fixture
def connect(session, aiohttp_client):
    async def _connect():
        client = await aiohttp_client(session.server.app)
        return await client.ws_connect('/')
    return _connect


@pytest.fixture
def virtual_smoothie_env(monkeypatch):
    # TODO (ben 20180426): move this to the .env file
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    yield
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')


@pytest.fixture(
    params=[
        pytest.param(using_api1, marks=pytest.mark.apiv1),
        pytest.param(using_api2, marks=pytest.mark.apiv2)])
def hardware(request, loop, virtual_smoothie_env):
    if _should_skip_api1(request):
        pytest.skip('requires api1 only')
    elif _should_skip_api2(request):
        pytest.skip('requires api2 only')
    with request.param(loop) as hw:
        yield hw


@pytest.fixture(
    params=[
        pytest.param(using_api1, marks=pytest.mark.apiv1),
        pytest.param(using_sync_api2, marks=pytest.mark.apiv2)])
def sync_hardware(request, loop, virtual_smoothie_env):
    if _should_skip_api1(request):
        pytest.skip('requires api1 only')
    elif _should_skip_api2(request):
        pytest.skip('requires api2 only')
    with request.param(loop) as hw:
        yield hw


@pytest.fixture
def main_router(loop, virtual_smoothie_env, hardware):
    from opentrons.api.routers import MainRouter
    router = MainRouter(hardware, loop)
    router.wait_until = partial(
        wait_until,
        notifications=router.notifications,
        loop=loop)
    yield router


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
def model(robot, hardware, loop, request):
    # Use with pytest.mark.parametrize(’labware’, [some-labware-name])
    # to have a different labware loaded as .container. If not passed,
    # defaults to the version-appropriate way to do 96 flat
    try:
        lw_name = request.getfixturevalue('labware_name')
    except Exception:
        lw_name = None

    if isinstance(hardware, hc.HardwareAPILike):
        ctx = ProtocolContext(loop=loop, hardware=hardware)
        pip = ctx.load_instrument('p300_single', 'right')
        loop.run_until_complete(hardware.cache_instruments(
            {Mount.RIGHT: 'p300_single'}))
        instrument = models.Instrument(pip, context=ctx)
        plate = ctx.load_labware(
            lw_name or 'corning_96_wellplate_360ul_flat', 1)
        rob = hardware
        container = models.Container(plate, context=ctx)
    else:
        from opentrons.legacy_api.containers import load
        from opentrons.legacy_api.instruments.pipette import Pipette
        pipette = Pipette(robot,
                          ul_per_mm=18.5, max_volume=300, mount='right')
        plate = load(robot, lw_name or '96-flat', '1')
        rob = robot
        instrument = models.Instrument(pipette)
        container = models.Container(plate)

    return namedtuple('model', 'robot instrument container')(
            robot=rob,
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
    old_lockfile = config.CONFIG['hardware_controller_lockfile']
    with tempfile.TemporaryDirectory() as td:
        config.CONFIG['hardware_controller_lockfile']\
            = pathlib.Path(td)/'hardware.lock'
        yield td
        config.CONFIG['hardware_controller_lockfile'] = old_lockfile


@pytest.fixture
def running_on_pi():
    oldpi = config.IS_ROBOT
    config.IS_ROBOT = True
    yield
    config.IS_ROBOT = oldpi


@pytest.mark.skipif(not hc.Controller,
                    reason='hardware controller not available '
                           '(probably windows)')
@pytest.fixture
def cntrlr_mock_connect(monkeypatch):
    async def mock_connect(obj, port=None):
        return
    monkeypatch.setattr(hc.Controller, 'connect', mock_connect)


@pytest.fixture
def hardware_api(loop):
    hw_api = API.build_hardware_simulator(loop=loop)
    return hw_api


@pytest.fixture
def get_labware_fixture():
    def _get_labware_fixture(fixture_name):
        with open((pathlib.Path(__file__).parent/'..'/'..'/'..'/'shared-data' /
                   'labware' / 'fixtures'/'2'/f'{fixture_name}.json'), 'rb'
                  ) as f:
            return json.loads(f.read().decode('utf-8'))

    return _get_labware_fixture


@pytest.fixture
def get_json_protocol_fixture():
    def _get_json_protocol_fixture(fixture_version, fixture_name, decode=True):
        with open(pathlib.Path(__file__).parent /
                  '..'/'..'/'..'/'shared-data'/'protocol'/'fixtures' /
                  fixture_version/f'{fixture_name}.json', 'rb') as f:
            contents = f.read().decode('utf-8')
            if decode:
                return json.loads(contents)
            else:
                return contents

    return _get_json_protocol_fixture


@pytest.fixture
def get_bundle_fixture():
    def get_std_labware(loadName, version=1):
        with open(
            pathlib.Path(__file__).parent / '..' / '..' / '..' /
            'shared-data' / 'labware' / 'definitions' / '2' /
            loadName / f'{version}.json', 'rb'
        ) as f:
            labware_def = json.loads(f.read().decode('utf-8'))
        return labware_def

    def _get_bundle_protocol_fixture(fixture_name):
        """
        It's ugly to store bundles as .zip's, so we'll build the .zip
        from fixtures and return it as `bytes`.
        We also need to hard-code fixture data here (bundled_labware,
        bundled_python, bundled_data, metadata) for the tests to use in
        their assertions.
        """
        fixture_dir = (
            pathlib.Path(__file__).parent / 'protocols' /
            'fixtures' / 'bundled_protocols' / fixture_name)

        result = {'filename': f'{fixture_name}.zip',
                  'source_dir': fixture_dir}

        fixed_trash_def = get_std_labware('opentrons_1_trash_1100ml_fixed')

        empty_protocol = 'def run(context):\n    pass'

        if fixture_name == 'simple_bundle':
            with open(fixture_dir / 'protocol.py', 'r') as f:
                result['contents'] = f.read()
            with open(fixture_dir / 'data.txt', 'rb') as f:
                result['bundled_data'] = {'data.txt': f.read()}
            with open(fixture_dir / 'custom_labware.json', 'r') as f:
                custom_labware = json.load(f)

            tiprack_def = get_std_labware('opentrons_96_tiprack_10ul')
            result['bundled_labware'] = {
                'opentrons/opentrons_1_trash_1100ml_fixed/1': fixed_trash_def,
                'custom_beta/custom_labware/1': custom_labware,
                'opentrons/opentrons_96_tiprack_10ul/1': tiprack_def}
            result['bundled_python'] = {}

            # NOTE: this is copy-pasted from the .py fixture file
            result['metadata'] = {'author': 'MISTER FIXTURE'}

            # make binary zipfile
            binary_zipfile = io.BytesIO()
            with zipfile.ZipFile(binary_zipfile, 'w') as z:
                z.writestr('labware/custom_labware.json',
                           json.dumps(custom_labware))
                z.writestr('labware/tiprack.json', json.dumps(tiprack_def))
                z.writestr('labware/fixed_trash.json',
                           json.dumps(fixed_trash_def))
                z.writestr('protocol.ot2.py', result['contents'])
                z.writestr('data/data.txt',
                           result['bundled_data']['data.txt'])
            binary_zipfile.seek(0)
            result['binary_zipfile'] = binary_zipfile.read()
            binary_zipfile.seek(0)
            result['filelike'] = binary_zipfile

        elif fixture_name == 'no_root_files_bundle':
            binary_zipfile = io.BytesIO()
            with zipfile.ZipFile(binary_zipfile, 'w') as z:
                z.writestr('inner_dir/protocol.ot2.py', empty_protocol)
            binary_zipfile.seek(0)
            result['binary_zipfile'] = binary_zipfile.read()
            binary_zipfile.seek(0)
            result['filelike'] = binary_zipfile
        elif fixture_name == 'no_entrypoint_protocol_bundle':
            binary_zipfile = io.BytesIO()
            with zipfile.ZipFile(binary_zipfile, 'w') as z:
                z.writestr('rando_pyfile_name.py', empty_protocol)
            binary_zipfile.seek(0)
            result['binary_zipfile'] = binary_zipfile.read()
            binary_zipfile.seek(0)
            result['filelike'] = binary_zipfile
        elif fixture_name == 'conflicting_labware_bundle':
            binary_zipfile = io.BytesIO()
            with zipfile.ZipFile(binary_zipfile, 'w') as z:
                plate_def = get_std_labware('biorad_96_wellplate_200ul_pcr')
                z.writestr('protocol.ot2.py', empty_protocol)
                z.writestr(
                    'labware/fixed_trash.json', json.dumps(fixed_trash_def))
                z.writestr('labware/plate.json', json.dumps(plate_def))
                z.writestr('labware/same_plate.json', json.dumps(plate_def))
            binary_zipfile.seek(0)
            result['binary_zipfile'] = binary_zipfile.read()
            binary_zipfile.seek(0)
            result['filelike'] = binary_zipfile
        elif fixture_name == 'missing_labware_bundle':
            # parsing should fail b/c this bundle lacks labware defs.
            with open(fixture_dir / 'protocol.py', 'r') as f:
                protocol_contents = f.read()
            binary_zipfile = io.BytesIO()
            with zipfile.ZipFile(binary_zipfile, 'w') as z:
                z.writestr('protocol.ot2.py', protocol_contents)
            binary_zipfile.seek(0)
            result['binary_zipfile'] = binary_zipfile.read()
            binary_zipfile.seek(0)
            result['filelike'] = binary_zipfile
        else:
            raise ValueError(f'get_bundle_fixture has no case to handle '
                             f'fixture "{fixture_name}"')
        return result

    return _get_bundle_protocol_fixture
