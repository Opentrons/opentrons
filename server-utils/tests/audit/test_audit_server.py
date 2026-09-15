"""Tests for our client of audit-server's HTTP API."""

from __future__ import annotations

from contextlib import AsyncExitStack
from datetime import datetime, timezone
from typing import AsyncGenerator, Final

import aiohttp
import aiohttp.web
import pytest

from server_utils.audit.audit_server import (
    LOG_MESSAGE_ENDPOINT_PATH,
    LocalHTTPClient,
    NoOpClient,
    SubmitAuditLogMessageData,
    SubmitAuditLogSuccessData,
)


class AppMock:
    """A fake AIOHTTP app to test the client against.

    This should mirror the HTTP API of our real audit-server.
    """

    log_message_response: object
    """The JSON body the server should respond with to a log-message request."""

    log_message_response_status: int
    """The HTTP status code the server should respond with to a log-message request."""

    log_message_requests: list[object]
    """When the server receives a log-message request, it records the request body here."""

    log_message_request_content_types: list[str | None]
    """When the server receives a log-message request, it records the Content-Type header here."""

    app: Final[aiohttp.web.Application]

    def __init__(self) -> None:
        self.log_message_response = {}
        self.log_message_response_status = 201
        self.log_message_requests = []
        self.log_message_request_content_types = []

        app = aiohttp.web.Application()
        app.router.add_post(f"/{LOG_MESSAGE_ENDPOINT_PATH}", self._post_log_message)
        self.app = app

    async def _post_log_message(
        self, request: aiohttp.web.Request
    ) -> aiohttp.web.Response:
        self.log_message_request_content_types.append(
            request.headers.get("Content-Type")
        )
        body = await request.json()
        self.log_message_requests.append(body)
        return aiohttp.web.json_response(
            data=self.log_message_response,
            status=self.log_message_response_status,
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
                LocalHTTPClient(audit_server_uds=str(socket_path))
            )

            yield (app_mock, client)

        else:  # mock_server_type == "tcp"
            tcp_site = aiohttp.web.TCPSite(runner, host="localhost", port=0)
            await tcp_site.start()
            exit_stack.push_async_callback(tcp_site.stop)

            port = runner.addresses[0][1]
            url = f"http://localhost:{port}"

            client = await exit_stack.enter_async_context(
                LocalHTTPClient(audit_server_url=url)
            )

            yield (app_mock, client)


async def test_submit_log_message(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """Test that the client can send a well-formed log message and parse the response."""
    app_mock, client = mock_server

    logged_at = datetime(2026, 6, 5, 12, 0, 0, tzinfo=timezone.utc)
    app_mock.log_message_response = {"data": {"loggedAt": logged_at.isoformat()}}

    message = SubmitAuditLogMessageData(
        action="run.start",
        accountName="alice",
        legalName="Alice Anderson",
        message="Started run abc-123",
        reason="Routine experiment",
    )
    result = await client.submit_log_message(message)

    assert result == SubmitAuditLogSuccessData(loggedAt=logged_at)
    assert app_mock.log_message_requests == [
        {
            "data": {
                "action": "run.start",
                "accountName": "alice",
                "legalName": "Alice Anderson",
                "message": "Started run abc-123",
                "reason": "Routine experiment",
            }
        }
    ]


async def test_submit_log_message_reason_none(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """A `None` reason should serialize to JSON `null` in the request body."""
    app_mock, client = mock_server

    logged_at = datetime(2026, 6, 5, 12, 0, 0, tzinfo=timezone.utc)
    app_mock.log_message_response = {"data": {"loggedAt": logged_at.isoformat()}}

    message = SubmitAuditLogMessageData(
        action="run.start",
        accountName="alice",
        legalName="Alice Anderson",
        message="Started run abc-123",
        reason=None,
    )
    result = await client.submit_log_message(message)

    assert result == SubmitAuditLogSuccessData(loggedAt=logged_at)
    assert len(app_mock.log_message_requests) == 1
    request_body = app_mock.log_message_requests[0]
    assert isinstance(request_body, dict)
    # Verify "reason" was sent as null, not omitted.
    assert "reason" in request_body["data"]
    assert request_body["data"]["reason"] is None


async def test_submit_log_message_http_error(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """A non-2xx response from audit-server should be raised as an exception."""
    app_mock, client = mock_server

    app_mock.log_message_response = {"errors": [{"detail": "boom"}]}
    app_mock.log_message_response_status = 500

    message = SubmitAuditLogMessageData(
        action="run.start",
        accountName="alice",
        legalName="Alice Anderson",
        message="Started run abc-123",
        reason=None,
    )

    with pytest.raises(aiohttp.ClientResponseError):
        await client.submit_log_message(message)


def test_invalid_constructor_args_both_specified() -> None:
    """Passing both `audit_server_uds` and `audit_server_url` should raise."""
    with pytest.raises(ValueError):
        LocalHTTPClient(
            audit_server_uds="/tmp/sock",
            audit_server_url="http://localhost:1234",
        )


def test_invalid_constructor_args_neither_specified() -> None:
    """Passing neither `audit_server_uds` nor `audit_server_url` should raise."""
    with pytest.raises(ValueError):
        LocalHTTPClient()


async def test_noop_client() -> None:
    """`NoOpClient.submit_log_message` returns a success without contacting any server."""
    client = NoOpClient()
    message = SubmitAuditLogMessageData(
        action="run.start",
        accountName="alice",
        legalName="Alice Anderson",
        message="Started run abc-123",
        reason=None,
    )

    before = datetime.now(timezone.utc)
    result = await client.submit_log_message(message)
    after = datetime.now(timezone.utc)

    assert isinstance(result, SubmitAuditLogSuccessData)
    assert before <= result.loggedAt <= after


async def test_submit_log_message_sends_json_content_type(
    mock_server: tuple[AppMock, LocalHTTPClient],
) -> None:
    """The client should send the request as application/json (not form-encoded)."""
    app_mock, client = mock_server

    logged_at = datetime(2026, 6, 5, 12, 0, 0, tzinfo=timezone.utc)
    app_mock.log_message_response = {"data": {"loggedAt": logged_at.isoformat()}}

    message = SubmitAuditLogMessageData(
        action="run.start",
        accountName="alice",
        legalName="Alice Anderson",
        message="Started run abc-123",
        reason="why",
    )
    await client.submit_log_message(message)

    assert app_mock.log_message_request_content_types == ["application/json"]
