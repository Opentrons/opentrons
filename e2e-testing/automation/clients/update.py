"""HTTP client for testing the update-server's /server/update and /server/name endpoints.

Update-server uses aiohttp and exposes health, name, and update-session endpoints.
Designed for use in E2E tests. All Python attributes use snake_case;
Pydantic models use aliases for the API's camelCase where needed.
"""

from __future__ import annotations

from typing import Any

import httpx
from pydantic import BaseModel, ConfigDict, Field

# Default port for update-server (update-server/Makefile: port ?= 34000).
DEFAULT_UPDATE_SERVER_PORT = 34000


class HealthResponse(BaseModel):
    """Response from GET /server/update/health (camelCase in API)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    update_server_version: str = Field(alias="updateServerVersion", default="unknown")
    api_server_version: str = Field(alias="apiServerVersion", default="unknown")
    system_version: str = Field(alias="systemVersion", default="unknown")
    name: str = "unknown"
    serial_number: str = Field(alias="serialNumber", default="unknown")
    boot_id: str = Field(alias="bootId", default="unknown")
    capabilities: dict[str, str] = Field(default_factory=dict)
    robot_model: str = Field(alias="robotModel", default="unknown")


class BeginResponse(BaseModel):
    """Response from POST /server/update/begin (201)."""

    token: str


class StatusResponse(BaseModel):
    """Response from GET /server/update/{session}/status (session state)."""

    stage: str
    progress: float = 0.0
    message: str = ""
    error: str = ""


class NameResponse(BaseModel):
    """Response from GET /server/name or POST /server/name."""

    name: str


class UpdateClient:
    """E2E test client for the update-server."""

    def __init__(
        self,
        base_url: str,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout)

    async def __aenter__(self) -> UpdateClient:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    # -- Health ----------------------------------------------------------------

    async def get_health(self) -> HealthResponse:
        """GET /server/update/health."""
        response = await self._client.get("/server/update/health")
        response.raise_for_status()
        return HealthResponse.model_validate(response.json())

    # -- Name ------------------------------------------------------------------

    async def get_name(self) -> NameResponse:
        """GET /server/name."""
        response = await self._client.get("/server/name")
        response.raise_for_status()
        return NameResponse.model_validate(response.json())

    async def set_name(self, name: str) -> NameResponse:
        """POST /server/name with JSON body {"name": name}."""
        response = await self.set_name_response({"name": name})
        response.raise_for_status()
        return NameResponse.model_validate(response.json())

    async def set_name_response(self, body: dict[str, Any]) -> httpx.Response:
        """POST /server/name without raising, useful for error assertions."""
        return await self._client.post("/server/name", json=body)

    # -- Update session --------------------------------------------------------

    async def begin_update(self) -> BeginResponse:
        """POST /server/update/begin. Returns session token (201)."""
        response = await self.begin_update_response()
        response.raise_for_status()
        return BeginResponse.model_validate(response.json())

    async def begin_update_response(self) -> httpx.Response:
        """POST /server/update/begin without raising."""
        return await self._client.post("/server/update/begin")

    async def cancel_update(self) -> dict[str, Any]:
        """POST /server/update/cancel. Returns {"message": "Session cancelled"}."""
        response = await self.cancel_update_response()
        response.raise_for_status()
        return response.json()

    async def cancel_update_response(self) -> httpx.Response:
        """POST /server/update/cancel without raising."""
        return await self._client.post("/server/update/cancel")

    async def get_status(self, session_token: str) -> StatusResponse:
        """GET /server/update/{session}/status."""
        response = await self._client.get(f"/server/update/{session_token}/status")
        response.raise_for_status()
        data = response.json()
        return StatusResponse(
            stage=data["stage"],
            progress=data.get("progress", 0.0),
            message=data.get("message", ""),
            error=data.get("error", ""),
        )

    async def commit_update(self, session_token: str) -> dict[str, Any]:
        """POST /server/update/{session}/commit. Only valid when stage is done."""
        response = await self.commit_update_response(session_token)
        response.raise_for_status()
        return response.json()

    async def commit_update_response(self, session_token: str) -> httpx.Response:
        """POST /server/update/{session}/commit without raising."""
        return await self._client.post(f"/server/update/{session_token}/commit")

    # -- Restart ---------------------------------------------------------------

    async def restart(self) -> dict[str, Any]:
        """POST /server/restart. Returns {"message": "Restarting in 1s"}."""
        response = await self.restart_response()
        response.raise_for_status()
        return response.json()

    async def restart_response(self) -> httpx.Response:
        """POST /server/restart without raising."""
        return await self._client.post("/server/restart")
