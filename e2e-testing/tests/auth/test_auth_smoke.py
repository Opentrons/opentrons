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

import pytest

from automation.auth_client import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    USER_PASSWORD,
    USER_USERNAME,
    AuthClient,
    TokenResponse,
)

pytestmark = pytest.mark.authE2E


class TestPasswordGrant:
    """Token exchange via username + password."""

    def test_admin_can_get_token(self, auth_client: AuthClient) -> None:
        token = auth_client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
        assert token.access_token
        assert token.token_type.lower() == "bearer"
        assert token.expires_in > 0
        assert token.refresh_token is not None

    def test_user_can_get_token(self, auth_client: AuthClient) -> None:
        token = auth_client.get_token(USER_USERNAME, USER_PASSWORD)
        assert token.access_token
        assert token.refresh_token is not None

    def test_bad_password_is_rejected(self, auth_client: AuthClient) -> None:
        resp = auth_client.get_token_raw(
            grant_type="password",
            client_id="opentrons_app",
            username=ADMIN_USERNAME,
            password="wrong_password",
        )
        # RFC 6749 §5.2: token endpoint returns 400 for invalid_grant.
        assert resp.status_code == 400

    def test_unknown_user_is_rejected(self, auth_client: AuthClient) -> None:
        resp = auth_client.get_token_raw(
            grant_type="password",
            client_id="opentrons_app",
            username="nonexistent_user",
            password="anything",
        )
        assert resp.status_code == 400

    def test_bad_client_id_is_rejected(self, auth_client: AuthClient) -> None:
        resp = auth_client.get_token_raw(
            grant_type="password",
            client_id="bad_client",
            username=ADMIN_USERNAME,
            password=ADMIN_PASSWORD,
        )
        assert resp.status_code == 401


class TestTokenRefresh:
    """Refresh-token flow."""

    def test_can_refresh_token(self, auth_client: AuthClient) -> None:
        original = auth_client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
        assert original.refresh_token is not None

        refreshed = auth_client.refresh_token(original.refresh_token)
        assert refreshed.access_token
        assert refreshed.access_token != original.access_token

    def test_invalid_refresh_token_is_rejected(self, auth_client: AuthClient) -> None:
        resp = auth_client.get_token_raw(
            grant_type="refresh_token",
            client_id="opentrons_app",
            refresh_token="bogus_token",
        )
        assert resp.status_code in (400, 401)


class TestIntrospection:
    """Token introspection (RFC 7662)."""

    def test_active_token_introspects_as_active(
        self,
        auth_client: AuthClient,
        admin_token: TokenResponse,
    ) -> None:
        result = auth_client.introspect(admin_token.access_token)
        assert result["active"] is True
        assert result["username"] == ADMIN_USERNAME
        assert "scope" in result

    def test_bogus_token_introspects_as_inactive(
        self,
        auth_client: AuthClient,
    ) -> None:
        result = auth_client.introspect("totally_fake_token")
        assert result["active"] is False


class TestSettings:
    """Auth settings endpoints."""

    def test_get_settings(self, auth_client: AuthClient) -> None:
        settings = auth_client.get_settings()
        assert "data" in settings

    def test_reset_settings(self, auth_client: AuthClient) -> None:
        settings = auth_client.reset_settings()
        assert "data" in settings
