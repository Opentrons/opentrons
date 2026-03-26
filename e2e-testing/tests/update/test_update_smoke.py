"""Smoke tests for the update-server HTTP endpoints."""

from __future__ import annotations

import os

import pytest

from automation.clients.update import UpdateClient

pytestmark = pytest.mark.updateE2E


def test_get_health(update_client: UpdateClient) -> None:
    """GET /server/update/health returns the expected top-level fields."""
    health = update_client.get_health()
    assert health.update_server_version
    assert health.api_server_version
    assert health.system_version
    assert health.robot_model
    assert isinstance(health.capabilities, dict)


def test_get_name(update_client: UpdateClient) -> None:
    """GET /server/name returns the current device name."""
    name = update_client.get_name()
    assert name.name


def test_set_name_invalid_payload_rejected(update_client: UpdateClient) -> None:
    """Malformed name requests return 400 without mutating host state."""
    resp = update_client.set_name_response({})
    assert resp.status_code == 400


def test_valid_set_name_when_explicitly_enabled(update_client: UpdateClient) -> None:
    """A valid name mutation test is opt-in because it can touch local host settings."""
    if os.environ.get("UPDATE_SERVER_ALLOW_NAME_MUTATION", "").lower() != "true":
        pytest.skip("Set UPDATE_SERVER_ALLOW_NAME_MUTATION=true to exercise POST /server/name with a valid body.")

    new_name = "opentrons-e2e-update-test"
    result = update_client.set_name(new_name)
    assert result.name


def test_begin_update_returns_session_token(
    update_client: UpdateClient,
    clean_update_session: None,
) -> None:
    """POST /server/update/begin creates an update session."""
    result = update_client.begin_update()
    assert result.token


def test_second_begin_update_conflicts(
    update_client: UpdateClient,
    clean_update_session: None,
) -> None:
    """A second update session cannot be started while one is active."""
    update_client.begin_update()
    resp = update_client.begin_update_response()
    assert resp.status_code == 409


def test_get_status_for_active_session(
    update_client: UpdateClient,
    clean_update_session: None,
) -> None:
    """GET /server/update/{session}/status returns the current stage."""
    session = update_client.begin_update()
    status = update_client.get_status(session.token)
    assert status.stage


def test_commit_wrong_state_conflicts(
    update_client: UpdateClient,
    clean_update_session: None,
) -> None:
    """Committing before upload / validation completes returns 409."""
    session = update_client.begin_update()
    resp = update_client.commit_update_response(session.token)
    assert resp.status_code == 409


def test_cancel_update_is_idempotent(
    update_client: UpdateClient,
    clean_update_session: None,
) -> None:
    """Cancelling with and without an active session succeeds."""
    update_client.begin_update()
    first = update_client.cancel_update_response()
    second = update_client.cancel_update_response()
    assert first.status_code == 200
    assert second.status_code == 200
