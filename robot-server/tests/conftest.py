import subprocess
import time
import sys
import tempfile
import os
import shutil
from unittest.mock import MagicMock

import pytest
from starlette.testclient import TestClient
from robot_server.service.app import app
from robot_server.service.dependencies import get_hardware
from opentrons.hardware_control import API, HardwareAPILike
from opentrons import config


@pytest.fixture
def hardware():
    return MagicMock(spec=API)


@pytest.fixture
def api_client(hardware) -> TestClient:

    async def get_hardware_override() -> HardwareAPILike:
        """Override for get_hardware dependency"""
        return hardware

    app.dependency_overrides[get_hardware] = get_hardware_override
    return TestClient(app)


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
        # Wait for a bit to get started
        # TODO (lc, 23-06-2020) We should investigate
        # using symlinks for the file copy to avoid
        # having such a long sleep
        time.sleep(15)
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
