from __future__ import annotations

import asyncio
import concurrent.futures
import contextlib
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List

import httpx
from httpx import Response


STARTUP_WAIT = 20
SHUTDOWN_WAIT = 20


class RobotClient:
    """Client for the robot's HTTP API.

    This is mostly a thin wrapper, where most methods have a 1:1 correspondence
    with HTTP endpoints. See the robot server's OpenAPI specification for
    details on semantics and request/response shapes.
    """

    def __init__(
        self,
        httpx_client: httpx.AsyncClient,
        worker_executor: concurrent.futures.ThreadPoolExecutor,
        host: str,
        port: str,
    ) -> None:
        """Initialize the client."""
        self.base_url: str = f"{host}:{port}"
        self.httpx_client: httpx.AsyncClient = httpx_client
        self.worker_executor: concurrent.futures.ThreadPoolExecutor = worker_executor

    @staticmethod
    @contextlib.asynccontextmanager
    async def make(
        host: str, port: str, version: str
    ) -> AsyncGenerator[RobotClient, None]:
        with concurrent.futures.ThreadPoolExecutor() as worker_executor:
            async with httpx.AsyncClient(
                headers={"opentrons-version": version}
            ) as httpx_client:
                yield RobotClient(
                    httpx_client=httpx_client,
                    worker_executor=worker_executor,
                    host=host,
                    port=port,
                )

    async def alive(self) -> bool:
        """Is /health reachable?"""
        try:
            await self.get_health()
            return True
        except (httpx.ConnectError, httpx.HTTPStatusError):
            return False

    async def dead(self) -> bool:
        """Is /health unreachable?"""
        try:
            await self.get_health()
            return False
        except httpx.HTTPStatusError:
            return False
        except httpx.ConnectError:
            pass

        return True

    async def _poll_for_alive(self) -> None:
        """Retry GET /health until reachable."""
        while not await self.alive():
            # Avoid spamming the server in case a request immediately
            # returns some kind of "not ready."
            await asyncio.sleep(0.1)

    async def _poll_for_dead(self) -> None:
        """Poll GET /health until unreachable."""
        while not await self.dead():
            # Avoid spamming the server in case a request immediately
            # returns some kind of "not ready."
            await asyncio.sleep(0.1)

    async def wait_until_alive(self, timeout_sec: float = STARTUP_WAIT) -> bool:
        try:
            await asyncio.wait_for(self._poll_for_alive(), timeout=timeout_sec)
            return True
        except asyncio.TimeoutError:
            return False

    async def wait_until_dead(self, timeout_sec: float = SHUTDOWN_WAIT) -> bool:
        """Retry GET /health and until unreachable."""
        try:
            await asyncio.wait_for(self._poll_for_dead(), timeout=timeout_sec)
            return True
        except asyncio.TimeoutError:
            return False

    async def get_health(self) -> Response:
        """GET /health."""
        response = await self.httpx_client.get(url=f"{self.base_url}/health")
        response.raise_for_status()
        return response

    async def get_protocols(self) -> Response:
        """GET /protocols."""
        response = await self.httpx_client.get(url=f"{self.base_url}/protocols")
        response.raise_for_status()
        return response

    async def get_protocol(self, protocol_id: str) -> Response:
        """GET /protocols/{protocol_id}."""
        response = await self.httpx_client.get(
            url=f"{self.base_url}/protocols/{protocol_id}"
        )
        return response

    async def post_protocol(self, files: List[Path]) -> Response:
        """POST /protocols."""
        file_payload = []
        for file in files:
            file_payload.append(("files", open(file, "rb")))
        response = await self.httpx_client.post(
            url=f"{self.base_url}/protocols", files=file_payload
        )
        response.raise_for_status()
        return response

    async def get_runs(self) -> Response:
        """GET /runs."""
        response = await self.httpx_client.get(url=f"{self.base_url}/runs")
        response.raise_for_status()
        return response

    async def post_run(self, req_body: Dict[str, object]) -> Response:
        """POST /runs."""
        response = await self.httpx_client.post(
            url=f"{self.base_url}/runs", json=req_body
        )
        response.raise_for_status()
        return response

    async def patch_run(self, run_id: str, req_body: Dict[str, object]) -> Response:
        """POST /runs."""
        response = await self.httpx_client.patch(
            url=f"{self.base_url}/runs/{run_id}",
            json=req_body,
        )
        response.raise_for_status()
        return response

    async def get_run(self, run_id: str) -> Response:
        """GET /runs/:run_id."""
        response = await self.httpx_client.get(url=f"{self.base_url}/runs/{run_id}")
        response.raise_for_status()
        return response

    async def post_run_command(
        self,
        run_id: str,
        req_body: Dict[str, object],
        params: Dict[str, Any],
    ) -> Response:
        """POST /runs/:run_id/commands."""
        response = await self.httpx_client.post(
            url=f"{self.base_url}/runs/{run_id}/commands",
            json=req_body,
            params=params,
        )
        response.raise_for_status()
        return response

    async def get_run_commands(self, run_id: str) -> Response:
        """GET /runs/:run_id/commands."""
        response = await self.httpx_client.get(
            url=f"{self.base_url}/runs/{run_id}/commands",
        )
        response.raise_for_status()
        return response

    async def get_run_command(self, run_id: str, command_id: str) -> Response:
        """GET /runs/:run_id/commands/:command_id."""
        response = await self.httpx_client.get(
            url=f"{self.base_url}/runs/{run_id}/commands/{command_id}",
        )
        response.raise_for_status()
        return response

    async def post_labware_offset(
        self,
        run_id: str,
        req_body: Dict[str, object],
    ) -> Response:
        """POST /runs/:run_id/labware_offsets."""
        response = await self.httpx_client.post(
            url=f"{self.base_url}/runs/{run_id}/labware_offsets",
            json=req_body,
        )
        response.raise_for_status()
        return response

    async def post_run_action(
        self,
        run_id: str,
        req_body: Dict[str, object],
    ) -> Response:
        """POST /runs/:run_id/commands."""
        response = await self.httpx_client.post(
            url=f"{self.base_url}/runs/{run_id}/actions",
            json=req_body,
        )
        response.raise_for_status()
        return response

    async def get_analysis(self, protocol_id: str, analysis_id: str) -> Response:
        """GET /protocols/{protocol_id}/{analysis_id}."""
        response = await self.httpx_client.get(
            url=f"{self.base_url}/protocols/{protocol_id}/analyses/{analysis_id}"
        )
        response.raise_for_status()
        return response

    async def delete_run(self, run_id: str) -> Response:
        """DELETE /runs/{run_id}."""
        response = await self.httpx_client.delete(f"{self.base_url}/runs/{run_id}")
        response.raise_for_status()
        return response

    async def post_setting_reset_options(
        self,
        req_body: Dict[str, bool],
    ) -> Response:
        """POST /settings/reset."""
        response = await self.httpx_client.post(
            url=f"{self.base_url}/settings/reset",
            json=req_body,
        )
        response.raise_for_status()
        return response
