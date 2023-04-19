import pytest
from httpx import HTTPStatusError
from typing import AsyncGenerator

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient


@pytest.fixture
async def client_no_system_server() -> AsyncGenerator[RobotClient, None]:
    robot_port = "54321"
    system_port = "65432"
    async with RobotClient.make(
        host="http://localhost",
        port=robot_port,
        version="*",
        system_server_port=system_port,
    ) as client:
        assert await client.wait_until_dead(), "Server is running and must not be."

        with DevServer(port=robot_port, system_server_port=system_port) as server:
            server.start()
            assert await client.wait_until_alive(), "Server never became available."
            server.system_server.stop()

            yield client


@pytest.mark.parametrize("version", ["2", "3", "4"])
async def test_missing_system_server_no_auth(
    client_no_system_server: RobotClient, version: str
) -> None:
    """Test for versions where authentication isn't required."""
    client_no_system_server.httpx_client.headers.update({"Opentrons-Version": version})
    assert (await client_no_system_server.get_protocols()).status_code == 200

    client_no_system_server.httpx_client.headers.update({"authenticationBearer": ""})
    assert (await client_no_system_server.get_protocols()).status_code == 200


@pytest.mark.parametrize("version", ["5", "*"])
async def test_missing_system_server_auth_failure(
    client_no_system_server: RobotClient, version: str
) -> None:
    """Test for versions where authentication is required."""
    client_no_system_server.httpx_client.headers.update({"Opentrons-Version": version})
    with pytest.raises(HTTPStatusError):
        await client_no_system_server.get_protocols()

    client_no_system_server.httpx_client.headers.update({"authenticationBearer": ""})
    with pytest.raises(HTTPStatusError):
        await client_no_system_server.get_protocols()
