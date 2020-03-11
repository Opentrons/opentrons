import pytest
from starlette.testclient import TestClient
from robot_server.service.main import app
from robot_server.service.dependencies import get_hardware
from opentrons.hardware_control import ThreadManager, API, HardwareAPILike


async def get_hardware_override() -> HardwareAPILike:
    """Override for get_hardware dependency"""
    return ThreadManager(API.build_hardware_simulator)


@pytest.fixture
def api_client() -> TestClient:
    app.dependency_overrides[get_hardware] = get_hardware_override
    return TestClient(app)
