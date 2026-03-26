"""HTTP client for robot-server GET endpoints that may require auth.

Minimal client for a few GET endpoints. When the robot has access control
enabled, pass an access token (e.g. from automation.clients.auth.AuthClient.get_token).
Not yet robust for all robot-server or robot2-server behavior.

All Python attributes use snake_case; Pydantic models use aliases for
the API's camelCase where needed.
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Collection
from pathlib import Path
from typing import Any

import httpx
from pydantic import BaseModel, ConfigDict, Field

# Default port for robot-server (e.g. Opentrons App, port 31950).
DEFAULT_ROBOT_SERVER_PORT = 31950
DEFAULT_OPENTRONS_VERSION = "*"
TERMINAL_RUN_STATUSES = {"succeeded", "failed", "stopped"}


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
    started_at: str | None = Field(alias="startedAt", default=None)
    completed_at: str | None = Field(alias="completedAt", default=None)


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


class RunActionResponse(BaseModel):
    """Run action resource returned from POST /runs/{runId}/actions."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str = ""
    action_type: str = Field(alias="actionType", default="")
    created_at: str = Field(alias="createdAt", default="")


class RunExecutionResult(BaseModel):
    """Convenience bundle for create -> play -> wait -> final record."""

    created_run: RunResponse
    play_action: RunActionResponse
    final_run: RunResponse


class AnalysisSummaryResponse(BaseModel):
    """Protocol analysis summary returned in protocol resources."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str = ""
    status: str = ""


class AnalysisResponse(BaseModel):
    """Protocol analysis resource from `GET /protocols/{id}/analyses/{analysisId}`."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str = ""
    status: str = ""
    result: str | None = None
    errors: list[Any] = Field(default_factory=list)


