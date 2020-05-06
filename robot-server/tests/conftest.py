import subprocess
import time
import sys
from unittest.mock import MagicMock

import pytest
from starlette.testclient import TestClient
from robot_server.service.app import app
from robot_server.service.dependencies import get_hardware
from opentrons.hardware_control import API, HardwareAPILike


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
def run_server():
    with subprocess.Popen([sys.executable, "-m", "robot_server.main"],
                          env={'OT_ROBOT_SERVER_DOT_ENV_PATH': 'dev.env',
                               'OT_API_FF_useFastApi': 'true'},
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE) as proc:
        # Wait for a bit to get started
        time.sleep(3)
        yield proc


@pytest.fixture
def attach_pipettes():
    import json
    import os
    pipette = {
        "dropTipShake": True,
        "model": "p300_multi_v1"
    }
    pipette_file_path = os.path.join(
        os.path.expanduser('~'), '.opentrons/pipettes', 'testpipette01.json'
    )
    with open(pipette_file_path, 'w') as pipette_file:
        json.dump(pipette, pipette_file)
    yield
    os.remove(pipette_file_path)
