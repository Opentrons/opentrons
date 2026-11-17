"""Tests that require_scopes persists denied mutating requests to the audit log."""

from datetime import datetime, timezone

import pytest
from decoy import Decoy, matchers
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from server_utils.audit.audit_server import (
    AuditSettingsResponseData,
    Client,
    SubmitAuditLogMessageData,
    SubmitAuditLogSuccessData,
)
from server_utils.audit.fastapi import (
    USER_NOTES_HEADER,
    audit_logger_middleware,
    get_audit_logger,
    install_audit_client,
)
from server_utils.audit.permission_denied import PERMISSION_DENIED_MESSAGE
from server_utils.auth.resource_server.authentication_checker import (
    AuthenticationChecker,
)
from server_utils.auth.resource_server.fastapi import (
    AuthorizationError,
    handle_authorization_error,
    install_authentication_checker,
    require_scopes,
)
from server_utils.auth.resource_server.types import (
    AuthenticatedResult,
    MissingTokenResult,
)
from server_utils.auth.scopes import Scope, serialize_scopes

_NAMED_ACTION = "protocol upload"
_USER_NOTES = "user documentation"
_TOKEN_WITHOUT_SCOPE = "token-no-scope"
_TOKEN_WITH_SCOPE = "token-write"


@pytest.fixture()
def mock_audit_client(decoy: Decoy) -> Client:
    return decoy.mock(cls=Client)


@pytest.fixture()
def mock_authentication_checker(decoy: Decoy) -> AuthenticationChecker:
    return decoy.mock(cls=AuthenticationChecker)


@pytest.fixture()
async def captured_logs(
    decoy: Decoy, mock_audit_client: Client
) -> list[SubmitAuditLogMessageData]:
    captured: list[SubmitAuditLogMessageData] = []

    async def _capture(
        message: SubmitAuditLogMessageData,
    ) -> SubmitAuditLogSuccessData:
        captured.append(message)
        return SubmitAuditLogSuccessData(loggedAt=datetime.now(timezone.utc))

    decoy.when(await mock_audit_client.submit_log_message(matchers.Anything())).then_do(
        _capture
    )
    return captured


def _authenticated(scopes: set[Scope]) -> AuthenticatedResult:
    return AuthenticatedResult(
        username="tester",
        fullname="Test User",
        scope=serialize_scopes(scopes),
    )


def _build_app(
    *,
    mock_audit_client: Client | None,
    mock_authentication_checker: AuthenticationChecker,
) -> FastAPI:
    app = FastAPI()
    if mock_audit_client is not None:
        install_audit_client(app.state, mock_audit_client)
    install_authentication_checker(app.state, mock_authentication_checker)
    app.middleware("http")(audit_logger_middleware)
    app.exception_handler(AuthorizationError)(handle_authorization_error)

    @app.post(
        "/protocols",
        dependencies=[
            Depends(require_scopes(Scope.PROTOCOLS_WRITE)),
            Depends(get_audit_logger(_NAMED_ACTION)),
        ],
    )
    def create_protocol() -> dict[str, str]:
        return {"ok": "ok"}

    @app.get(
        "/protocols",
        dependencies=[Depends(require_scopes(Scope.PROTOCOLS_WRITE))],
    )
    def get_protocols() -> dict[str, str]:
        return {"ok": "ok"}

    return app


def _client(
    mock_audit_client: Client | None,
    mock_authentication_checker: AuthenticationChecker,
) -> TestClient:
    return TestClient(
        _build_app(
            mock_audit_client=mock_audit_client,
            mock_authentication_checker=mock_authentication_checker,
        )
    )


