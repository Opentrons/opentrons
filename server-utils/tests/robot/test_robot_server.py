"""Tests for our client of robot-server's HTTP API."""

from __future__ import annotations

from contextlib import AsyncExitStack
from pathlib import Path
from typing import AsyncGenerator, Final

import aiohttp
import aiohttp.web
import pytest

from server_utils.robot.robot_server import (
    HEALTH_ENDPOINT_PATH,
    LocalHTTPClient,
    RobotNameandSerial,
)


class AppMock:
    """A fake AIOHTTP app to test the client against.

    This should mirror the HTTP API of our real robot-server.
    """

    get_name_and_serial_response: object
    """The JSON body the server should respond with to a get_name_and_serial request."""

    get_name_and_serial_response_status: int
    """The HTTP status code the server should respond with to a get_name_and_serialrequest."""

    app: Final[aiohttp.web.Application]

    def __init__(self) -> None:
        self.get_name_and_serial_response = {}
        self.get_name_and_serial_response_status = 200

        app = aiohttp.web.Application()
        app.router.add_get(
            f"/{HEALTH_ENDPOINT_PATH}", self._get_name_and_serial_request_content_types
        )
        self.app = app

    async def _get_name_and_serial_request_content_types(
        self, request: aiohttp.web.Request
    ) -> aiohttp.web.Response:
        return aiohttp.web.json_response(
            data=self.get_name_and_serial_response,
            status=self.get_name_and_serial_response_status,
        )


@pytest.fixture(params=["unix_domain_socket", "tcp"])
async def mock_server(
    request: pytest.FixtureRequest,
    tmp_path_factory: pytest.TempPathFactory,
) -> AsyncGenerator[tuple[AppMock, LocalHTTPClient], None]:
    """Return a fake server, and a real client pointed at that fake server.

    Parametrized over two connection types: Unix domain socket, and TCP.
    """
    async with AsyncExitStack() as exit_stack:
        app_mock = AppMock()

        runner = aiohttp.web.AppRunner(app_mock.app)

        await runner.setup()
        exit_stack.push_async_callback(runner.cleanup)

        mock_server_type = request.param

        if mock_server_type == "unix_domain_socket":
            socket_path = tmp_path_factory.mktemp("mock") / "sock"

            unix_site = aiohttp.web.UnixSite(runner, socket_path)
            await unix_site.start()
            exit_stack.push_async_callback(unix_site.stop)

            client = await exit_stack.enter_async_context(
                LocalHTTPClient(robot_server_uds=str(socket_path))
            )

            yield (app_mock, client)

        else:  # mock_server_type == "tcp"
            tcp_site = aiohttp.web.TCPSite(runner, host="localhost", port=0)
            await tcp_site.start()
            exit_stack.push_async_callback(tcp_site.stop)

            port = runner.addresses[0][1]
            url = f"http://localhost:{port}"

            client = await exit_stack.enter_async_context(
                LocalHTTPClient(robot_server_url=url)
            )

            yield (app_mock, client)


async def test_get_name_and_serial(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """Test that the client can send a well-formed get_name_and_serial and parse the response."""
    app_mock, client = mock_server

    app_mock.get_name_and_serial_response = {
        "name": "my cool robot",
        "robot_serial": "987-zyx",
    }

    result = await client.get_name_and_serial()

    assert result == RobotNameandSerial(
        name="my cool robot",
        serial="987-zyx",
    )


async def test_get_name_and_serial_http_error(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """A non-2xx response from robot-server should be raised as an exception."""
    app_mock, client = mock_server

    app_mock.get_name_and_serial_response = {"errors": [{"detail": "oops"}]}
    app_mock.get_name_and_serial_response_status = 500

    with pytest.raises(aiohttp.ClientResponseError):
        await client.get_name_and_serial()


async def test_get_name_and_serial_raises_when_uds_server_unreachable(
    tmp_path: Path,
) -> None:
    """If the UDS server can't be contacted, the client must raise.

    No socket file exists at the configured path, so aiohttp should raise a
    connection-related error rather than returning a synthesized success.
    """
    socket_path = str(tmp_path / "does-not-exist.sock")

    async with LocalHTTPClient(robot_server_uds=socket_path) as client:
        with pytest.raises(aiohttp.ClientConnectionError):
            await client.get_name_and_serial()


async def test_get_name_and_serial_raises_when_tcp_server_unreachable() -> None:
    """If the TCP server can't be contacted, the client must raise."""
    # Port 1 is privileged and almost certainly not listening; the connection
    # should be refused (or otherwise fail), surfacing as a connection error.
    async with LocalHTTPClient(robot_server_url="http://127.0.0.1:1") as client:
        with pytest.raises(aiohttp.ClientConnectionError):
            await client.get_name_and_serial()


def test_invalid_constructor_args_both_specified() -> None:
    """Passing both `robot_server_uds` and `robot_server_url` should raise."""
    with pytest.raises(ValueError):
        LocalHTTPClient(
            robot_server_uds="/tmp/sock",
            robot_server_url="http://localhost:1234",
        )


def test_invalid_constructor_args_neither_specified() -> None:
    """Passing neither `robot_server_uds` nor `robot_server_url` should raise."""
    with pytest.raises(ValueError):
        LocalHTTPClient()
