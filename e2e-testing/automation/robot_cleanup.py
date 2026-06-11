"""Stop and remove leftover protocol and maintenance runs on a Flex robot."""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass, field

import httpx

from automation.clients.auth import AuthClient
from automation.clients.auth_models import TokenResponse
from automation.demo_users import (
    DEFAULT_DEMO_PASSWORD,
    DEMO_ADMIN_PASSWORD,
    DEMO_ADMIN_USERNAME,
    DEMO_OPERATOR_USERNAME,
    DEMO_SERVICE_USERNAME,
)

TERMINAL_RUN_STATUSES = frozenset({"stopped", "failed", "succeeded"})
ACTIVE_EXECUTION_STATUSES = frozenset(
    {
        "running",
        "paused",
        "blocked-by-open-door",
        "stop-requested",
        "finishing",
        "awaiting-recovery",
        "awaiting-recovery-paused",
        "awaiting-recovery-blocked-by-open-door",
    }
)
DELETABLE_RUN_STATUSES = TERMINAL_RUN_STATUSES | {"idle"}


@dataclass(frozen=True, slots=True)
class RobotControlSession:
    """Credentials used for robot_control.write endpoints."""

    label: str
    token: TokenResponse | None


@dataclass(frozen=True, slots=True)
class CleanupAction:
    """One cleanup step that was attempted."""

    target: str
    action: str
    outcome: str


@dataclass
class CleanupReport:
    """Summary of cleanup work performed on a robot."""

    auth_label: str
    actions: list[CleanupAction] = field(default_factory=list)

    @property
    def changed(self) -> bool:
        return any(action.outcome != "unchanged" for action in self.actions)


def _auth_headers(token: TokenResponse | None) -> dict[str, str]:
    return AuthClient.auth_header(token) if token else {}


async def resolve_robot_control_session(client: AuthClient) -> RobotControlSession:
    """Return a token with ``robot_control.write``, or unauthenticated if AC is off."""

    candidates = (
        (DEMO_SERVICE_USERNAME, DEFAULT_DEMO_PASSWORD, "demo_service (hardcoded)"),
        (DEMO_ADMIN_USERNAME, DEMO_ADMIN_PASSWORD, "demo_admin (hardcoded)"),
        (DEMO_OPERATOR_USERNAME, DEFAULT_DEMO_PASSWORD, "demo_operator (hardcoded)"),
    )
    for username, password, label in candidates:
        try:
            token = await client.get_token(username, password)
        except httpx.HTTPStatusError:
            continue
        return RobotControlSession(label=label, token=token)

    env_username = os.environ.get("AUTH_USERNAME", "").strip()
    env_password = os.environ.get("AUTH_PASSWORD", "").strip()
    if env_username and env_password:
        try:
            token = await client.get_token(env_username, env_password)
        except httpx.HTTPStatusError:
            pass
        else:
            return RobotControlSession(
                label=f"{env_username} (AUTH_USERNAME fallback)",
                token=token,
            )

    access_control = await client.get_access_control_settings()
    if not access_control.access_control_enabled:
        return RobotControlSession(label="no auth (access control disabled)", token=None)

    raise ValueError(
        "Could not log in with demo_service, demo_admin, demo_operator, or "
        "AUTH_USERNAME/AUTH_PASSWORD, and access control is enabled. Set valid "
        "credentials with robot_control.write."
    )


async def _get_json(
    client: AuthClient,
    token: TokenResponse | None,
    method: str,
    path: str,
    *,
    json_body: dict[str, object] | None = None,
    allowed_statuses: frozenset[int] | None = None,
) -> httpx.Response:
    response = await client._client.request(
        method,
        path,
        headers=_auth_headers(token),
        json=json_body,
    )
    if allowed_statuses is not None and response.status_code in allowed_statuses:
        return response
    response.raise_for_status()
    return response


def _current_run_id(payload: dict[str, object]) -> str | None:
    links = payload.get("links")
    if not isinstance(links, dict):
        return None
    current = links.get("current")
    if not isinstance(current, dict):
        return None
    href = current.get("href")
    if not isinstance(href, str) or not href.startswith("/runs/"):
        return None
    return href.removeprefix("/runs/")


async def _get_protocol_run(
    client: AuthClient,
    token: TokenResponse | None,
    run_id: str,
) -> dict[str, object]:
    response = await _get_json(client, token, "GET", f"/runs/{run_id}")
    body = response.json()
    data = body.get("data")
    if not isinstance(data, dict):
        raise RuntimeError(f"Unexpected run payload for {run_id!r}")
    return data


async def _stop_protocol_run(
    client: AuthClient,
    token: TokenResponse | None,
    run_id: str,
) -> None:
    await _get_json(
        client,
        token,
        "POST",
        f"/runs/{run_id}/actions",
        json_body={"data": {"actionType": "stop"}},
    )


async def _delete_protocol_run(
    client: AuthClient,
    token: TokenResponse | None,
    run_id: str,
) -> None:
    await _get_json(client, token, "DELETE", f"/runs/{run_id}")


