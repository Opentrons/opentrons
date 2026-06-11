"""Helpers for asserting OAuth scope enforcement on a Flex robot."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import httpx

from automation.clients.auth import AuthClient
from automation.clients.auth_models import TokenResponse
from automation.demo_users import DEMO_ADMIN_PASSWORD, DEMO_ADMIN_USERNAME

HTTPMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE"]


@dataclass(frozen=True, slots=True)
class AccessProbe:
    """One HTTP call used to verify scope enforcement."""

    label: str
    method: HTTPMethod
    path: str
    json_body: dict[str, Any] | None = None


async def authorized_request(
    client: AuthClient,
    probe: AccessProbe,
    token: TokenResponse,
) -> httpx.Response:
    """Send an authenticated request through the robot HTTPS proxy."""

    headers = AuthClient.auth_header(token)
    return await client._client.request(
        probe.method,
        probe.path,
        headers=headers,
        json=probe.json_body,
    )


def assert_allowed(response: httpx.Response, probe: AccessProbe) -> None:
    """Operator should pass scope checks (may still fail validation)."""

    assert response.status_code not in (
        401,
        403,
    ), (
        f"{probe.label}: expected access granted, got HTTP {response.status_code} "
        f"for {probe.method} {probe.path}: {response.text[:300]!r}"
    )


def assert_forbidden(response: httpx.Response, probe: AccessProbe) -> None:
    """Operator should be rejected for lacking the required scope."""

    assert response.status_code == 403, (
        f"{probe.label}: expected HTTP 403, got {response.status_code} "
        f"for {probe.method} {probe.path}: {response.text[:300]!r}"
    )


async def ensure_access_control_enabled(client: AuthClient) -> None:
    """Turn on access control if it is still off (one-way on the robot)."""

    access_control = await client.get_access_control_settings()
    if access_control.access_control_enabled:
        return

    token: TokenResponse | None
    try:
        token = await client.get_token(DEMO_ADMIN_USERNAME, DEMO_ADMIN_PASSWORD)
    except httpx.HTTPStatusError:
        token = None

    await client.patch_access_control_enabled(token)
