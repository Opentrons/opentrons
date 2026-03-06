"""Smoke tests for the system-server register/authorize/connected flow.

These tests verify the system-server is up and that the deprecated
register -> authorize -> connected flow works end-to-end.
"""

from __future__ import annotations

import pytest

from automation.clients.system import SystemClient

pytestmark = pytest.mark.systemE2E


# -- Register ------------------------------------------------------------------


def test_register_returns_token(system_client: SystemClient) -> None:
    """POST /system/register returns a registration token."""
    resp = system_client.register(
        subject="e2e-subject",
        agent="e2e-agent",
        agent_id="e2e-agent-id-1",
    )
    assert resp.token


def test_register_same_params_returns_same_token(system_client: SystemClient) -> None:
    """Repeated register with same subject/agent/agent_id returns the same token."""
    first = system_client.register(
        subject="same-subject",
        agent="same-agent",
        agent_id="same-agent-id",
    )
    second = system_client.register(
        subject="same-subject",
        agent="same-agent",
        agent_id="same-agent-id",
    )
    assert first.token == second.token


def test_register_different_params_returns_different_token(
    system_client: SystemClient,
) -> None:
    """Register with different agent returns a different token."""
    first = system_client.register(
        subject="subj",
        agent="agent-a",
        agent_id="id-1",
    )
    second = system_client.register(
        subject="subj",
        agent="agent-b",
        agent_id="id-1",
    )
    assert first.token != second.token


# -- Connected (test empty before any authorize adds connections) -------------


def test_get_connected_empty_initially(system_client: SystemClient) -> None:
    """GET /system/connected returns empty list when no one has authorized yet."""
    resp = system_client.get_connected()
    assert resp.connections == []


# -- Authorize -----------------------------------------------------------------


def test_authorize_exchanges_registration_for_auth_token(
    system_client: SystemClient,
) -> None:
    """POST /system/authorize with valid registration token returns auth token."""
    reg = system_client.register(
        subject="auth-subject",
        agent="auth-agent",
        agent_id="auth-agent-id",
    )
    auth = system_client.authorize(reg.token)
    assert auth.token
    assert auth.token != reg.token


def test_authorize_invalid_token_rejected(system_client: SystemClient) -> None:
    """POST /system/authorize with invalid token returns 401."""
    resp = system_client._client.post(
        "/system/authorize",
        headers={"authenticationbearer": "invalid-token"},
    )
    assert resp.status_code == 401


def test_check_authorization_valid_token(system_client: SystemClient) -> None:
    """GET /system/authorize with valid auth token returns 200."""
    reg = system_client.register(
        subject="check-subject",
        agent="check-agent",
        agent_id="check-agent-id",
    )
    auth = system_client.authorize(reg.token)
    system_client.check_authorization(auth.token)


def test_check_authorization_registration_token_rejected(
    system_client: SystemClient,
) -> None:
    """GET /system/authorize with registration token (not auth token) returns 403."""
    reg = system_client.register(
        subject="wrong-token-subject",
        agent="wrong-token-agent",
        agent_id="wrong-token-agent-id",
    )
    resp = system_client._client.get(
        "/system/authorize",
        headers={"authenticationbearer": reg.token},
    )
    assert resp.status_code == 403


# -- Connected (after authorize) ------------------------------------------------


def test_register_authorize_then_connected_list_includes_entry(
    system_client: SystemClient,
) -> None:
    """After register + authorize, GET /system/connected includes the connection."""
    subject = "connected-subject"
    agent = "connected-agent"
    agent_id = "connected-agent-id"

    reg = system_client.register(subject=subject, agent=agent, agent_id=agent_id)
    auth = system_client.authorize(reg.token)
    system_client.check_authorization(auth.token)

    resp = system_client.get_connected()
    assert len(resp.connections) >= 1
    found = [c for c in resp.connections if c.subject == subject and c.agent == agent]
    assert found
    assert found[0].agent_id == agent_id
