"""HTTP client for testing the auth-server's OAuth 2 endpoints.

Implements the Resource Owner Password Credentials (ROPC) flow
against the auth-server and provides helpers for token introspection,
settings management, and user CRUD. Designed for use in E2E tests.

Request types (``*RequestEnvelope``, ``*PatchData``, ``UserCreateData``) are
``TypedDict`` where partial JSON matters; responses use ``TypedDict`` for
settings envelopes and Pydantic for OAuth, users, and access-control GET bodies.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
from pydantic import TypeAdapter, ValidationError

from automation.clients.auth_models import (
    AccessControlPatchRequestEnvelope,
    AccessControlResponseData,
    AccessControlResponseEnvelope,
    AccountType,
    OpenApiDocument,
    SettingsPatchData,
    SettingsPatchRequestEnvelope,
    SettingsResponseData,
    SettingsResponseEnvelope,
    TokenIntrospectionResponse,
    TokenResponse,
    UserCreateData,
    UserCreateRequestEnvelope,
    UserPatchLocked,
    UserPatchRequestEnvelope,
    UserResourceResponse,
    UserResponse,
)

_SETTINGS_RESPONSE_ENVELOPE = TypeAdapter(SettingsResponseEnvelope)
_SETTINGS_PATCH_REQUEST = TypeAdapter(SettingsPatchRequestEnvelope)
_USER_CREATE_REQUEST = TypeAdapter(UserCreateRequestEnvelope)
_USER_PATCH_REQUEST = TypeAdapter(UserPatchRequestEnvelope)


class _UnsetType:
    __slots__ = ()


_UNSET = _UnsetType()

# Hardcoded client_id expected by the auth-server (see auth_server/oauth2/backend.py).
DEFAULT_CLIENT_ID = "opentrons_app"

# Well-known test users baked into the auth-server for testing.
ADMIN_USERNAME = "test_admin"
ADMIN_PASSWORD = "test_admin_password"
USER_USERNAME = "test_user"
USER_PASSWORD = "test_user_password"


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

        The body must validate as :class:`SettingsResponseEnvelope` (including a
        ``data`` object that parses as :class:`SettingsResponseData`). Use this instead
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

    async def get_settings(self) -> SettingsResponseData:
        """GET /auth/settings (no auth required)."""
        response = await self._client.get("/auth/settings")
        response.raise_for_status()
        envelope = _SETTINGS_RESPONSE_ENVELOPE.validate_python(response.json())
        return envelope["data"]

    async def get_access_control_settings(self) -> AccessControlResponseData:
        """GET /auth/settings/accessControlEnabled (no auth required)."""
        response = await self._client.get("/auth/settings/accessControlEnabled")
        response.raise_for_status()
        envelope = AccessControlResponseEnvelope.model_validate(response.json())
        return envelope.data

    async def patch_access_control_enabled_response(
        self,
        token: TokenResponse,
    ) -> httpx.Response:
        """PATCH ``/auth/settings/accessControlEnabled`` without ``raise_for_status``.

        Same body as :meth:`patch_access_control_enabled` (enable only). Use when
        asserting non-2xx responses (for example 422 after access control is already on).
        """
        body: AccessControlPatchRequestEnvelope = {
            "data": {"accessControlEnabled": True},
        }
        return await self._client.patch(
            "/auth/settings/accessControlEnabled",
            json=body,
            headers=AuthClient.auth_header(token),
        )

    async def patch_access_control_enabled(
        self,
        token: TokenResponse,
    ) -> AccessControlResponseData:
        """PATCH /auth/settings/accessControlEnabled to enable access control.

        The API only accepts ``accessControlEnabled: true``; enabling is one-way
        until reset by other means. Requires ``AUTH_SETTINGS_WRITE`` scope.
        """
        response = await self.patch_access_control_enabled_response(token)
        response.raise_for_status()
        envelope = AccessControlResponseEnvelope.model_validate(response.json())
        return envelope.data

    async def patch_access_control_disabled_response(
        self,
        token: TokenResponse,
    ) -> httpx.Response:
        """PATCH /auth/settings/accessControlEnabled without raising (for asserting error status codes)."""
        body: AccessControlPatchRequestEnvelope = {
            "data": {"accessControlEnabled": False},
        }
        return await self._client.patch(
            "/auth/settings/accessControlEnabled",
            json=body,
            headers=AuthClient.auth_header(token),
        )

    async def patch_settings(
        self,
        data: SettingsPatchData,
        token: TokenResponse | None = None,
    ) -> SettingsResponseData:
        """PATCH /auth/settings. Requires auth when access control is enabled."""
        response = await self.patch_settings_response(data, token=token)
        response.raise_for_status()
        envelope = _SETTINGS_RESPONSE_ENVELOPE.validate_python(response.json())
        return envelope["data"]

    async def patch_settings_response(
        self,
        data: SettingsPatchData,
        token: TokenResponse | None = None,
    ) -> httpx.Response:
        """PATCH /auth/settings without raising (for asserting error status codes)."""
        headers = AuthClient.auth_header(token) if token else {}
        body = _SETTINGS_PATCH_REQUEST.validate_python({"data": data})
        return await self._client.patch(
            "/auth/settings",
            json=body,
            headers=headers,
        )

    async def reset_settings(
        self,
        token: TokenResponse | None = None,
    ) -> SettingsResponseData:
        """DELETE /auth/settings (reset to defaults). Requires auth when access control is enabled."""
        headers = AuthClient.auth_header(token) if token else {}
        response = await self._client.delete("/auth/settings", headers=headers)
        response.raise_for_status()
        envelope = _SETTINGS_RESPONSE_ENVELOPE.validate_python(response.json())
        return envelope["data"]

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
        create_data: UserCreateData = {
            "userName": user_name,
            "password": password,
            "fullName": full_name,
            "accountType": account_type,
        }
        body = _USER_CREATE_REQUEST.validate_python({"data": create_data})
        response = await self.post_users_request(token, body)
        response.raise_for_status()
        return UserResourceResponse.model_validate(response.json()).data

    async def post_users_request(
        self,
        token: TokenResponse,
        body: UserCreateRequestEnvelope | dict[str, Any],
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

    async def update_user_response(
        self,
        token: TokenResponse,
        user_name: str,
        *,
        user_name_new: str | None | _UnsetType = _UNSET,
        password: str | None | _UnsetType = _UNSET,
        full_name: str | None | _UnsetType = _UNSET,
        account_type: AccountType | None | _UnsetType = _UNSET,
        locked: UserPatchLocked | _UnsetType = _UNSET,
        reset_password: bool | _UnsetType = _UNSET,
    ) -> httpx.Response:
        """PATCH /auth/users/{user_name} without calling ``raise_for_status``.

        Use this when the test expects a non-2xx response and needs to inspect
        ``status_code``, ``.json()``, or ``.text`` (same keyword semantics as
        :meth:`update_user`).
        """
        raw: dict[str, Any] = {}
        if user_name_new is not _UNSET:
            raw["userName"] = user_name_new
        if password is not _UNSET:
            raw["password"] = password
        if full_name is not _UNSET:
            raw["fullName"] = full_name
        if account_type is not _UNSET:
            raw["accountType"] = account_type
        if locked is not _UNSET:
            raw["locked"] = locked
        if reset_password is not _UNSET:
            raw["resetPassword"] = reset_password
        body = _USER_PATCH_REQUEST.validate_python({"data": raw})
        return await self._client.patch(
            f"/auth/users/{user_name}",
            json=body,
            headers=AuthClient.auth_header(token),
        )

    async def update_user(
        self,
        token: TokenResponse,
        user_name: str,
        *,
        user_name_new: str | None | _UnsetType = _UNSET,
        password: str | None | _UnsetType = _UNSET,
        full_name: str | None | _UnsetType = _UNSET,
        account_type: AccountType | None | _UnsetType = _UNSET,
        locked: UserPatchLocked | _UnsetType = _UNSET,
        reset_password: bool | _UnsetType = _UNSET,
    ) -> UserResponse:
        """PATCH /auth/users/{user_name} (requires USERS_WRITE scope).

        Keyword arguments default to "not sent". Pass ``None`` only when you
        intend JSON null for a nullable field; omit the argument to leave the
        field unchanged.

        ``locked`` may be ``False`` (clear failed-login lockout) or ``None``
        (JSON null). ``reset_password`` maps to ``resetPassword`` in the JSON body.
        """
        response = await self.update_user_response(
            token,
            user_name,
            user_name_new=user_name_new,
            password=password,
            full_name=full_name,
            account_type=account_type,
            locked=locked,
            reset_password=reset_password,
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
