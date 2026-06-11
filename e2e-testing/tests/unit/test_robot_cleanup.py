"""Unit tests for robot run cleanup helpers."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from automation.robot_cleanup import (
    ACTIVE_EXECUTION_STATUSES,
    DELETABLE_RUN_STATUSES,
    TERMINAL_RUN_STATUSES,
    _current_run_id,
    resolve_robot_control_session,
)


def test_current_run_id_from_links() -> None:
    payload: dict[str, object] = {"links": {"current": {"href": "/runs/run-123"}}}
    assert _current_run_id(payload) == "run-123"


def test_current_run_id_missing() -> None:
    assert _current_run_id({}) is None
    assert _current_run_id({"links": {}}) is None


def test_status_sets_do_not_overlap() -> None:
    assert TERMINAL_RUN_STATUSES.isdisjoint(ACTIVE_EXECUTION_STATUSES)
    assert "idle" in DELETABLE_RUN_STATUSES
    assert "running" not in DELETABLE_RUN_STATUSES


@pytest.mark.asyncio
async def test_resolve_robot_control_session_without_auth_when_ac_off(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = MagicMock()
    client.get_token = AsyncMock(
        side_effect=httpx.HTTPStatusError(
            "invalid_grant",
            request=httpx.Request("POST", "https://robot/auth/oauth2/token"),
            response=httpx.Response(400),
        )
    )
    access_control = MagicMock()
    access_control.access_control_enabled = False
    client.get_access_control_settings = AsyncMock(return_value=access_control)

    monkeypatch.delenv("AUTH_USERNAME", raising=False)
    monkeypatch.delenv("AUTH_PASSWORD", raising=False)

    session = await resolve_robot_control_session(client)

    assert session.token is None
    assert session.label == "no auth (access control disabled)"