async def _wait_for_protocol_run_status(
    client: AuthClient,
    token: TokenResponse | None,
    run_id: str,
    *,
    acceptable_statuses: frozenset[str],
    timeout_s: float,
    poll_interval_s: float,
) -> str:
    deadline = asyncio.get_running_loop().time() + timeout_s
    last_status = "unknown"
    while asyncio.get_running_loop().time() < deadline:
        run = await _get_protocol_run(client, token, run_id)
        status = run.get("status")
        if isinstance(status, str):
            last_status = status
            if status in acceptable_statuses:
                return status
        await asyncio.sleep(poll_interval_s)
    raise TimeoutError(
        f"Run {run_id} did not reach {sorted(acceptable_statuses)} within {timeout_s}s (last status: {last_status})"
    )


async def _cancel_update_session(
    client: AuthClient,
    token: TokenResponse | None,
) -> CleanupAction:
    response = await client._client.post(
        "/server/update/cancel",
        headers=_auth_headers(token),
    )
    if response.status_code == 404:
        return CleanupAction("update session", "cancel", "unchanged")
    response.raise_for_status()
    return CleanupAction("update session", "cancel", "cancelled")


async def _restart_robot(
    client: AuthClient,
    token: TokenResponse | None,
) -> CleanupAction:
    response = await client._client.post(
        "/server/restart",
        headers=_auth_headers(token),
    )
    response.raise_for_status()
    body = response.json()
    message = body.get("message") if isinstance(body, dict) else None
    outcome = message if isinstance(message, str) else "restart requested"
    return CleanupAction("robot", "restart", outcome)


async def _cleanup_maintenance_run(
    client: AuthClient,
    token: TokenResponse | None,
) -> CleanupAction:
    response = await client._client.get(
        "/maintenance_runs/current_run",
        headers=_auth_headers(token),
    )
    if response.status_code == 404:
        return CleanupAction("maintenance run", "delete", "unchanged")
    response.raise_for_status()
    body = response.json()
    data = body.get("data")
    if not isinstance(data, dict):
        raise RuntimeError("Unexpected maintenance run payload")
    run_id = data.get("id")
    if not isinstance(run_id, str):
        raise RuntimeError("Maintenance run payload missing id")

    delete_response = await client._client.delete(
        f"/maintenance_runs/{run_id}",
        headers=_auth_headers(token),
    )
    delete_response.raise_for_status()
    return CleanupAction(f"maintenance run {run_id}", "delete", "deleted")


async def _cleanup_current_protocol_run(
    client: AuthClient,
    token: TokenResponse | None,
    *,
    delete_idle: bool,
    timeout_s: float,
    poll_interval_s: float,
) -> list[CleanupAction]:
    response = await _get_json(client, token, "GET", "/runs")
    payload = response.json()
    run_id = _current_run_id(payload)
    if run_id is None:
        return [CleanupAction("protocol run", "inspect", "unchanged")]

    run = await _get_protocol_run(client, token, run_id)
    status = run.get("status")
    if not isinstance(status, str):
        raise RuntimeError(f"Run {run_id} payload missing status")

    actions: list[CleanupAction] = []
    if status in ACTIVE_EXECUTION_STATUSES:
        await _stop_protocol_run(client, token, run_id)
        actions.append(CleanupAction(f"protocol run {run_id}", "stop", "requested"))
        final_status = await _wait_for_protocol_run_status(
            client,
            token,
            run_id,
            acceptable_statuses=TERMINAL_RUN_STATUSES,
            timeout_s=timeout_s,
            poll_interval_s=poll_interval_s,
        )
        actions.append(
            CleanupAction(
                f"protocol run {run_id}",
                "wait",
                f"reached {final_status}",
            )
        )
        status = final_status

    if delete_idle and status in DELETABLE_RUN_STATUSES:
        await _delete_protocol_run(client, token, run_id)
        actions.append(CleanupAction(f"protocol run {run_id}", "delete", "deleted"))
        return actions

    if not actions:
        actions.append(
            CleanupAction(
                f"protocol run {run_id}",
                "inspect",
                f"left in {status} state",
            )
        )
    return actions


async def cleanup_robot_runs(
    client: AuthClient,
    session: RobotControlSession,
    *,
    delete_idle: bool = True,
    cancel_update: bool = True,
    restart: bool = False,
    timeout_s: float = 30.0,
    poll_interval_s: float = 0.5,
) -> CleanupReport:
    """Ensure the robot has no active protocol or maintenance runs."""

    report = CleanupReport(auth_label=session.label)
    token = session.token

    if cancel_update:
        report.actions.append(await _cancel_update_session(client, token))

    report.actions.extend(
        await _cleanup_current_protocol_run(
            client,
            token,
            delete_idle=delete_idle,
            timeout_s=timeout_s,
            poll_interval_s=poll_interval_s,
        )
    )
    report.actions.append(await _cleanup_maintenance_run(client, token))

    if restart:
        report.actions.append(await _restart_robot(client, token))

    return report
