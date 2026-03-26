"""HTTP client for testing the auth-server's OAuth 2 endpoints.

Implements the Resource Owner Password Credentials (ROPC) flow
against the auth-server and provides helpers for token introspection,
settings management, and user CRUD. Designed for use in E2E tests.

All Python attributes use snake_case; Pydantic models use aliases to
serialize/deserialize the API's camelCase JSON.
"""

from __future__ import annotations

from typing import Any, Literal

import httpx
from pydantic import AliasChoices, BaseModel, ConfigDict, Field

# Hardcoded client_id expected by the auth-server (see auth_server/oauth2/backend.py).
DEFAULT_CLIENT_ID = "opentrons_app"

# Well-known test users baked into the auth-server for testing.
ADMIN_USERNAME = "test_admin"
ADMIN_PASSWORD = "test_admin_password"
USER_USERNAME = "test_user"
USER_PASSWORD = "test_user_password"

# Account types supported by the auth-server (auth_server/users/models.py).
AccountType = Literal["admin", "user", "auditor", "service"]


class TokenResponse(BaseModel):
    """Parsed successful token response from the OAuth 2 token endpoint.

    OAuth 2 RFC 6749 uses snake_case in the token response, so no aliases needed.
    """

    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str | None = None
    scope: str = ""


class UserResponse(BaseModel):
    """Parsed user from GET /auth/users/{user_name} or create/update responses.

    Python uses snake_case; API uses camelCase (via Field alias).
    """

    model_config = ConfigDict(populate_by_name=True)

    user_name: str = Field(alias="userName")
    full_name: str = Field(alias="fullName")
    account_type: AccountType = Field(alias="accountType")
    scopes: list[str] = Field(default_factory=list)


class _UserCreatePayload(BaseModel):
    """Request body for POST /auth/users (camelCase in JSON)."""

    model_config = ConfigDict(populate_by_name=True)

    user_name: str = Field(
        validation_alias=AliasChoices("user_name", "userName"),
        serialization_alias="userName",
    )
    password: str
    full_name: str = Field(
        validation_alias=AliasChoices("full_name", "fullName"),
        serialization_alias="fullName",
    )
    account_type: AccountType = Field(
        default="user",
        validation_alias=AliasChoices("account_type", "accountType"),
        serialization_alias="accountType",
    )


class _UserUpdatePayload(BaseModel):
    """Request body for PATCH /auth/users/{user_name} (camelCase in JSON)."""

    model_config = ConfigDict(populate_by_name=True)

    user_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("user_name", "userName"),
        serialization_alias="userName",
    )
    password: str | None = None
    full_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("full_name", "fullName"),
        serialization_alias="fullName",
    )
    account_type: AccountType | None = Field(
        default=None,
        validation_alias=AliasChoices("account_type", "accountType"),
        serialization_alias="accountType",
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
        return TokenResponse.model_validate(response.json())

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
        return TokenResponse.model_validate(response.json())

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

    def get_openapi(self) -> dict[str, Any]:
        """GET /auth/openapi.json and return the parsed OpenAPI document."""
        response = self._client.get("/auth/openapi.json")
        response.raise_for_status()
        return response.json()

    # -- Auth Settings -------------------------------------------------------------

    def get_settings(self) -> dict[str, Any]:
        """GET /auth/settings (no auth required)."""
        response = self._client.get("/auth/settings")
        response.raise_for_status()
        return response.json()

    def patch_settings(
        self,
        data: dict[str, Any],
        token: TokenResponse | None = None,
    ) -> dict[str, Any]:
        """PATCH /auth/settings. Requires auth when access control is enabled."""
        response = self.patch_settings_response(data, token=token)
        response.raise_for_status()
        return response.json()

    def patch_settings_response(
        self,
        data: dict[str, Any],
        token: TokenResponse | None = None,
    ) -> httpx.Response:
        """PATCH /auth/settings without raising (for asserting error status codes)."""
        headers = AuthClient.auth_header(token) if token else {}
        return self._client.patch(
            "/auth/settings",
            json={"data": data},
            headers=headers,
        )

    def reset_settings(
        self,
        token: TokenResponse | None = None,
    ) -> dict[str, Any]:
        """DELETE /auth/settings (reset to defaults). Requires auth when access control is enabled."""
        headers = AuthClient.auth_header(token) if token else {}
        response = self._client.delete("/auth/settings", headers=headers)
        response.raise_for_status()
        return response.json()

    # -- Users (protected; require Bearer token) -----------------------------------

    def create_user(
        self,
        token: TokenResponse,
        *,
        user_name: str,
        password: str,
        full_name: str,
        account_type: AccountType = "user",
    ) -> UserResponse:
        """POST /auth/users. Create a user (requires USERS_WRITE scope)."""
        payload_data = _UserCreatePayload(
            user_name=user_name,
            password=password,
            full_name=full_name,
            account_type=account_type,
        )
        response = self.post_users_request(
            token,
            {"data": payload_data.model_dump(by_alias=True)},
        )
        response.raise_for_status()
        return UserResponse.model_validate(response.json()["data"])

    def post_users_request(
        self,
        token: TokenResponse,
        body: dict[str, Any],
    ) -> httpx.Response:
        """POST /auth/users with a full JSON body (for success and error cases)."""
        return self._client.post(
            "/auth/users",
            json=body,
            headers=AuthClient.auth_header(token),
        )

    def get_user(self, token: TokenResponse, user_name: str) -> UserResponse:
        """GET /auth/users/{user_name} (requires USERS_READ scope)."""
        response = self._client.get(
            f"/auth/users/{user_name}",
            headers=AuthClient.auth_header(token),
        )
        response.raise_for_status()
        return UserResponse.model_validate(response.json()["data"])

    def update_user(
        self,
        token: TokenResponse,
        user_name: str,
        *,
        user_name_new: str | None = None,
        password: str | None = None,
        full_name: str | None = None,
        account_type: AccountType | None = None,
    ) -> UserResponse:
        """PATCH /auth/users/{user_name} (requires USERS_WRITE scope)."""
        payload_data = _UserUpdatePayload(
            user_name=user_name_new,
            password=password,
            full_name=full_name,
            account_type=account_type,
        )
        # Drop unset fields so we only send provided ones
        data = {k: v for k, v in payload_data.model_dump(by_alias=True).items() if v is not None}
        response = self._client.patch(
            f"/auth/users/{user_name}",
            json={"data": data},
            headers=AuthClient.auth_header(token),
        )
        response.raise_for_status()
        return UserResponse.model_validate(response.json()["data"])

    def patch_user_request(
        self,
        token: TokenResponse,
        user_name: str,
        body: dict[str, Any],
    ) -> httpx.Response:
        """PATCH /auth/users/{user_name} with a raw request body."""
        return self._client.patch(
            f"/auth/users/{user_name}",
            json=body,
            headers=AuthClient.auth_header(token),
        )

    def delete_user(self, token: TokenResponse, user_name: str) -> None:
        """DELETE /auth/users/{user_name} (requires USERS_WRITE scope). Returns 200 with empty body."""
        response = self._client.delete(
            f"/auth/users/{user_name}",
            headers=AuthClient.auth_header(token),
        )
        response.raise_for_status()

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
