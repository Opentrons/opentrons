"""HTTP client for testing the auth-server's OAuth 2 endpoints.

Implements the Resource Owner Password Credentials (ROPC) flow
against the auth-server and provides helpers for token introspection
and settings management. Designed for use in E2E tests.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

# Hardcoded client_id expected by the auth-server (see auth_server/oauth2/backend.py).
DEFAULT_CLIENT_ID = "opentrons_app"

# Well-known test users baked into the auth-server for testing.
ADMIN_USERNAME = "test_admin"
ADMIN_PASSWORD = "test_admin_password"
USER_USERNAME = "test_user"
USER_PASSWORD = "test_user_password"


@dataclass
class TokenResponse:
    """Parsed successful token response from the OAuth 2 token endpoint."""

    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str | None
    scope: str

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> TokenResponse:
        return cls(
            access_token=data["access_token"],
            token_type=data["token_type"],
            expires_in=data["expires_in"],
            refresh_token=data.get("refresh_token"),
            scope=data.get("scope", ""),
        )


class AuthClient:
    """E2E test client for the auth-server.

    Wraps httpx.Client to provide typed helpers for the OAuth 2 password-grant
    flow, token refresh, introspection, and auth-settings management.

    Usage::

        with AuthClient(base_url="http://localhost:33950") as client:
            token = client.get_token("test_admin", "test_admin_password")
            assert token.access_token
            # Use the token to hit robot-server
            resp = client.get(
                "/some/protected/endpoint",
                headers=client.auth_header(token),
            )
    """

    def __init__(
        self,
        base_url: str,
        client_id: str = DEFAULT_CLIENT_ID,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.client_id = client_id
        self._client = httpx.Client(base_url=self.base_url, timeout=timeout)

    # -- Context-manager support ---------------------------------------------------

    def __enter__(self) -> AuthClient:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def close(self) -> None:
        self._client.close()

    # -- OAuth 2 Password Grant ----------------------------------------------------

    def get_token(
        self,
        username: str,
        password: str,
        *,
        scope: str | None = None,
    ) -> TokenResponse:
        """Exchange username + password for an access token (ROPC grant).

        Raises ``httpx.HTTPStatusError`` on non-2xx responses.
        """
        data: dict[str, str] = {
            "grant_type": "password",
            "client_id": self.client_id,
            "username": username,
            "password": password,
        }
        if scope is not None:
            data["scope"] = scope

        response = self._client.post("/auth/oauth2/token", data=data)
        response.raise_for_status()
        return TokenResponse.from_json(response.json())

    def refresh_token(
        self,
        refresh_token: str,
        *,
        scope: str | None = None,
    ) -> TokenResponse:
        """Exchange a refresh token for a new access token.

        Raises ``httpx.HTTPStatusError`` on non-2xx responses.
        """
        data: dict[str, str] = {
            "grant_type": "refresh_token",
            "client_id": self.client_id,
            "refresh_token": refresh_token,
        }
        if scope is not None:
            data["scope"] = scope

        response = self._client.post("/auth/oauth2/token", data=data)
        response.raise_for_status()
        return TokenResponse.from_json(response.json())

    # -- Token Introspection -------------------------------------------------------

    def introspect(self, token: str) -> dict[str, Any]:
        """Introspect a token (RFC 7662).

        Returns the parsed JSON body. Check ``result["active"]`` to see if the
        token is still valid.
        """
        response = self._client.post(
            "/auth/oauth2/introspect",
            data={"token": token, "client_id": self.client_id},
        )
        response.raise_for_status()
        return response.json()

    # -- Auth Settings -------------------------------------------------------------

    def get_settings(self) -> dict[str, Any]:
        """GET /auth/settings."""
        response = self._client.get("/auth/settings")
        response.raise_for_status()
        return response.json()

    def patch_settings(self, data: dict[str, Any]) -> dict[str, Any]:
        """PATCH /auth/settings."""
        response = self._client.patch("/auth/settings", json={"data": data})
        response.raise_for_status()
        return response.json()

    def reset_settings(self) -> dict[str, Any]:
        """DELETE /auth/settings (reset to defaults)."""
        response = self._client.delete("/auth/settings")
        response.raise_for_status()
        return response.json()

    # -- Convenience ---------------------------------------------------------------

    @staticmethod
    def auth_header(token: TokenResponse) -> dict[str, str]:
        """Build an ``Authorization`` header dict from a token response.

        Useful for passing to robot-server requests that sit behind auth::

            headers = AuthClient.auth_header(token)
            httpx.get("http://robot:31950/runs", headers=headers)
        """
        return {"Authorization": f"Bearer {token.access_token}"}

    def get_token_raw(
        self,
        *,
        grant_type: str = "password",
        **form_fields: str,
    ) -> httpx.Response:
        """Low-level POST to the token endpoint.

        Returns the raw ``httpx.Response`` without raising or parsing,
        useful for testing error cases.
        """
        data: dict[str, str] = {"grant_type": grant_type, **form_fields}
        return self._client.post("/auth/oauth2/token", data=data)
