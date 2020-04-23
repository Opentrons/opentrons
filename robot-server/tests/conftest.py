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


@pytest.fixture
def run_server():
    import multiprocessing as mp
    import os
    os.environ['OT_ROBOT_SERVER_DOT_ENV_PATH'] = "dev.env"
    os.environ['OT_API_FF_useFastApi'] = "true"

    def runner():
        from robot_server.main import main
        main()

    thread = mp.Process(target=runner)
    thread.start()
    yield thread
    thread.terminate()
