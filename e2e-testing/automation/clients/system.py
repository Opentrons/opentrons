"""HTTP client for testing the system-server's /system endpoints.

Covers the deprecated register/authorize/connected flow and OEM mode.
Designed for use in E2E tests. All Python attributes use snake_case;
Pydantic models use aliases for the API's camelCase where needed.
"""

from __future__ import annotations

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

    Wraps httpx.Client for the register/authorize/connected flow and OEM mode.
    """

    def __init__(
        self,
        base_url: str,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(base_url=self.base_url, timeout=timeout)

    def __enter__(self) -> SystemClient:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def close(self) -> None:
        self._client.close()

    # -- Register (deprecated) -------------------------------------------------

    def register(
        self,
        *,
        subject: str,
        agent: str,
        agent_id: str,
    ) -> RegisterResponse:
        """POST /system/register. Returns a registration token."""
        response = self._client.post(
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

    def authorize(self, registration_token: str) -> AuthorizeResponse:
        """POST /system/authorize. Exchange registration token for authorization token."""
        response = self._client.post(
            "/system/authorize",
            headers={AUTHENTICATION_BEARER_HEADER: registration_token},
        )
        response.raise_for_status()
        return AuthorizeResponse.model_validate(response.json())

    def check_authorization(self, authorization_token: str) -> None:
        """GET /system/authorize. Verify an authorization token (200 if valid)."""
        response = self._client.get(
            "/system/authorize",
            headers={AUTHENTICATION_BEARER_HEADER: authorization_token},
        )
        response.raise_for_status()

    # -- Connected (deprecated) ------------------------------------------------

    def get_connected(self) -> GetConnectedResponse:
        """GET /system/connected. List active authorizations."""
        response = self._client.get("/system/connected")
        response.raise_for_status()
        return GetConnectedResponse.model_validate(response.json())

    # -- OEM mode (requires ROBOT_SETTINGS_WRITE when auth is enabled) --------

    def enable_oem_mode(self, enable: bool, token: str | None = None) -> httpx.Response:
        """PUT /system/oem_mode/enable. Enable or disable OEM mode."""
        headers: dict[str, str] = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        response = self._client.put(
            "/system/oem_mode/enable",
            json={"enable": enable},
            headers=headers or None,
        )
        return response
