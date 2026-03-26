"""Async robot-server smoke tests focused on access-control-enabled behavior."""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

import pytest

from automation.clients.auth import TokenResponse
from automation.clients.robot import ProtocolRunExecutionResult, RobotClient

pytestmark = [pytest.mark.robotHTTP, pytest.mark.anyio]

DEFAULT_FLEX_PROTOCOL_PATH = (
    Path(__file__).resolve().parents[2] / "fixtures" / "protocol" / "9" / "simple_flex_comment_smoke.py"
)


def _flex_protocol_path() -> Path:
    """Resolve the Flex protocol file used for the auth-enabled robot run smoke test."""
    configured_path = os.environ.get("ROBOT_HTTP_PROTOCOL_PATH")
    if configured_path:
        return Path(configured_path).expanduser()
    return DEFAULT_FLEX_PROTOCOL_PATH


async def _run_flex_protocol(
    robot_client: RobotClient,
    access_token: str,
) -> ProtocolRunExecutionResult:
    """Upload the committed Flex protocol and execute it with an authenticated client."""
    health = await robot_client.get_health(access_token=access_token)
    if health.robot_model != "OT-3 Standard":
        pytest.skip(f"Flex protocol smoke test requires a Flex robot, got {health.robot_model!r}.")

    protocol_path = _flex_protocol_path()
    if not protocol_path.exists():
        pytest.skip(f"Flex protocol file not found: {protocol_path}")

    return await robot_client.upload_protocol_create_play_wait_for_run(
        file_name=protocol_path.name,
        content=protocol_path.read_bytes(),
        access_token=access_token,
        timeout_s=30.0,
        poll_interval_s=0.25,
    )


def _require_access_token(robot_access_token: TokenResponse | None) -> TokenResponse:
    """Require an access token because this suite centers auth-enabled coverage."""
    if robot_access_token is None:
        pytest.skip("Token-backed robot smoke checks require ROBOT_AUTH_SERVER_URL or AUTH_SERVER_URL.")
    return robot_access_token


def _assert_missing_token(response_text: str, status_code: int, www_authenticate: str | None) -> None:
    """Verify the missing-token response returned by a protected resource."""
    assert status_code == 401
    if www_authenticate is not None:
        assert "invalid_request" in www_authenticate
    assert "missing an access token" in response_text


async def test_robot_openapi_lists_core_paths(robot_client: RobotClient) -> None:
    """The robot-server OpenAPI document includes the core endpoints covered by this suite."""
    openapi = await robot_client.get_openapi()
    assert openapi["openapi"].startswith("3.")
    assert "/health" in openapi["paths"]
    assert "/runs" in openapi["paths"]
    assert "/runs/{runId}" in openapi["paths"]


async def test_robot_health(robot_client: RobotClient) -> None:
    """GET /health stays readable without authentication in auth-enabled mode."""
    health = await robot_client.get_health()
    assert health.name
    assert health.api_version
    assert health.system_version


async def test_robot_runs_list(
    robot_client: RobotClient,
    robot_access_token: TokenResponse | None,
) -> None:
    """GET /runs succeeds under the same auth-enabled stack used for protected writes."""
    token = _require_access_token(robot_access_token)
    runs = await robot_client.get_runs(page_length=5, access_token=token.access_token)
    assert isinstance(runs.data, list)


async def test_robot_get_run_after_protocol_execution(
    robot_client: RobotClient,
    robot_access_token: TokenResponse | None,
) -> None:
    """GET /runs/{runId} returns the authenticated run created by this test."""
    token = _require_access_token(robot_access_token)
    execution = await _run_flex_protocol(robot_client, token.access_token)

    run = await robot_client.get_run(
        execution.run_execution.created_run.id,
        access_token=token.access_token,
    )
    assert run.id == execution.run_execution.created_run.id
    assert run.protocol_id == execution.protocol.id


async def test_robot_health_with_token(
    robot_client: RobotClient,
    robot_access_token: TokenResponse | None,
) -> None:
    """GET /health also succeeds when called with a Bearer token."""
    token = _require_access_token(robot_access_token)
    health = await robot_client.get_health(access_token=token.access_token)
    assert health.api_version


async def test_robot_runs_with_token(
    robot_client: RobotClient,
    robot_access_token: TokenResponse | None,
) -> None:
    """GET /runs also succeeds when called with a Bearer token."""
    token = _require_access_token(robot_access_token)
    runs = await robot_client.get_runs(page_length=5, access_token=token.access_token)
    assert isinstance(runs.data, list)


async def test_robot_protected_write_endpoints_require_authentication(
    robot_client: RobotClient,
    robot_access_token: TokenResponse | None,
) -> None:
    """Protected write routes reject missing tokens and accept a valid admin token."""
    token = _require_access_token(robot_access_token)
    protocol_path = _flex_protocol_path()
    if not protocol_path.exists():
        pytest.skip(f"Flex protocol file not found: {protocol_path}")

    unauth_protocol = await robot_client.upload_protocol_response(
        file_name=protocol_path.name,
        content=protocol_path.read_bytes(),
    )
    _assert_missing_token(
        unauth_protocol.text,
        unauth_protocol.status_code,
        unauth_protocol.headers.get("WWW-Authenticate"),
    )

    unauth_run = await robot_client.create_run_response()
    _assert_missing_token(
        unauth_run.text,
        unauth_run.status_code,
        unauth_run.headers.get("WWW-Authenticate"),
    )

    authed_run = await robot_client.create_run(access_token=token.access_token)
    unauth_action = await robot_client.create_run_action_response(
        authed_run.id,
        action_type="play",
    )
    _assert_missing_token(
        unauth_action.text,
        unauth_action.status_code,
        unauth_action.headers.get("WWW-Authenticate"),
    )


async def test_robot_protocol_run_lifecycle_utility(
    robot_client: RobotClient,
    robot_access_token: TokenResponse | None,
) -> None:
    """Exercise the authenticated protocol-upload and run lifecycle helper end to end."""
    token = _require_access_token(robot_access_token)
    execution = await _run_flex_protocol(robot_client, token.access_token)

    assert execution.protocol.id
    assert execution.run_execution.created_run.id
    assert execution.run_execution.created_run.protocol_id == execution.protocol.id
    assert execution.run_execution.play_action.action_type == "play"
    assert execution.run_execution.final_run.id == execution.run_execution.created_run.id
    assert execution.run_execution.final_run.status in {"succeeded", "failed", "stopped"}
    assert execution.run_execution.final_run.started_at is not None
    assert execution.run_execution.final_run.completed_at is not None


async def test_robot_core_endpoints_concurrently(
    robot_client: RobotClient,
    robot_access_token: TokenResponse | None,
) -> None:
    """Mix public and authenticated endpoint checks to catch auth-enabled regressions quickly."""
    token = _require_access_token(robot_access_token)
    openapi, public_health, authed_health, authed_runs = await asyncio.gather(
        robot_client.get_openapi(),
        robot_client.get_health(),
        robot_client.get_health(access_token=token.access_token),
        robot_client.get_runs(page_length=5, access_token=token.access_token),
    )

    assert openapi["openapi"].startswith("3.")
    assert public_health.api_version
    assert authed_health.api_version
    assert isinstance(authed_runs.data, list)

    candidate_run_id = None
    if authed_runs.data:
        candidate_run_id = authed_runs.data[0].id

    if candidate_run_id is not None:
        fetched_run = await robot_client.get_run(
            candidate_run_id,
            access_token=token.access_token,
        )
        assert fetched_run.id == candidate_run_id
