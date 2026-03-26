"""Env-gated smoke tests for robot-server HTTP endpoints."""

from __future__ import annotations

import pytest

from automation.clients.auth import TokenResponse
from automation.clients.robot import RobotClient

pytestmark = pytest.mark.robotHTTP


def test_robot_openapi_lists_core_paths(robot_client: RobotClient) -> None:
    """The robot-server OpenAPI document includes the core smoke-tested endpoints."""
    openapi = robot_client.get_openapi()
    assert openapi["openapi"].startswith("3.")
    assert "/health" in openapi["paths"]
    assert "/runs" in openapi["paths"]
    assert "/runs/{runId}" in openapi["paths"]


def test_robot_health(robot_client: RobotClient) -> None:
    """GET /health returns basic robot metadata."""
    health = robot_client.get_health()
    assert health.name
    assert health.api_version
    assert health.system_version


def test_robot_runs_list(robot_client: RobotClient) -> None:
    """GET /runs returns a list wrapper with metadata."""
    runs = robot_client.get_runs(page_length=5)
    assert isinstance(runs.data, list)


def test_robot_get_first_run_when_present(robot_client: RobotClient) -> None:
    """GET /runs/{runId} works for an existing run when the robot has one."""
    runs = robot_client.get_runs(page_length=1)
    if not runs.data:
        pytest.skip("Robot has no runs to fetch individually.")

    run = robot_client.get_run(runs.data[0].id)
    assert run.id == runs.data[0].id


def test_robot_health_with_token(
    robot_client: RobotClient,
    robot_access_token: TokenResponse,
) -> None:
    """GET /health also succeeds when called with a Bearer token."""
    health = robot_client.get_health(access_token=robot_access_token.access_token)
    assert health.api_version


def test_robot_runs_with_token(
    robot_client: RobotClient,
    robot_access_token: TokenResponse,
) -> None:
    """GET /runs also succeeds when called with a Bearer token."""
    runs = robot_client.get_runs(page_length=5, access_token=robot_access_token.access_token)
    assert isinstance(runs.data, list)
