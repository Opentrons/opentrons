import subprocess
import time
import sys
import tempfile
import os
import shutil
from unittest.mock import MagicMock

import requests
from fastapi import routing
import pytest
from starlette.testclient import TestClient
from robot_server.service.app import app
from robot_server.service.dependencies import get_hardware, verify_hardware
from opentrons.hardware_control import API, HardwareAPILike, ThreadedAsyncLock
from opentrons import config

from opentrons.calibration_storage import delete, modify
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
    return TestClient(app)


@pytest.fixture
def api_client_no_errors(override_hardware) -> TestClient:
    """ An API client that won't raise server exceptions.
    Use only to test 500 pages; never use this for other tests. """
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(scope="session")
def server_temp_directory():
    new_dir = tempfile.mkdtemp()
    os.environ['OT_API_CONFIG_DIR'] = new_dir
    config.reload()

    yield new_dir
    shutil.rmtree(new_dir)

    del os.environ['OT_API_CONFIG_DIR']


@pytest.fixture(scope="session")
def run_server(server_temp_directory):
    with subprocess.Popen([sys.executable, "-m", "robot_server.main"],
                          env={'OT_ROBOT_SERVER_DOT_ENV_PATH': "test.env",
                               'OT_API_CONFIG_DIR': server_temp_directory},
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE) as proc:
        # Wait for a bit to get started by polling /health
        # TODO (lc, 23-06-2020) We should investigate
        # using symlinks for the file copy to avoid
        # having such a long delay
        import requests
        from requests.exceptions import ConnectionError
        while True:
            try:
                requests.get("http://localhost:31950/health")
            except ConnectionError:
                pass
            else:
                break
            time.sleep(0.5)

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
        parent = deck.position_for(idx+1)
        definition = labware.get_labware_definition(name)
        lw = labware.Labware(definition, parent)
        labware.save_calibration(lw, Point(0, 0, 0))


@pytest.fixture
def set_up_pipette_offset_temp_directory(server_temp_directory):
    delete.clear_pipette_offset_calibrations()
    pip_list = ['pip_1', 'pip_2']
    mount_list = [Mount.LEFT, Mount.RIGHT]
    for pip, mount in zip(pip_list, mount_list):
        modify.save_pipette_calibration(
            offset=Point(0, 0, 0),
            pip_id=pip,
            mount=mount,
            tiprack_hash='hash',
            tiprack_uri='uri')


@pytest.fixture
def session_manager(hardware) -> SessionManager:
    return SessionManager(hardware=hardware,
                          motion_lock=ThreadedAsyncLock(),
                          protocol_manager=ProtocolManager())


@pytest.fixture
def set_enable_http_protocol_sessions():
    """For integration tests that need to set then clear the
    enableHttpProtocolSessions feature flag"""
    url = "http://localhost:31950/settings"
    data = {
        "id": "enableHttpProtocolSessions",
        "value": True
    }
    requests.post(url, json=data)
    yield None
    data['value'] = None
    requests.post(url, json=data)
