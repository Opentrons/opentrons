"""Smoke tests for the system-server register/authorize/connected flow.

These tests verify the system-server is up and that the deprecated
register -> authorize -> connected flow works end-to-end.
"""

from __future__ import annotations

import base64

import pytest

from automation.clients.system import SystemClient

pytestmark = [pytest.mark.systemE2E, pytest.mark.anyio]

_ONE_BY_ONE_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5W4H0AAAAASUVORK5CYII="
)


# -- Register ------------------------------------------------------------------


async def test_register_returns_token(system_client: SystemClient) -> None:
    """POST /system/register returns a registration token."""
    resp = await system_client.register(
        subject="e2e-subject",
        agent="e2e-agent",
        agent_id="e2e-agent-id-1",
    )
    assert resp.token


async def test_register_same_params_returns_same_token(system_client: SystemClient) -> None:
    """Repeated register with same subject/agent/agent_id returns the same token."""
    first = await system_client.register(
        subject="same-subject",
        agent="same-agent",
        agent_id="same-agent-id",
    )
    second = await system_client.register(
        subject="same-subject",
        agent="same-agent",
        agent_id="same-agent-id",
    )
    assert first.token == second.token


async def test_register_different_params_returns_different_token(
    system_client: SystemClient,
) -> None:
    """Register with different agent returns a different token."""
    first = await system_client.register(
        subject="subj",
        agent="agent-a",
        agent_id="id-1",
    )
    second = await system_client.register(
        subject="subj",
        agent="agent-b",
        agent_id="id-1",
    )
    assert first.token != second.token


# -- Connected (test empty before any authorize adds connections) -------------


async def test_get_connected_empty_initially(system_client: SystemClient) -> None:
    """GET /system/connected returns empty list when no one has authorized yet."""
    resp = await system_client.get_connected()
    assert resp.connections == []


# -- Authorize -----------------------------------------------------------------


async def test_authorize_exchanges_registration_for_auth_token(
    system_client: SystemClient,
) -> None:
    """POST /system/authorize with valid registration token returns auth token."""
    reg = await system_client.register(
        subject="auth-subject",
        agent="auth-agent",
        agent_id="auth-agent-id",
    )
    auth = await system_client.authorize(reg.token)
    assert auth.token
    assert auth.token != reg.token


async def test_authorize_invalid_token_rejected(system_client: SystemClient) -> None:
    """POST /system/authorize with invalid token returns 401."""
    resp = await system_client.post_authorize_response("invalid-token")
    assert resp.status_code == 401


async def test_check_authorization_valid_token(system_client: SystemClient) -> None:
    """GET /system/authorize with valid auth token returns 200."""
    reg = await system_client.register(
        subject="check-subject",
        agent="check-agent",
        agent_id="check-agent-id",
    )
    auth = await system_client.authorize(reg.token)
    await system_client.check_authorization(auth.token)


async def test_check_authorization_registration_token_rejected(
    system_client: SystemClient,
) -> None:
    """GET /system/authorize with registration token (not auth token) returns 403."""
    reg = await system_client.register(
        subject="wrong-token-subject",
        agent="wrong-token-agent",
        agent_id="wrong-token-agent-id",
    )
    resp = await system_client.get_authorize_response(reg.token)
    assert resp.status_code == 403


# -- Connected (after authorize) ------------------------------------------------


async def test_register_authorize_then_connected_list_includes_entry(
    system_client: SystemClient,
) -> None:
    """After register + authorize, GET /system/connected includes the connection."""
    subject = "connected-subject"
    agent = "connected-agent"
    agent_id = "connected-agent-id"

    reg = await system_client.register(subject=subject, agent=agent, agent_id=agent_id)
    auth = await system_client.authorize(reg.token)
    await system_client.check_authorization(auth.token)

    resp = await system_client.get_connected()
    assert len(resp.connections) >= 1
    found = [c for c in resp.connections if c.subject == subject and c.agent == agent]
    assert found
    assert found[0].agent_id == agent_id


async def test_system_openapi_lists_core_paths(system_client: SystemClient) -> None:
    """The system-server OpenAPI document includes the tested endpoints."""
    openapi = await system_client.get_openapi()
    assert openapi["openapi"].startswith("3.")
    assert "/system/register" in openapi["paths"]
    assert "/system/authorize" in openapi["paths"]
    assert "/system/connected" in openapi["paths"]
    assert "/system/oem_mode/enable" in openapi["paths"]


async def test_enable_oem_mode_toggles(
    system_client: SystemClient,
    oem_mode_disabled: None,
) -> None:
    """OEM mode can be enabled and disabled."""
    enable_resp = await system_client.enable_oem_mode(True)
    assert enable_resp.status_code == 200

    disable_resp = await system_client.enable_oem_mode(False)
    assert disable_resp.status_code == 200


async def test_upload_splash_requires_oem_enabled(
    system_client: SystemClient,
    oem_mode_disabled: None,
) -> None:
    """Splash upload is forbidden unless OEM mode is enabled first."""
    resp = await system_client.upload_splash_image(
        file_name="splash.png",
        content=_ONE_BY_ONE_PNG,
    )
    assert resp.status_code == 403


async def test_upload_splash_rejects_invalid_type(
    system_client: SystemClient,
    oem_mode_disabled: None,
) -> None:
    """Only PNG uploads are accepted."""
    await system_client.enable_oem_mode(True)
    resp = await system_client.upload_splash_image(
        file_name="not-a-png.txt",
        content=b"plain text",
        content_type="text/plain",
    )
    assert resp.status_code == 415


async def test_upload_splash_accepts_png(
    system_client: SystemClient,
    oem_mode_disabled: None,
) -> None:
    """A small PNG can be uploaded when OEM mode is enabled."""
    await system_client.enable_oem_mode(True)
    resp = await system_client.upload_splash_image(
        file_name="splash.png",
        content=_ONE_BY_ONE_PNG,
    )
    assert resp.status_code == 201
