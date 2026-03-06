"""Smoke tests for the auth-server OAuth 2 password-grant flow.

These tests verify the live auth-server is up and that the core
ROPC (Resource Owner Password Credentials) flow works end-to-end:
  - token exchange
  - token refresh
  - token introspection
  - settings endpoints
  - error cases (bad credentials, invalid grant type)
"""

from __future__ import annotations

from typing import cast

import httpx
import pytest

from automation.clients.auth import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    USER_PASSWORD,
    USER_USERNAME,
    AccountType,
    AuthClient,
    TokenResponse,
)

pytestmark = pytest.mark.authE2E


# -- Password grant -------------------------------------------------------


def test_admin_can_get_token(auth_client: AuthClient) -> None:
    token = auth_client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    assert token.access_token
    assert token.token_type.lower() == "bearer"
    assert token.expires_in > 0
    assert token.refresh_token is not None


def test_user_can_get_token(auth_client: AuthClient) -> None:
    token = auth_client.get_token(USER_USERNAME, USER_PASSWORD)
    assert token.access_token
    assert token.refresh_token is not None


def test_bad_password_is_rejected(auth_client: AuthClient) -> None:
    resp = auth_client.get_token_raw(
        grant_type="password",
        client_id="opentrons_app",
        username=ADMIN_USERNAME,
        password="wrong_password",
    )
    # RFC 6749 §5.2: token endpoint returns 400 for invalid_grant.
    assert resp.status_code == 400


def test_unknown_user_is_rejected(auth_client: AuthClient) -> None:
    resp = auth_client.get_token_raw(
        grant_type="password",
        client_id="opentrons_app",
        username="nonexistent_user",
        password="anything",
    )
    assert resp.status_code == 400


def test_bad_client_id_is_rejected(auth_client: AuthClient) -> None:
    resp = auth_client.get_token_raw(
        grant_type="password",
        client_id="bad_client",
        username=ADMIN_USERNAME,
        password=ADMIN_PASSWORD,
    )
    assert resp.status_code == 401


# -- Token refresh ---------------------------------------------------------


def test_can_refresh_token(auth_client: AuthClient) -> None:
    original = auth_client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    assert original.refresh_token is not None

    refreshed = auth_client.refresh_token(original.refresh_token)
    assert refreshed.access_token
    assert refreshed.access_token != original.access_token


def test_invalid_refresh_token_is_rejected(auth_client: AuthClient) -> None:
    resp = auth_client.get_token_raw(
        grant_type="refresh_token",
        client_id="opentrons_app",
        refresh_token="bogus_token",
    )
    assert resp.status_code in (400, 401)


# -- Token introspection ---------------------------------------------------


def test_active_token_introspects_as_active(
    auth_client: AuthClient,
    admin_token: TokenResponse,
) -> None:
    result = auth_client.introspect(admin_token.access_token)
    assert result["active"] is True
    assert result["username"] == ADMIN_USERNAME
    assert "scope" in result


def test_bogus_token_introspects_as_inactive(auth_client: AuthClient) -> None:
    result = auth_client.introspect("totally_fake_token")
    assert result["active"] is False


# -- Settings --------------------------------------------------------------


def test_get_settings(auth_client: AuthClient) -> None:
    settings = auth_client.get_settings()
    assert "data" in settings
    assert "accessControlEnabled" in settings["data"]


def test_patch_settings_with_token(
    auth_client: AuthClient,
    admin_token: TokenResponse,
) -> None:
    """PATCH /auth/settings with admin token is accepted (null leaves value unchanged)."""
    settings = auth_client.patch_settings(
        {"accessControlEnabled": None},
        token=admin_token,
    )
    assert "data" in settings
    assert "accessControlEnabled" in settings["data"]


def test_patch_settings_access_control_false_rejected(
    auth_client: AuthClient,
    admin_token: TokenResponse,
) -> None:
    """PATCH with accessControlEnabled: false is rejected (one-way latch)."""
    resp = auth_client._client.patch(
        "/auth/settings",
        json={"data": {"accessControlEnabled": False}},
        headers=AuthClient.auth_header(admin_token),
    )
    assert resp.status_code == 422


def test_reset_settings(auth_client: AuthClient) -> None:
    """DELETE /auth/settings resets to defaults (may require token when access control is on)."""
    settings = auth_client.reset_settings()
    assert "data" in settings


