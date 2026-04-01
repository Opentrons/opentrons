"""HTTP client for testing the auth-server's OAuth 2 endpoints.

Implements the Resource Owner Password Credentials (ROPC) flow
against the auth-server and provides helpers for token introspection,
settings management, and user CRUD. Designed for use in E2E tests.

Response bodies are validated with Pydantic models in ``auth_models``.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, ValidationError

from automation.clients.auth_models import (
    AccessControlData,
    AccessControlSettingsResponse,
    AccountType,
    AuthSettingsResponse,
    OpenApiDocument,
    SettingsData,
    TokenIntrospectionResponse,
    TokenResponse,
    UserResourceResponse,
    UserResponse,
)

# Hardcoded client_id expected by the auth-server (see auth_server/oauth2/backend.py).
DEFAULT_CLIENT_ID = "opentrons_app"

# Well-known test users baked into the auth-server for testing.
ADMIN_USERNAME = "test_admin"
ADMIN_PASSWORD = "test_admin_password"
USER_USERNAME = "test_user"
USER_PASSWORD = "test_user_password"


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

    Wraps ``httpx.AsyncClient`` with a fixed ``base_url``. Each public method maps to
    one HTTP request (method + path + body). Paths are relative to ``base_url``, so
    a call like ``get("/auth/settings")`` becomes ``GET http://<host>:33950/auth/settings``.

    Successful JSON responses are parsed into models from ``automation.clients.auth_models``.

    Usage::

        async with AuthClient(base_url="http://localhost:33950") as client:
            token = await client.get_token("test_admin", "test_admin_password")
            assert token.access_token
    """

    def __init__(
        self,
        base_url: str,
        client_id: str = DEFAULT_CLIENT_ID,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.client_id = client_id
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout)

    # -- Context-manager support ---------------------------------------------------

    async def __aenter__(self) -> AuthClient:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    # -- OAuth 2 Password Grant ----------------------------------------------------

    async def get_token(
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

        response = await self._client.post("/auth/oauth2/token", data=data)
        response.raise_for_status()
        return TokenResponse.model_validate(response.json())

    async def refresh_token(
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

        response = await self._client.post("/auth/oauth2/token", data=data)
        response.raise_for_status()
        return TokenResponse.model_validate(response.json())

    # -- Token Introspection -------------------------------------------------------

    async def introspect(self, token: str) -> TokenIntrospectionResponse:
        """Introspect a token (RFC 7662)."""
        response = await self._client.post(
            "/auth/oauth2/introspect",
            data={"token": token, "client_id": self.client_id},
        )
        response.raise_for_status()
        return TokenIntrospectionResponse.model_validate(response.json())

    async def get_openapi(self) -> OpenApiDocument:
        """GET /auth/openapi.json and return a typed OpenAPI document."""
        response = await self._client.get("/auth/openapi.json")
        response.raise_for_status()
        return OpenApiDocument.model_validate(response.json())

    # -- Auth Settings -------------------------------------------------------------

    async def is_alive(self) -> bool:
        """Return True if the auth-server answers GET /auth/settings with 2xx JSON.

        The body must validate as :class:`AuthSettingsResponse` (including a
        ``data`` object that parses as :class:`SettingsData`). Use this instead
        of a bare TCP or ``/health`` check when you need to confirm the API is
        actually serving auth settings.
        """
        try:
            await self.get_settings()
            return True
        except (
            httpx.HTTPStatusError,
            httpx.RequestError,
            ValidationError,
            json.JSONDecodeError,
        ):
            return False

    async def get_settings(self) -> SettingsData:
        """GET /auth/settings (no auth required)."""
        response = await self._client.get("/auth/settings")
        response.raise_for_status()
        envelope = AuthSettingsResponse.model_validate(response.json())
        return envelope.data

    async def get_access_control_settings(self) -> AccessControlData:
        """GET /auth/settings/accessControlEnabled (no auth required)."""
        response = await self._client.get("/auth/settings/accessControlEnabled")
        response.raise_for_status()
        envelope = AccessControlSettingsResponse.model_validate(response.json())
        return envelope.data

    async def patch_settings(
        self,
        data: dict[str, Any],
        token: TokenResponse | None = None,
    ) -> SettingsData:
        """PATCH /auth/settings. Requires auth when access control is enabled."""
        response = await self.patch_settings_response(data, token=token)
        response.raise_for_status()
        envelope = AuthSettingsResponse.model_validate(response.json())
        return envelope.data

    async def patch_settings_response(
        self,
        data: dict[str, Any],
        token: TokenResponse | None = None,
    ) -> httpx.Response:
        """PATCH /auth/settings without raising (for asserting error status codes)."""
        headers = AuthClient.auth_header(token) if token else {}
        return await self._client.patch(
            "/auth/settings",
            json={"data": data},
            headers=headers,
        )

    async def reset_settings(
        self,
        token: TokenResponse | None = None,
    ) -> SettingsData:
        """DELETE /auth/settings (reset to defaults). Requires auth when access control is enabled."""
        headers = AuthClient.auth_header(token) if token else {}
        response = await self._client.delete("/auth/settings", headers=headers)
        response.raise_for_status()
        envelope = AuthSettingsResponse.model_validate(response.json())
        return envelope.data

    # -- Users (protected; require Bearer token) -----------------------------------

    async def create_user(
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
        response = await self.post_users_request(
            token,
            {"data": payload_data.model_dump(by_alias=True)},
        )
        response.raise_for_status()
        return UserResourceResponse.model_validate(response.json()).data

    async def post_users_request(
        self,
        token: TokenResponse,
        body: dict[str, Any],
    ) -> httpx.Response:
        """POST /auth/users with a full JSON body (for success and error cases)."""
        return await self._client.post(
            "/auth/users",
            json=body,
            headers=AuthClient.auth_header(token),
        )

    async def get_user(self, token: TokenResponse, user_name: str) -> UserResponse:
        """GET /auth/users/{user_name} (requires USERS_READ scope)."""
        response = await self._client.get(
            f"/auth/users/{user_name}",
            headers=AuthClient.auth_header(token),
        )
        response.raise_for_status()
        return UserResourceResponse.model_validate(response.json()).data

    async def update_user(
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
        patch = {k: v for k, v in payload_data.model_dump(by_alias=True).items() if v is not None}
        response = await self._client.patch(
            f"/auth/users/{user_name}",
            json={"data": patch},
            headers=AuthClient.auth_header(token),
        )
        response.raise_for_status()
        return UserResourceResponse.model_validate(response.json()).data

    async def patch_user_request(
        self,
        token: TokenResponse,
        user_name: str,
        body: dict[str, Any],
    ) -> httpx.Response:
        """PATCH /auth/users/{user_name} with a raw request body."""
        return await self._client.patch(
            f"/auth/users/{user_name}",
            json=body,
            headers=AuthClient.auth_header(token),
        )

    async def delete_user(self, token: TokenResponse, user_name: str) -> None:
        """DELETE /auth/users/{user_name} (requires USERS_WRITE scope). Returns 200 with empty body."""
        response = await self._client.delete(
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

    async def get_token_raw(
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
        return await self._client.post("/auth/oauth2/token", data=data)
