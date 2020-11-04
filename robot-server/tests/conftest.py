import subprocess
import time
import sys
import tempfile
import os
import shutil
import json
import pathlib
from unittest.mock import MagicMock

import requests
from fastapi import routing
import pytest
from datetime import datetime

from opentrons.protocols.implementations.labware import LabwareImplementation
from starlette.testclient import TestClient
from robot_server.constants import API_VERSION_HEADER, API_VERSION_LATEST
from robot_server.service.app import app
from robot_server.service.dependencies import get_hardware, verify_hardware
from opentrons.hardware_control import API, HardwareAPILike, ThreadedAsyncLock
from opentrons import config

from opentrons.calibration_storage import delete, modify, helpers
from opentrons.protocol_api import labware
from opentrons.types import Point, Mount
from opentrons.protocols.geometry.deck import Deck

from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.session.manager import SessionManager

test_router = routing.APIRouter()


@test_router.get('/alwaysRaise')
async def always_raise():
    raise RuntimeError

app.include_router(test_router)


@pytest.fixture
def hardware():
    return MagicMock(spec=API)


@pytest.fixture
def override_hardware(hardware):

    async def get_hardware_override() -> HardwareAPILike:
        """Override for get_hardware dependency"""
        return hardware

    async def verify_hardware_override():
        pass

    app.dependency_overrides[verify_hardware] = verify_hardware_override
    app.dependency_overrides[get_hardware] = get_hardware_override


@pytest.fixture
def api_client(override_hardware) -> TestClient:
    client = TestClient(app)
    client.headers.update({API_VERSION_HEADER: API_VERSION_LATEST})
    return client


@pytest.fixture
def api_client_no_errors(override_hardware) -> TestClient:
    """ An API client that won't raise server exceptions.
    Use only to test 500 pages; never use this for other tests. """
    client = TestClient(app, raise_server_exceptions=False)
    client.headers.update({API_VERSION_HEADER: API_VERSION_LATEST})
    return client


@pytest.fixture(scope="session")
def request_session():
    session = requests.Session()
    session.headers.update({API_VERSION_HEADER: API_VERSION_LATEST})
    return session


@pytest.fixture(scope="session")
def server_temp_directory():
    new_dir = tempfile.mkdtemp()
    os.environ['OT_API_CONFIG_DIR'] = new_dir
    config.reload()

    yield new_dir
    shutil.rmtree(new_dir)

    del os.environ['OT_API_CONFIG_DIR']


@pytest.fixture(scope="session")
def run_server(request_session, server_temp_directory):
    with subprocess.Popen([sys.executable, "-m", "robot_server.main"],
                          env={'OT_ROBOT_SERVER_DOT_ENV_PATH': "test.env",
                               'OT_API_CONFIG_DIR': server_temp_directory},
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE) as proc:
        # Wait for a bit to get started by polling /health
        # TODO (lc, 23-06-2020) We should investigate
        # using symlinks for the file copy to avoid
        # having such a long delay
        from requests.exceptions import ConnectionError
        while True:
            try:
                request_session.get("http://localhost:31950/health")
            except ConnectionError:
                pass
            else:
                break
            time.sleep(0.5)
        request_session.post("http://localhost:31950/robot/home",
                             json={"target": "robot"})
        yield proc
        proc.kill()


@pytest.fixture
def attach_pipettes(server_temp_directory):
    import json

    pipette = {
        "dropTipShake": True,
        "model": "p300_multi_v1"
    }

    pipette_dir_path = os.path.join(server_temp_directory, 'pipettes')
    pipette_file_path = os.path.join(pipette_dir_path, 'testpipette01.json')

    with open(pipette_file_path, 'w') as pipette_file:
        json.dump(pipette, pipette_file)
    yield
    os.remove(pipette_file_path)


@pytest.fixture
def set_up_index_file_temporary_directory(server_temp_directory):
    delete.clear_calibrations()
    deck = Deck()
    labware_list = [
        'nest_96_wellplate_2ml_deep',
        'corning_384_wellplate_112ul_flat',
        'geb_96_tiprack_1000ul',
        'nest_12_reservoir_15ml',
        'opentrons_96_tiprack_10ul']
    for idx, name in enumerate(labware_list):
        parent = deck.position_for(idx + 1)
        definition = labware.get_labware_definition(name)
        lw = labware.Labware(
            implementation=LabwareImplementation(definition, parent)
        )
        labware.save_calibration(lw, Point(0, 0, 0))


@pytest.fixture
def set_up_pipette_offset_temp_directory(server_temp_directory):
    attached_pip_list = ['123', '321']
    mount_list = [Mount.LEFT, Mount.RIGHT]
    definition =\
        labware.get_labware_definition('opentrons_96_filtertiprack_200ul')
    def_hash = helpers.hash_labware_def(definition)
    for pip, mount in zip(attached_pip_list, mount_list):
        modify.save_pipette_calibration(
            offset=Point(0, 0, 0),
            pip_id=pip,
            mount=mount,
            tiprack_hash=def_hash,
            tiprack_uri='opentrons/opentrons_96_filtertiprack_200ul/1')


@pytest.fixture
def set_up_tip_length_temp_directory(server_temp_directory):
    attached_pip_list = ['123', '321']
    tip_length_list = [30.5, 31.5]
    definition =\
        labware.get_labware_definition('opentrons_96_filtertiprack_200ul')
    def_hash = helpers.hash_labware_def(definition)
    for pip, tip_len in zip(attached_pip_list, tip_length_list):
        cal = {def_hash: {
            'tipLength': tip_len,
            'lastModified': datetime.now()}}
        modify.save_tip_length_calibration(pip, cal)


@pytest.fixture
def set_up_deck_calibration_temp_directory(server_temp_directory):
    attitude = [
        [1.0008, 0.0052, 0.0],
        [-0.0, 0.992, 0.0],
        [0.0, 0.0, 1.0]]
    modify.save_robot_deck_attitude(attitude, 'pip_1', 'fakehash')


@pytest.fixture
def session_manager(hardware) -> SessionManager:
    return SessionManager(hardware=hardware,
                          motion_lock=ThreadedAsyncLock(),
                          protocol_manager=ProtocolManager())


@pytest.fixture
def set_enable_http_protocol_sessions(request_session):
    """For integration tests that need to set then clear the
    enableHttpProtocolSessions feature flag"""
    url = "http://localhost:31950/settings"
    data = {
        "id": "enableHttpProtocolSessions",
        "value": True
    }
    request_session.post(url, json=data)
    yield None
    data['value'] = None
    request_session.post(url, json=data)


@pytest.fixture
def get_labware_fixture():
    def _get_labware_fixture(fixture_name):
        with open(
            (pathlib.Path(__file__).parent / '..' / '..' / 'shared-data' /
             'labware' / 'fixtures' / '2' / f'{fixture_name}.json'),
            'rb'
        ) as f:
            return json.loads(f.read().decode('utf-8'))

    return _get_labware_fixture
