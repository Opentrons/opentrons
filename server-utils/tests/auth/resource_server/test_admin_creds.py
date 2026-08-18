"""Tests for the requireAdminCreds* request-time gate."""

from typing import override

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from server_utils.auth.resource_server.authentication_checker import (
    AuthenticationChecker,
)
from server_utils.auth.resource_server.fastapi import (
    AuthorizationError,
    handle_authorization_error,
    install_authentication_checker,
    require_admin_account,
    require_admin_creds,
)
from server_utils.auth.resource_server.types import (
    AdminCredentialsRequiredResult,
    AdminCredsSettingsData,
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
    AuthenticationResult,
)


def test_require_admin_account_noop_when_access_control_off() -> None:
    """CRS off should not require an admin account."""
    require_admin_account(AuthenticationNotRequiredResult())


@pytest.mark.parametrize("account_type", ["admin", "service"])
def test_require_admin_account_allows_admin_roles(account_type: str) -> None:
    """Admin and service accounts should pass."""
    require_admin_account(
        AuthenticatedResult(
            scope="",
            username="privileged",
            fullname="Privileged",
            account_type=account_type,
        )
    )


def test_require_admin_account_denies_user() -> None:
    """A user account should get a distinct admin-credentials 403."""
    with pytest.raises(AuthorizationError) as exc_info:
        require_admin_account(
            AuthenticatedResult(
                scope="protocols.write updates.write run_signoff.write",
                username="operator",
                fullname="Operator",
                account_type="user",
            )
        )
    assert isinstance(
        exc_info.value.authorization_error, AdminCredentialsRequiredResult
    )


class _StubChecker(AuthenticationChecker):
    """Return a fixed account type and requireAdminCredsWhenSendingProtocolToRobot flag."""

    def __init__(self, *, account_type: str, flag: bool) -> None:
        self._account_type = account_type
        self._flag = flag

    @override
    async def check(self, token: str | None) -> AuthenticationResult:
        return AuthenticatedResult(
            scope="protocols.write",
            username="operator",
            fullname="Operator",
            account_type=self._account_type,
        )

    @override
    async def access_control_status(self) -> bool:
        return True

    @override
    async def admin_creds_settings(self) -> AdminCredsSettingsData:
        return AdminCredsSettingsData(
            requireAdminCredsWhenUpdatingRobotSoftware=False,
            requireAdminCredsWhenSendingProtocolToRobot=self._flag,
            requireAdminCredsForSignoffProtocol=False,
        )


def _client(*, account_type: str, flag: bool) -> TestClient:
    app = FastAPI()
    install_authentication_checker(
        app.state, _StubChecker(account_type=account_type, flag=flag)
    )
    app.exception_handler(AuthorizationError)(handle_authorization_error)

    @app.post(
        "/upload",
        dependencies=[
            Depends(require_admin_creds("requireAdminCredsWhenSendingProtocolToRobot"))
        ],
    )
    def upload() -> dict[str, str]:
        return {"ok": "ok"}

    return TestClient(app)


def test_require_admin_creds_allows_user_when_flag_false() -> None:
    """Users keep the write scope; the flag off means the request is allowed."""
    response = _client(account_type="user", flag=False).post("/upload")
    assert response.status_code == 200
    assert response.json() == {"ok": "ok"}


def test_require_admin_creds_denies_user_when_flag_true() -> None:
    """A user with the write scope still gets an admin-credentials 403 (RQA-5855)."""
    response = _client(account_type="user", flag=True).post("/upload")
    assert response.status_code == 403
    body = response.json()
    assert body["adminCredentialsRequired"] is True
    assert body["debugMessage"] == "This action requires admin credentials."


def test_require_admin_creds_allows_admin_when_flag_true() -> None:
    """Admins are not blocked by requireAdminCreds*."""
    response = _client(account_type="admin", flag=True).post("/upload")
    assert response.status_code == 200
    assert response.json() == {"ok": "ok"}