def test_reset_settings_with_token(
    auth_client: AuthClient,
    admin_token: TokenResponse,
) -> None:
    """Reset settings with admin token when access control is enabled."""
    settings = auth_client.reset_settings(token=admin_token)
    assert "data" in settings


# -- Users CRUD (protected; require admin token) ---------------------------


def test_create_get_update_delete_user(
    auth_client: AuthClient,
    admin_token: TokenResponse,
) -> None:
    """Create a user, get, update, obtain token with new creds, then delete."""
    username = "test_e2e_user"
    password = "securepassword123"
    full_name = "E2E Test User"

    created = auth_client.create_user(
        admin_token,
        user_name=username,
        password=password,
        full_name=full_name,
        account_type="user",
    )
    assert created.user_name == username
    assert created.full_name == full_name
    assert created.account_type == "user"
    assert "runs.write" in created.scopes

    gotten = auth_client.get_user(admin_token, username)
    assert gotten.user_name == created.user_name
    assert gotten.full_name == created.full_name

    updated = auth_client.update_user(
        admin_token,
        username,
        full_name="E2E Test User Updated",
        account_type="admin",
    )
    assert updated.full_name == "E2E Test User Updated"
    assert updated.account_type == "admin"

    token = auth_client.get_token(username, password)
    assert token.access_token

    auth_client.delete_user(admin_token, username)

    with pytest.raises(httpx.HTTPStatusError) as exc_info:
        auth_client.get_user(admin_token, username)
    assert exc_info.value.response.status_code == 404


def test_create_user_duplicate_rejected(
    auth_client: AuthClient,
    admin_token: TokenResponse,
) -> None:
    """Creating a user that already exists returns 400."""
    auth_client.create_user(
        admin_token,
        user_name="test_e2e_dup",
        password="password1234",
        full_name="Duplicate",
        account_type="user",
    )
    resp = auth_client._client.post(
        "/auth/users",
        json={
            "data": {
                "userName": "test_e2e_dup",
                "password": "password1234",
                "fullName": "Duplicate",
                "accountType": "user",
            }
        },
        headers=AuthClient.auth_header(admin_token),
    )
    assert resp.status_code == 400
    auth_client.delete_user(admin_token, "test_e2e_dup")


def test_get_user_not_found(
    auth_client: AuthClient,
    admin_token: TokenResponse,
) -> None:
    """GET /auth/users/{userName} for missing user returns 404."""
    with pytest.raises(httpx.HTTPStatusError) as exc_info:
        auth_client.get_user(admin_token, "nonexistent_user_404")
    assert exc_info.value.response.status_code == 404


# Expected scopes per account type (auth_server/users/models.py ACCOUNT_TYPE_TO_SCOPES).
_ACCOUNT_TYPE_SCOPES: dict[str, list[str]] = {
    "admin": ["auth_settings.write", "robot_settings.write", "runs.write", "users.read", "users.write"],
    "user": ["runs.write"],
    "auditor": ["users.read"],
    "service": ["runs.write"],
}


@pytest.mark.parametrize("account_type", ["admin", "user", "auditor", "service"])
def test_crud_user_for_each_account_type(
    auth_client: AuthClient,
    admin_token: TokenResponse,
    account_type: str,
) -> None:
    """Create, get, update, obtain token, and delete a user for each account type."""
    username = f"test_e2e_{account_type}_crud"
    password = "securepassword123"
    full_name = f"E2E {account_type} User"

    created = auth_client.create_user(
        admin_token,
        user_name=username,
        password=password,
        full_name=full_name,
        account_type=cast(AccountType, account_type),
    )
    assert created.user_name == username
    assert created.full_name == full_name
    assert created.account_type == account_type
    for scope in _ACCOUNT_TYPE_SCOPES[account_type]:
        assert scope in created.scopes, f"expected {scope} in {created.scopes}"

    gotten = auth_client.get_user(admin_token, username)
    assert gotten.account_type == account_type
    assert gotten.user_name == username

    updated = auth_client.update_user(
        admin_token,
        username,
        full_name=f"E2E {account_type} User Updated",
    )
    assert updated.full_name == f"E2E {account_type} User Updated"
    assert updated.account_type == account_type

    token = auth_client.get_token(username, password)
    assert token.access_token

    auth_client.delete_user(admin_token, username)

    with pytest.raises(httpx.HTTPStatusError) as exc_info:
        auth_client.get_user(admin_token, username)
    assert exc_info.value.response.status_code == 404
