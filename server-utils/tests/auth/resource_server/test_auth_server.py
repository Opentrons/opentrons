"""Tests for our client of auth-server's HTTP API."""

from __future__ import annotations

from contextlib import AsyncExitStack
from typing import AsyncGenerator, Final

import aiohttp.web
import pytest

from server_utils.auth.resource_server.auth_server import (
    ALL_AUTH_SETTINGS_ENDPOINT_PATH,
    CLIENT_ID,
    SETTINGS_ENDPOINT_PATH,
    TOKEN_INTROSPECTION_ENDPOINT_PATH,
    LocalHTTPClient,
)
from server_utils.auth.resource_server.types import (
    AuthSettingsResponse,
    AuthSettingsResponseData,
    TokenIntrospectionResponse,
)


class AppMock:
    """A fake AIOHTTP app to test the client against.

    This should mirror the HTTP API of our real auth-server.
    """

    introspect_response: object
    """How the server should respond to requests to its token introspection endpoint.

    A JSON-serializable object.
    """

    introspect_requests: list[object]
    """When the server receives a request to its token introspection endpoint,
    it records the request body here.
    """

    settings_response: object
    """How the server should respond to requests to its settings endpoint.

    A JSON-serializable object.
    """

    all_auth_settings_response: object
    """How the server should respond to GET /auth/settings."""

    app: Final[aiohttp.web.Application]

    def __init__(self) -> None:
        self.settings_response = {}
        self.all_auth_settings_response = {}
        self.introspect_response = {}
        self.introspect_requests = []

        app = aiohttp.web.Application()
        app.router.add_get(f"/{SETTINGS_ENDPOINT_PATH}", self._get_settings)
        app.router.add_get(
            f"/{ALL_AUTH_SETTINGS_ENDPOINT_PATH}",
            self._get_all_auth_settings,
        )
        app.router.add_post(
            f"/{TOKEN_INTROSPECTION_ENDPOINT_PATH}", self._post_introspect
        )
        self.app = app

    async def _get_settings(
        self, _request: aiohttp.web.Request
    ) -> aiohttp.web.Response:
        return aiohttp.web.json_response(data=self.settings_response)

    async def _get_all_auth_settings(
        self, _request: aiohttp.web.Request
    ) -> aiohttp.web.Response:
        return aiohttp.web.json_response(data=self.all_auth_settings_response)

    async def _post_introspect(
        self, request: aiohttp.web.Request
    ) -> aiohttp.web.Response:
        body = await request.post()
        self.introspect_requests.append(dict(body))
        return aiohttp.web.json_response(self.introspect_response)


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
                LocalHTTPClient(auth_server_uds=str(socket_path))
            )

            yield (app_mock, client)

        else:  # mock_server_type == "tcp"
            tcp_site = aiohttp.web.TCPSite(runner, host="localhost", port=0)
            await tcp_site.start()
            exit_stack.push_async_callback(tcp_site.stop)

            port = runner.addresses[0][1]
            url = f"http://localhost:{port}"

            client = await exit_stack.enter_async_context(
                LocalHTTPClient(auth_server_url=url)
            )

            yield (app_mock, client)


async def test_settings(mock_server: tuple[AppMock, LocalHTTPClient]) -> None:
    """Test that the client can retrieve auth settings."""
    app_mock, client = mock_server

    app_mock.settings_response = {"data": {"accessControlEnabled": False}}
    settings_result = await client.get_auth_settings()
    assert settings_result == AuthSettingsResponse(
        data=AuthSettingsResponseData(accessControlEnabled=False)
    )

    app_mock.settings_response = {"data": {"accessControlEnabled": True}}
    settings_result = await client.get_auth_settings()
    assert settings_result == AuthSettingsResponse(
        data=AuthSettingsResponseData(accessControlEnabled=True)
    )


async def test_token_introspection(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """Test that the client can send a well-formed token introspection request and retrieve the response."""
    app_mock, client = mock_server

    app_mock.introspect_response = {"active": False}
    introspect_response = await client.introspect_token("test-token")
    assert introspect_response == TokenIntrospectionResponse(active=False, scope="")
    assert app_mock.introspect_requests == [
        {"token": "test-token", "client_id": CLIENT_ID}
    ]

    app_mock.introspect_requests.clear()

    app_mock.introspect_response = {
        "active": True,
        "scope": "mama_mia papa_pia",
        "username": "test_username",
        "ot_fullname": "Test Fullname",
    }
    introspect_response = await client.introspect_token("test-token")
    assert introspect_response == TokenIntrospectionResponse(
        active=True,
        scope="mama_mia papa_pia",
        username="test_username",
        ot_fullname="Test Fullname",
    )
    assert app_mock.introspect_requests == [
        {"token": "test-token", "client_id": CLIENT_ID}
    ]
