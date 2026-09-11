"""Tests for our client of key-server's HTTP API."""

from __future__ import annotations

from contextlib import AsyncExitStack
from pathlib import Path
from typing import AsyncGenerator, Final

import aiohttp
import aiohttp.web
import pytest

from server_utils.keys.key_server import (
    SIGN_MESSAGE_ENDPOINT_PATH,
    LocalHTTPClient,
    SignedMessageData,
    SignMessageData,
)


class AppMock:
    """A fake AIOHTTP app to test the client against.

    This should mirror the HTTP API of our real key-server.
    """

    sign_message_response: object
    """The JSON body the server should respond with to a sign-message request."""

    sign_message_response_status: int
    """The HTTP status code the server should respond with to a sign-message request."""

    sign_message_requests: list[object]
    """When the server receives a sign-message request, it records the request body here."""

    sign_message_request_content_types: list[str | None]
    """When the server receives a sign-message request, it records the Content-Type header here."""

    app: Final[aiohttp.web.Application]

    def __init__(self) -> None:
        self.sign_message_response = {}
        self.sign_message_response_status = 200
        self.sign_message_requests = []
        self.sign_message_request_content_types = []

        app = aiohttp.web.Application()
        app.router.add_post(f"/{SIGN_MESSAGE_ENDPOINT_PATH}", self._post_sign_message)
        self.app = app

    async def _post_sign_message(
        self, request: aiohttp.web.Request
    ) -> aiohttp.web.Response:
        self.sign_message_request_content_types.append(
            request.headers.get("Content-Type")
        )
        body = await request.json()
        self.sign_message_requests.append(body)
        return aiohttp.web.json_response(
            data=self.sign_message_response,
            status=self.sign_message_response_status,
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
                LocalHTTPClient(key_server_uds=str(socket_path))
            )

            yield (app_mock, client)

        else:  # mock_server_type == "tcp"
            tcp_site = aiohttp.web.TCPSite(runner, host="localhost", port=0)
            await tcp_site.start()
            exit_stack.push_async_callback(tcp_site.stop)

            port = runner.addresses[0][1]
            url = f"http://localhost:{port}"

            client = await exit_stack.enter_async_context(
                LocalHTTPClient(key_server_url=url)
            )

            yield (app_mock, client)


async def test_sign_message(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """Test that the client can send a well-formed sign-message and parse the response."""
    app_mock, client = mock_server

    app_mock.sign_message_response = {
        "data": {
            "message": "Started run abc-123",
            "messageHash": "sha256:aGFzaA==",
            "messageSignature": "ed25519:c2ln",
            "signatureVersion": 1,
        }
    }

    message = SignMessageData(
        message="Started run abc-123",
        previousHash="sha256:cHJldg==",
    )
    result = await client.sign_message(message)

    assert result == SignedMessageData(
        message="Started run abc-123",
        messageHash="sha256:aGFzaA==",
        messageSignature="ed25519:c2ln",
        signatureVersion=1,
    )
    assert app_mock.sign_message_requests == [
        {
            "data": {
                "message": "Started run abc-123",
                "previousHash": "sha256:cHJldg==",
            }
        }
    ]


async def test_sign_message_previous_hash_none(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """A `None` previousHash should serialize to JSON `null` in the request body."""
    app_mock, client = mock_server

    app_mock.sign_message_response = {
        "data": {
            "message": "first message",
            "messageHash": "sha256:aGFzaA==",
            "messageSignature": "ed25519:c2ln",
            "signatureVersion": 1,
        }
    }

    message = SignMessageData(
        message="first message",
        previousHash=None,
    )
    await client.sign_message(message)

    assert len(app_mock.sign_message_requests) == 1
    request_body = app_mock.sign_message_requests[0]
    assert isinstance(request_body, dict)
    # Verify "previousHash" was sent as null, not omitted.
    assert "previousHash" in request_body["data"]
    assert request_body["data"]["previousHash"] is None


async def test_sign_message_http_error(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """A non-2xx response from key-server should be raised as an exception."""
    app_mock, client = mock_server

    app_mock.sign_message_response = {"errors": [{"detail": "boom"}]}
    app_mock.sign_message_response_status = 500

    message = SignMessageData(
        message="anything",
        previousHash=None,
    )

    with pytest.raises(aiohttp.ClientResponseError):
        await client.sign_message(message)


async def test_sign_message_sends_json_content_type(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """The client should send the request as application/json (not form-encoded)."""
    app_mock, client = mock_server

    app_mock.sign_message_response = {
        "data": {
            "message": "anything",
            "messageHash": "sha256:aGFzaA==",
            "messageSignature": "ed25519:c2ln",
            "signatureVersion": 1,
        }
    }

    message = SignMessageData(
        message="anything",
        previousHash=None,
    )
    await client.sign_message(message)

    assert app_mock.sign_message_request_content_types == ["application/json"]


async def test_sign_message_raises_when_uds_server_unreachable(
    tmp_path: Path,
) -> None:
    """If the UDS server can't be contacted, the client must raise.

    No socket file exists at the configured path, so aiohttp should raise a
    connection-related error rather than returning a synthesized success.
    """
    socket_path = str(tmp_path / "does-not-exist.sock")

    async with LocalHTTPClient(key_server_uds=socket_path) as client:
        with pytest.raises(aiohttp.ClientConnectionError):
            await client.sign_message(SignMessageData(message="hi", previousHash=None))


async def test_sign_message_raises_when_tcp_server_unreachable() -> None:
    """If the TCP server can't be contacted, the client must raise."""
    # Port 1 is privileged and almost certainly not listening; the connection
    # should be refused (or otherwise fail), surfacing as a connection error.
    async with LocalHTTPClient(key_server_url="http://127.0.0.1:1") as client:
        with pytest.raises(aiohttp.ClientConnectionError):
            await client.sign_message(SignMessageData(message="hi", previousHash=None))


def test_invalid_constructor_args_both_specified() -> None:
    """Passing both `key_server_uds` and `key_server_url` should raise."""
    with pytest.raises(ValueError):
        LocalHTTPClient(
            key_server_uds="/tmp/sock",
            key_server_url="http://localhost:1234",
        )


def test_invalid_constructor_args_neither_specified() -> None:
    """Passing neither `key_server_uds` nor `key_server_url` should raise."""
    with pytest.raises(ValueError):
        LocalHTTPClient()
