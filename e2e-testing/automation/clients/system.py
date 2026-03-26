"""HTTP client for testing the system-server's /system endpoints.

Covers the deprecated register/authorize/connected flow and OEM mode.
Designed for use in E2E tests. All Python attributes use snake_case;
Pydantic models use aliases for the API's camelCase where needed.
"""

from __future__ import annotations

from typing import Any

import httpx
from pydantic import BaseModel, ConfigDict, Field

# Default port for system-server (system_server/cli.py).
DEFAULT_SYSTEM_SERVER_PORT = 32950

# Header name used by system-server for registration and authorization tokens.
AUTHENTICATION_BEARER_HEADER = "authenticationbearer"


class RegisterResponse(BaseModel):
    """Response from POST /system/register."""

    token: str


class AuthorizeResponse(BaseModel):
    """Response from POST /system/authorize."""

    token: str


class Connection(BaseModel):
    """A single entry in GET /system/connected (camelCase in API)."""

    model_config = ConfigDict(populate_by_name=True)

    subject: str
    agent: str
    agent_id: str = Field(alias="agentId")


class GetConnectedResponse(BaseModel):
    """Response from GET /system/connected."""

    connections: list[Connection]


class SystemClient:
    """E2E test client for the system-server.

    Wraps httpx.AsyncClient for the register/authorize/connected flow and OEM mode.
    """

    def __init__(
        self,
        base_url: str,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout)

    async def __aenter__(self) -> SystemClient:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    # -- Register (deprecated) -------------------------------------------------

    async def register(
        self,
        *,
        subject: str,
        agent: str,
        agent_id: str,
    ) -> RegisterResponse:
        """POST /system/register. Returns a registration token."""
        response = await self._client.post(
            "/system/register",
            params={
                "subject": subject,
                "agent": agent,
                "agentId": agent_id,
            },
        )
        response.raise_for_status()
        return RegisterResponse.model_validate(response.json())

    # -- Authorize (deprecated) ------------------------------------------------

    async def authorize(self, registration_token: str) -> AuthorizeResponse:
        """POST /system/authorize. Exchange registration token for authorization token."""
        response = await self.post_authorize_response(registration_token)
        response.raise_for_status()
        return AuthorizeResponse.model_validate(response.json())

    async def check_authorization(self, authorization_token: str) -> None:
        """GET /system/authorize. Verify an authorization token (200 if valid)."""
        response = await self.get_authorize_response(authorization_token)
        response.raise_for_status()

    async def post_authorize_response(self, registration_token: str) -> httpx.Response:
        """POST /system/authorize without raising for status assertions."""
        return await self._client.post(
            "/system/authorize",
            headers={AUTHENTICATION_BEARER_HEADER: registration_token},
        )

    async def get_authorize_response(
        self,
        authorization_token: str,
        *,
        scopes: list[str] | None = None,
    ) -> httpx.Response:
        """GET /system/authorize without raising for status assertions."""
        params: dict[str, Any] | None = None
        if scopes is not None:
            params = {"scopes": scopes}
        return await self._client.get(
            "/system/authorize",
            headers={AUTHENTICATION_BEARER_HEADER: authorization_token},
            params=params,
        )

    # -- Connected (deprecated) ------------------------------------------------

    async def get_connected(self) -> GetConnectedResponse:
        """GET /system/connected. List active authorizations."""
        response = await self._client.get("/system/connected")
        response.raise_for_status()
        return GetConnectedResponse.model_validate(response.json())

    async def get_openapi(self) -> dict[str, Any]:
        """GET /system/openapi.json and return the parsed OpenAPI document."""
        response = await self._client.get("/system/openapi.json")
        response.raise_for_status()
        return response.json()

    # -- OEM mode (requires ROBOT_SETTINGS_WRITE when auth is enabled) --------

    async def enable_oem_mode(self, enable: bool, token: str | None = None) -> httpx.Response:
        """PUT /system/oem_mode/enable. Enable or disable OEM mode."""
        headers: dict[str, str] = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        response = await self._client.put(
            "/system/oem_mode/enable",
            json={"enable": enable},
            headers=headers or None,
        )
        return response

    async def upload_splash_image(
        self,
        *,
        file_name: str,
        content: bytes,
        content_type: str = "image/png",
        token: str | None = None,
    ) -> httpx.Response:
        """POST /system/oem_mode/upload_splash with a multipart upload."""
        headers: dict[str, str] = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return await self._client.post(
            "/system/oem_mode/upload_splash",
            files={"file": (file_name, content, content_type)},
            headers=headers or None,
        )