class ProtocolResponse(BaseModel):
    """Uploaded protocol resource returned from POST /protocols."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str = ""
    created_at: str = Field(alias="createdAt", default="")
    protocol_type: str = Field(alias="protocolType", default="")
    robot_type: str = Field(alias="robotType", default="")
    key: str | None = None
    protocol_kind: str | None = Field(alias="protocolKind", default=None)
    analysis_summaries: list[AnalysisSummaryResponse] = Field(
        alias="analysisSummaries",
        default_factory=list,
    )


class ProtocolRunExecutionResult(BaseModel):
    """Convenience bundle for upload -> create run -> play -> wait -> final record."""

    protocol: ProtocolResponse
    run_execution: RunExecutionResult


class RobotClient:
    """Thin client for robot-server GET endpoints (health, runs)."""

    def __init__(
        self,
        base_url: str,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout)

    async def __aenter__(self) -> RobotClient:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    async def get_openapi(self) -> dict[str, Any]:
        """GET /openapi.json and return the parsed OpenAPI document."""
        response = await self._client.get("/openapi.json")
        response.raise_for_status()
        return response.json()

    async def upload_protocol(
        self,
        *,
        file_name: str,
        content: bytes,
        content_type: str = "text/x-python",
        key: str | None = None,
        protocol_kind: str | None = None,
        access_token: str | None = None,
    ) -> ProtocolResponse:
        """POST /protocols and return the uploaded protocol resource."""
        response = await self.upload_protocol_response(
            file_name=file_name,
            content=content,
            content_type=content_type,
            key=key,
            protocol_kind=protocol_kind,
            access_token=access_token,
        )
        response.raise_for_status()
        return ProtocolResponse.model_validate(response.json()["data"])

    async def upload_protocol_file(
        self,
        *,
        path: str | Path,
        content_type: str = "text/x-python",
        key: str | None = None,
        protocol_kind: str | None = None,
        access_token: str | None = None,
    ) -> ProtocolResponse:
        """POST /protocols using a file from disk and return the uploaded protocol resource."""
        protocol_path = Path(path)
        return await self.upload_protocol(
            file_name=protocol_path.name,
            content=protocol_path.read_bytes(),
            content_type=content_type,
            key=key,
            protocol_kind=protocol_kind,
            access_token=access_token,
        )

    async def upload_protocol_response(
        self,
        *,
        file_name: str,
        content: bytes,
        content_type: str = "text/x-python",
        key: str | None = None,
        protocol_kind: str | None = None,
        access_token: str | None = None,
    ) -> httpx.Response:
        """POST /protocols without raising, useful for status assertions."""
        data: dict[str, str] = {}
        if key is not None:
            data["key"] = key
        if protocol_kind is not None:
            data["protocolKind"] = protocol_kind
        return await self._client.post(
            "/protocols",
            data=data or None,
            files={"files": (file_name, content, content_type)},
            headers=_headers(access_token),
        )

    async def get_analysis(
        self,
        protocol_id: str,
        analysis_id: str,
        access_token: str | None = None,
    ) -> AnalysisResponse:
        """GET /protocols/{protocolId}/analyses/{analysisId} and return the parsed analysis."""
        response = await self._client.get(
            f"/protocols/{protocol_id}/analyses/{analysis_id}",
            headers=_headers(access_token),
        )
        response.raise_for_status()
        return AnalysisResponse.model_validate(response.json()["data"])

    async def create_run(
        self,
        create_data: dict[str, Any] | None = None,
        access_token: str | None = None,
    ) -> RunResponse:
        """POST /runs and return the created run resource."""
        response = await self.create_run_response(
            create_data=create_data,
            access_token=access_token,
        )
        response.raise_for_status()
        return RunResponse.model_validate(response.json()["data"])

    async def create_run_response(
        self,
        create_data: dict[str, Any] | None = None,
        access_token: str | None = None,
    ) -> httpx.Response:
        """POST /runs without raising, useful for status assertions."""
        json_body = {"data": create_data} if create_data is not None else None
        return await self._client.post(
            "/runs",
            json=json_body,
            headers=_headers(access_token),
        )

    async def create_run_action(
        self,
        run_id: str,
        action_type: str,
        access_token: str | None = None,
    ) -> RunActionResponse:
        """POST /runs/{runId}/actions and return the created action."""
        response = await self.create_run_action_response(
            run_id,
            action_type=action_type,
            access_token=access_token,
        )
        response.raise_for_status()
        return RunActionResponse.model_validate(response.json()["data"])

    async def create_run_action_response(
        self,
        run_id: str,
        *,
        action_type: str,
        access_token: str | None = None,
    ) -> httpx.Response:
        """POST /runs/{runId}/actions without raising, useful for status assertions."""
        return await self._client.post(
            f"/runs/{run_id}/actions",
            json={"data": {"actionType": action_type}},
            headers=_headers(access_token),
        )

    async def play_run(
        self,
        run_id: str,
        access_token: str | None = None,
    ) -> RunActionResponse:
        """Issue the run `play` action to start or resume execution."""
        return await self.create_run_action(run_id, action_type="play", access_token=access_token)

    async def get_health(self, access_token: str | None = None) -> HealthResponse:
        """GET /health. Returns parsed health (name, robot_model, api_version, etc.)."""
        response = await self._client.get("/health", headers=_headers(access_token))
        response.raise_for_status()
        return HealthResponse.model_validate(response.json())

    async def get_runs(
        self,
        page_length: int | None = None,
        access_token: str | None = None,
    ) -> RunsResponse:
        """GET /runs. Returns parsed list (data, links, meta)."""
        params: dict[str, int] = {}
        if page_length is not None:
            params["pageLength"] = page_length
        response = await self._client.get(
            "/runs",
            params=params or None,
            headers=_headers(access_token),
        )
        response.raise_for_status()
        return RunsResponse.model_validate(response.json())

    async def get_run(
        self,
        run_id: str,
        access_token: str | None = None,
    ) -> RunResponse:
        """GET /runs/{run_id}. Returns the parsed run resource."""
        response = await self._client.get(
            f"/runs/{run_id}",
            headers=_headers(access_token),
        )
        response.raise_for_status()
        body = response.json()
        data = body.get("data", body)
        return RunResponse.model_validate(data)

    async def wait_for_run_terminal(
        self,
        run_id: str,
        *,
        access_token: str | None = None,
        timeout_s: float = 30.0,
        poll_interval_s: float = 0.25,
        terminal_statuses: Collection[str] = TERMINAL_RUN_STATUSES,
    ) -> RunResponse:
        """Poll GET /runs/{runId} until the run reaches a terminal status."""
        start = time.monotonic()
        while True:
            run = await self.get_run(run_id, access_token=access_token)
            if run.status in terminal_statuses:
                return run
            if time.monotonic() - start >= timeout_s:
                raise TimeoutError(
                    f"Run {run_id} did not reach a terminal status within {timeout_s}s; last status was {run.status!r}."
                )
            await asyncio.sleep(poll_interval_s)

    async def wait_for_analysis_completed(
        self,
        protocol_id: str,
        analysis_id: str,
        *,
        access_token: str | None = None,
        timeout_s: float = 30.0,
        poll_interval_s: float = 0.25,
    ) -> AnalysisResponse:
        """Poll a protocol analysis until it completes and return the final analysis."""
        start = time.monotonic()
        while True:
            analysis = await self.get_analysis(
                protocol_id,
                analysis_id,
                access_token=access_token,
            )
            if analysis.status == "completed":
                return analysis
            if time.monotonic() - start >= timeout_s:
                raise TimeoutError(
                    "Analysis "
                    f"{analysis_id} for protocol {protocol_id} did not complete "
                    f"within {timeout_s}s; last status was {analysis.status!r}."
                )
            await asyncio.sleep(poll_interval_s)

    async def create_play_wait_for_run(
        self,
        *,
        create_data: dict[str, Any] | None = None,
        access_token: str | None = None,
        timeout_s: float = 30.0,
        poll_interval_s: float = 0.25,
    ) -> RunExecutionResult:
        """Create a run, issue `play`, wait for terminal status, and return all three artifacts."""
        created_run = await self.create_run(create_data=create_data, access_token=access_token)
        play_action = await self.play_run(created_run.id, access_token=access_token)
        final_run = await self.wait_for_run_terminal(
            created_run.id,
            access_token=access_token,
            timeout_s=timeout_s,
            poll_interval_s=poll_interval_s,
        )
        return RunExecutionResult(
            created_run=created_run,
            play_action=play_action,
            final_run=final_run,
        )

    async def upload_protocol_create_play_wait_for_run(
        self,
        *,
        file_name: str,
        content: bytes,
        content_type: str = "text/x-python",
        key: str | None = None,
        protocol_kind: str | None = None,
        access_token: str | None = None,
        timeout_s: float = 30.0,
        poll_interval_s: float = 0.25,
    ) -> ProtocolRunExecutionResult:
        """Upload a protocol, create a run for it, play it, wait for terminal status, and return all artifacts."""
        protocol = await self.upload_protocol(
            file_name=file_name,
            content=content,
            content_type=content_type,
            key=key,
            protocol_kind=protocol_kind,
            access_token=access_token,
        )
        if not protocol.analysis_summaries:
            raise RuntimeError(f"Uploaded protocol {protocol.id} did not include any analysis summaries.")
        latest_analysis = protocol.analysis_summaries[-1]
        completed_analysis = await self.wait_for_analysis_completed(
            protocol.id,
            latest_analysis.id,
            access_token=access_token,
            timeout_s=timeout_s,
            poll_interval_s=poll_interval_s,
        )
        if completed_analysis.result != "ok":
            raise RuntimeError(
                "Protocol analysis "
                f"{completed_analysis.id} for protocol {protocol.id} completed "
                f"with result {completed_analysis.result!r}."
            )
        run_execution = await self.create_play_wait_for_run(
            create_data={"protocolId": protocol.id},
            access_token=access_token,
            timeout_s=timeout_s,
            poll_interval_s=poll_interval_s,
        )
        return ProtocolRunExecutionResult(protocol=protocol, run_execution=run_execution)
