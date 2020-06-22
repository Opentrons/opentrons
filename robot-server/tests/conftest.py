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
def server_temporary_directory():
    new_dir = tempfile.mkdtemp()
    ## SOLUTION 1: Set API config environment again
    ## to be the new directory. Reload the configuration
    ## elements so that infer directory is called again
    os.environ['OT_API_CONFIG_DIR'] = new_dir
    config.reload()

    ## SOLUTION 2: Manually set the pipette config dict
    ## path to be the 'temporary directory / pipettes'
    # old_path = config.CONFIG['pipette_config_overrides_dir']
    # pipette_directory_path = os.path.join(new_dir, 'pipettes')
    # os.mkdir(pipette_directory_path)
    # config.CONFIG['pipette_config_overrides_dir'] = pipette_directory_path
    yield new_dir
    shutil.rmtree(new_dir)

    ## SOLUTION 1 clean up
    del os.environ['OT_API_CONFIG_DIR']

    ## SOLUTION 2 clean up
    # config.CONFIG['pipette_config_overrides_dir'] = old_path


@pytest.fixture(scope="session")
def run_server(server_temporary_directory):
    # Here we are loading the test.env into the temporary directory, then
    # adding in the OT_API_CONFIG_DIR environment variable to the subprocess
    shutil.copy(f'{os.getcwd()}/test.env', server_temporary_directory)
    with open(f'{server_temporary_directory}/test.env', 'a') as f:
        f.write(f'OT_API_CONFIG_DIR={server_temporary_directory}')
    with subprocess.Popen([sys.executable, "-m", "robot_server.main"],
                          env={'OT_ROBOT_SERVER_DOT_ENV_PATH': f'{server_temporary_directory}/test.env'},
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE) as proc:
        # Wait for a bit to get started
        time.sleep(2)
        yield proc
        proc.kill()


@pytest.fixture
def attach_pipettes(server_temporary_directory, monkeypatch):
    import json

    pipette = {
        "dropTipShake": True,
        "model": "p300_multi_v1"
    }
    ## SOLUTION 3: Use monkeypatch's set env to set the directory
    ## environment variable here
    # monkeypatch.setenv('OT_API_CONFIG_DIR', server_temporary_directory)

    pipette_dir_path = os.path.join(server_temporary_directory, 'pipettes')
    pipette_file_path = os.path.join(pipette_dir_path, 'testpipette01.json')

    with open(pipette_file_path, 'w') as pipette_file:
        json.dump(pipette, pipette_file)
    yield
    os.remove(pipette_file_path)