async def test_persists_denied_mutating_request(
    decoy: Decoy,
    mock_audit_client: Client,
    mock_authentication_checker: AuthenticationChecker,
    captured_logs: list[SubmitAuditLogMessageData],
) -> None:
    decoy.when(
        await mock_authentication_checker.check(token=_TOKEN_WITHOUT_SCOPE)
    ).then_return(_authenticated(set()))
    decoy.when(await mock_authentication_checker.access_control_status()).then_return(
        True
    )

    response = _client(mock_audit_client, mock_authentication_checker).post(
        "/protocols",
        headers={
            "Authorization": f"Bearer {_TOKEN_WITHOUT_SCOPE}",
            USER_NOTES_HEADER: _USER_NOTES,
        },
    )

    assert response.status_code == 403
    assert len(captured_logs) == 1
    logged = captured_logs[0]
    assert logged.action == "POST /protocols"
    assert logged.accountName == "tester"
    assert logged.legalName == "Test User"
    assert logged.reason == _USER_NOTES
    assert PERMISSION_DENIED_MESSAGE in logged.message
    assert "Response code: 403" in logged.message


async def test_permitted_mutating_request_keeps_named_action(
    decoy: Decoy,
    mock_audit_client: Client,
    mock_authentication_checker: AuthenticationChecker,
    captured_logs: list[SubmitAuditLogMessageData],
) -> None:
    decoy.when(
        await mock_authentication_checker.check(token=_TOKEN_WITH_SCOPE)
    ).then_return(_authenticated({Scope.PROTOCOLS_WRITE}))
    decoy.when(await mock_authentication_checker.access_control_status()).then_return(
        True
    )
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=True,
            minLengthOfReasonForInteraction=None,
        )
    )

    response = _client(mock_audit_client, mock_authentication_checker).post(
        "/protocols",
        headers={
            "Authorization": f"Bearer {_TOKEN_WITH_SCOPE}",
            USER_NOTES_HEADER: _USER_NOTES,
        },
    )

    assert response.status_code == 200
    assert len(captured_logs) == 1
    assert captured_logs[0].action == _NAMED_ACTION
    assert captured_logs[0].accountName == "tester"
    assert captured_logs[0].reason == _USER_NOTES


async def test_does_not_persist_denied_get(
    decoy: Decoy,
    mock_audit_client: Client,
    mock_authentication_checker: AuthenticationChecker,
    captured_logs: list[SubmitAuditLogMessageData],
) -> None:
    decoy.when(
        await mock_authentication_checker.check(token=_TOKEN_WITHOUT_SCOPE)
    ).then_return(_authenticated(set()))
    decoy.when(await mock_authentication_checker.access_control_status()).then_return(
        True
    )

    response = _client(mock_audit_client, mock_authentication_checker).get(
        "/protocols",
        headers={"Authorization": f"Bearer {_TOKEN_WITHOUT_SCOPE}"},
    )

    assert response.status_code == 403
    assert captured_logs == []


async def test_does_not_persist_missing_token(
    decoy: Decoy,
    mock_audit_client: Client,
    mock_authentication_checker: AuthenticationChecker,
    captured_logs: list[SubmitAuditLogMessageData],
) -> None:
    decoy.when(await mock_authentication_checker.check(token=None)).then_return(
        MissingTokenResult()
    )
    decoy.when(await mock_authentication_checker.access_control_status()).then_return(
        True
    )

    response = _client(mock_audit_client, mock_authentication_checker).post(
        "/protocols",
        headers={USER_NOTES_HEADER: _USER_NOTES},
    )

    assert response.status_code == 401
    assert captured_logs == []


async def test_denied_request_without_audit_client_still_returns_403(
    decoy: Decoy,
    mock_authentication_checker: AuthenticationChecker,
) -> None:
    decoy.when(
        await mock_authentication_checker.check(token=_TOKEN_WITHOUT_SCOPE)
    ).then_return(_authenticated(set()))
    decoy.when(await mock_authentication_checker.access_control_status()).then_return(
        True
    )

    response = _client(None, mock_authentication_checker).post(
        "/protocols",
        headers={"Authorization": f"Bearer {_TOKEN_WITHOUT_SCOPE}"},
    )

    assert response.status_code == 403
