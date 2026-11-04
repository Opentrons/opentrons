"""Tests for attaching a fallback audit logger on permission denial."""

from typing import Any

import pytest
from decoy import Decoy
from fastapi import FastAPI
from starlette.requests import Request

from server_utils.audit.audit_logger import AuditLogger
from server_utils.audit.audit_server import Client, SubmitAuditLogMessageData
from server_utils.audit.fastapi import USER_NOTES_HEADER, install_audit_client
from server_utils.audit.permission_denied import (
    PERMISSION_DENIED_MESSAGE,
    attach_permission_denied_audit_logger,
)
from server_utils.auth.resource_server.types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
)

_AUTHENTICATED = AuthenticatedResult(
    username="tester",
    fullname="Test User",
    scope="",
)


@pytest.fixture()
def mock_audit_client(decoy: Decoy) -> Client:
    return decoy.mock(cls=Client)


@pytest.fixture()
def app(mock_audit_client: Client) -> FastAPI:
    application = FastAPI()
    install_audit_client(application.state, mock_audit_client)
    return application


def _make_request(
    app: FastAPI,
    *,
    method: str = "POST",
    path: str = "/protocols",
    headers: dict[str, str] | None = None,
) -> Request:
    header_list: list[tuple[bytes, bytes]] = []
    if headers is not None:
        header_list = [
            (key.lower().encode("latin-1"), value.encode("latin-1"))
            for key, value in headers.items()
        ]
    scope: dict[str, Any] = {
        "type": "http",
        "asgi": {"spec_version": "2.0", "version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": header_list,
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
        "app": app,
    }
    return Request(scope)


async def test_attaches_logger_for_authenticated_mutating_request(
    app: FastAPI,
    mock_audit_client: Client,
    decoy: Decoy,
) -> None:
    """It should attach a logger with request action, identity, and denial message."""
    request = _make_request(
        app,
        headers={USER_NOTES_HEADER: "line%201%20reason"},
    )

    attach_permission_denied_audit_logger(request, _AUTHENTICATED)

    audit_logger = request.state.audit_logger
    assert isinstance(audit_logger, AuditLogger)
    assert audit_logger.request is request

    await audit_logger.log()
    decoy.verify(
        await mock_audit_client.submit_log_message(
            SubmitAuditLogMessageData(
                action="POST /protocols",
                accountName="tester",
                legalName="Test User",
                message=PERMISSION_DENIED_MESSAGE,
                reason="line 1 reason",
            )
        )
    )


async def test_does_not_attach_for_get(
    app: FastAPI,
) -> None:
    request = _make_request(app, method="GET")

    attach_permission_denied_audit_logger(request, _AUTHENTICATED)

    assert getattr(request.state, "audit_logger", None) is None


async def test_does_not_attach_without_authenticated_user(
    app: FastAPI,
) -> None:
    request = _make_request(app)

    attach_permission_denied_audit_logger(request, AuthenticationNotRequiredResult())

    assert getattr(request.state, "audit_logger", None) is None


async def test_does_not_attach_without_audit_client() -> None:
    request = _make_request(FastAPI())

    attach_permission_denied_audit_logger(request, _AUTHENTICATED)

    assert getattr(request.state, "audit_logger", None) is None


async def test_does_not_replace_existing_audit_logger(
    app: FastAPI,
    mock_audit_client: Client,
) -> None:
    request = _make_request(app)
    existing = AuditLogger(
        audit_client=mock_audit_client,
        request=request,
        auto_log_request_head=True,
        auto_log_response_head=True,
        auto_log_request_body=True,
        auto_log_response_body=True,
        auto_log_request_full_headers=False,
    ).set_action("named action")
    request.state.audit_logger = existing

    attach_permission_denied_audit_logger(request, _AUTHENTICATED)

    assert request.state.audit_logger is existing


@pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
async def test_attaches_for_each_mutating_method(
    app: FastAPI,
    method: str,
) -> None:
    request = _make_request(app, method=method)

    attach_permission_denied_audit_logger(request, _AUTHENTICATED)

    assert isinstance(request.state.audit_logger, AuditLogger)


async def test_whitespace_only_user_notes_are_omitted(
    app: FastAPI,
    mock_audit_client: Client,
    decoy: Decoy,
) -> None:
    request = _make_request(app, headers={USER_NOTES_HEADER: "   "})

    attach_permission_denied_audit_logger(request, _AUTHENTICATED)

    await request.state.audit_logger.log()
    decoy.verify(
        await mock_audit_client.submit_log_message(
            SubmitAuditLogMessageData(
                action="POST /protocols",
                accountName="tester",
                legalName="Test User",
                message=PERMISSION_DENIED_MESSAGE,
                reason=None,
            )
        )
    )
