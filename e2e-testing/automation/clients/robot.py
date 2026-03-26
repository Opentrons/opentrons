"""HTTP client for robot-server GET endpoints that may require auth.

Minimal client for a few GET endpoints. When the robot has access control
enabled, pass an access token (e.g. from automation.clients.auth.AuthClient.get_token).
Not yet robust for all robot-server or robot2-server behavior.

All Python attributes use snake_case; Pydantic models use aliases for
the API's camelCase where needed.
"""

from __future__ import annotations

from typing import Any

import httpx
from pydantic import BaseModel, ConfigDict, Field

# Default port for robot-server (e.g. Opentrons App, port 31950).
DEFAULT_ROBOT_SERVER_PORT = 31950
DEFAULT_OPENTRONS_VERSION = "*"


def _headers(access_token: str | None) -> dict[str, str]:
    """Build request headers; add Bearer token when provided."""
    headers = {"Opentrons-Version": DEFAULT_OPENTRONS_VERSION}
    if not access_token:
        return headers
    headers["Authorization"] = f"Bearer {access_token}"
    return headers


# -- Response models (robot-server uses camelCase in JSON) --------------------


class HealthLinks(BaseModel):
    """Links from GET /health."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    api_log: str = Field(alias="apiLog", default="")
    serial_log: str = Field(alias="serialLog", default="")
    server_log: str = Field(alias="serverLog", default="")
    api_spec: str = Field(alias="apiSpec", default="")
    system_time: str = Field(alias="systemTime", default="")


class DiskDetails(BaseModel):
    """Disk details from GET /health."""

    model_config = ConfigDict(populate_by_name=True)

    system_available_mb: float = Field(alias="systemAvailableMb", default=0.0)
    images_directory_size_mb: float = Field(
        alias="imagesDirectorySizeMb",
        default=0.0,
    )


class HealthResponse(BaseModel):
    """Response from GET /health (top-level keys are snake_case)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    name: str = ""
    robot_model: str = ""
    api_version: str = ""
    fw_version: str = ""
    system_version: str = ""
    robot_serial: str | None = None
    logs: list[str] = Field(default_factory=list)
    disk_details: DiskDetails | None = None
    links: HealthLinks | None = None


class RunResponse(BaseModel):
    """Minimal run resource from GET /runs or GET /runs/{runId}."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str = ""
    protocol_id: str | None = Field(alias="protocolId", default=None)
    current: bool = False
    status: str = ""
    created_at: str = Field(alias="createdAt", default="")


class RunsLink(BaseModel):
    """Links from GET /runs (current run href)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    href: str = ""


class RunsMeta(BaseModel):
    """Meta from GET /runs."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    cursor: int = 0
    total_length: int = Field(alias="totalLength", default=0)


class RunsResponse(BaseModel):
    """Response from GET /runs."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    data: list[RunResponse] = Field(default_factory=list)
    links: dict[str, Any] = Field(default_factory=dict)
    meta: RunsMeta | None = None


class RobotClient:
    """Thin client for robot-server GET endpoints (health, runs)."""

    def __init__(
        self,
        base_url: str,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(base_url=self.base_url, timeout=timeout)

    def __enter__(self) -> RobotClient:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def close(self) -> None:
        self._client.close()

    def get_openapi(self) -> dict[str, Any]:
        """GET /openapi.json and return the parsed OpenAPI document."""
        response = self._client.get("/openapi.json")
        response.raise_for_status()
        return response.json()

    def get_health(self, access_token: str | None = None) -> HealthResponse:
        """GET /health. Returns parsed health (name, robot_model, api_version, etc.)."""
        response = self._client.get("/health", headers=_headers(access_token))
        response.raise_for_status()
        return HealthResponse.model_validate(response.json())

    def get_runs(
        self,
        page_length: int | None = None,
        access_token: str | None = None,
    ) -> RunsResponse:
        """GET /runs. Returns parsed list (data, links, meta). Requires auth when access control is on."""
        params: dict[str, int] = {}
        if page_length is not None:
            params["pageLength"] = page_length
        response = self._client.get(
            "/runs",
            params=params or None,
            headers=_headers(access_token),
        )
        response.raise_for_status()
        return RunsResponse.model_validate(response.json())

    def get_run(
        self,
        run_id: str,
        access_token: str | None = None,
    ) -> RunResponse:
        """GET /runs/{run_id}. Returns parsed run resource. Requires auth when access control is on."""
        response = self._client.get(
            f"/runs/{run_id}",
            headers=_headers(access_token),
        )
        response.raise_for_status()
        body = response.json()
        data = body.get("data", body)
        return RunResponse.model_validate(data)
