#!/usr/bin/env python3
"""Read-only auth-server inspection for a Flex robot over HTTPS.

Usage:
    make inspect-robot-auth ROBOT_IP=192.168.0.20
    uv run python scripts/inspect_robot_auth.py 192.168.0.20

Optional credentials (protected reads: self, other users, introspection):
    uv run python scripts/inspect_robot_auth.py 192.168.0.20 --username admin --password secret
    uv run python scripts/inspect_robot_auth.py 192.168.0.20 --user operator1 --user auditor2

Requires robot CA trust in ``robot-certs/`` (run ``make verify-robot-encryption`` first).
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from dataclasses import dataclass
from typing import Any

import httpx
from dotenv import load_dotenv
from pydantic import ValidationError
from rich.console import Console, Group
from rich.panel import Panel
from rich.pretty import Pretty
from rich.table import Table
from rich.text import Text

from automation.clients.auth import AuthClient
from automation.robot_certs.registry import RobotCertRegistryError

load_dotenv()

console = Console()


@dataclass(frozen=True, slots=True)
class ProbeResult:
    ok: bool
    label: str
    detail: str
    response: httpx.Response | None = None


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inspect auth-server state on a robot (read-only).",
    )
    parser.add_argument(
        "robot_ip",
        help="Robot hostname or IP",
    )
    parser.add_argument(
        "--username",
        default=os.environ.get("AUTH_USERNAME"),
        help="Account for ROPC login (or AUTH_USERNAME)",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("AUTH_PASSWORD"),
        help="Password for ROPC login (or AUTH_PASSWORD)",
    )
    parser.add_argument(
        "--user",
        action="append",
        dest="usernames",
        default=[],
        metavar="USERNAME",
        help="Also GET /auth/users/byUsername/USERNAME (repeatable)",
    )
    return parser.parse_args(argv)


def _panel(title: str, *parts: Any) -> None:
    content: Any = Group(*parts) if len(parts) > 1 else parts[0]
    console.print(Panel(content, title=title, border_style="cyan", padding=(0, 1)))


def _http_error_panel(title: str, err: httpx.HTTPStatusError) -> None:
    body = err.response.text[:500] if err.response is not None else ""
    _panel(
        title,
        Text.from_markup(f"[red]HTTP {err.response.status_code}[/red] {err.request.method} {err.request.url}"),
        body or "(empty body)",
    )


def _probe_result_panel(title: str, probe: ProbeResult) -> None:
    style = "green" if probe.ok else "red"
    _panel(
        title,
        Text.from_markup(f"[{style}]{probe.label}[/{style}]"),
        probe.detail,
    )


async def _probe_auth_alive(client: AuthClient, auth_base: str) -> ProbeResult:
    try:
        await client.get_settings()
    except httpx.ConnectError as err:
        return ProbeResult(
            ok=False,
            label="connection failed",
            detail=(
                f"Could not connect to {auth_base}/auth/settings over HTTPS. "
                f"Run make verify-robot-encryption ROBOT_IP={auth_base.split('://')[1].split(':')[0]} first. ({err})"
            ),
        )
    except httpx.TimeoutException:
        return ProbeResult(
            ok=False,
            label="timeout",
            detail=f"Timed out waiting for {auth_base}/auth/settings",
        )
    except httpx.RequestError as err:
        return ProbeResult(
            ok=False,
            label="request error",
            detail=f"{auth_base}/auth/settings: {err}",
        )
    except (ValidationError, json.JSONDecodeError) as err:
        return ProbeResult(
            ok=False,
            label="invalid response",
            detail=f"{auth_base}/auth/settings: {err}",
        )
    except httpx.HTTPStatusError as err:
        body = err.response.text[:500] if err.response is not None else ""
        return ProbeResult(
            ok=False,
            label=f"HTTP {err.response.status_code}",
            detail=body or "(empty body)",
            response=err.response,
        )

    return ProbeResult(
        ok=True,
        label="OK",
        detail=f"GET /auth/settings returned valid settings envelope from {auth_base}",
    )


async def _inspect_public(
    client: AuthClient,
    auth_base: str,
) -> tuple[bool, dict[str, Any]]:
    summary: dict[str, Any] = {"auth_base": auth_base}

    probe = await _probe_auth_alive(client, auth_base)
    _probe_result_panel("Reachability (GET /auth/settings)", probe)
    if not probe.ok:
        return False, summary

    settings = await client.get_settings()
    _panel("Auth settings (GET /auth/settings)", Pretty(settings))
    summary["settings"] = settings

    ac = await client.get_access_control_settings()
    _panel("Access control (GET /auth/settings/accessControlEnabled)", Pretty(ac))
    summary["access_control_enabled"] = ac.access_control_enabled

    spec = await client.get_openapi()
    path_methods: list[str] = []
    for path, path_item in sorted(spec.paths.items()):
        if not isinstance(path_item, dict):
            continue
        for method in sorted(path_item.keys()):
            if method in {"get", "post", "patch", "put", "delete"}:
                path_methods.append(f"{method.upper():6} {path}")

    table = Table(show_header=True, header_style="bold")
    table.add_column("Method")
    table.add_column("Path")
    for line in path_methods:
        method, path = line.split(maxsplit=1)
        table.add_row(method, path)

    _panel(
        "OpenAPI (GET /auth/openapi.json)",
        Text(f"{spec.info.title} {spec.info.version} ({len(spec.paths)} paths)"),
        table,
        Text.from_markup(f"ReDoc: [link={auth_base}/auth/redoc]{auth_base}/auth/redoc[/link]"),
    )
    summary["openapi_version"] = spec.info.version

    return ac.access_control_enabled, summary


async def _inspect_authenticated(
    client: AuthClient,
    *,
    username: str,
    password: str,
    usernames: list[str],
) -> None:
    try:
        token = await client.get_token(username, password)
    except httpx.HTTPStatusError as err:
        _http_error_panel("Login (POST /auth/oauth2/token)", err)
        return

    _panel(
        "Login (POST /auth/oauth2/token)",
        Text(f"username={username!r}"),
        Text(f"token_type={token.token_type!r} expires_in={token.expires_in}s"),
        Text(f"scope={token.scope!r}"),
        Text(f"access_token~={token.access_token[:24]}..."),
    )

    try:
        intro = await client.introspect(token.access_token)
        _panel("Token introspection (POST /auth/oauth2/introspect)", Pretty(intro))
    except httpx.HTTPStatusError as err:
        _http_error_panel("Token introspection (POST /auth/oauth2/introspect)", err)

    try:
        self_user = await client.get_self(token)
        _panel("Current user (GET /auth/users/self)", Pretty(self_user))
    except httpx.HTTPStatusError as err:
        _http_error_panel("Current user (GET /auth/users/self)", err)

    for name in usernames:
        try:
            user = await client.get_user(token, name)
            _panel(f"User {name!r} (GET /auth/users/byUsername/{{username}})", Pretty(user))
        except httpx.HTTPStatusError as err:
            _http_error_panel(f"User {name!r} (GET /auth/users/byUsername/{{username}})", err)


def _print_summary(access_control_enabled: bool, summary: dict[str, Any]) -> None:
    settings = summary.get("settings") or {}
    lines = [
        f"Auth-server: {summary.get('auth_base', '?')}",
        f"Access control: {'ON' if access_control_enabled else 'OFF'}",
        f"Idle logout (s): {settings.get('idleLogout', '?')}",
        f"Max login attempts: {settings.get('maxNumberOfLoginAttempts', '?')}",
        f"Require admin for protocol send: {settings.get('requireAdminCredsWhenSendingProtocolToRobot', '?')}",
        f"Require admin for software update: {settings.get('requireAdminCredsWhenUpdatingRobotSoftware', '?')}",
    ]
    if summary.get("openapi_version"):
        lines.append(f"OpenAPI version: {summary['openapi_version']}")
    _panel("Summary", Text("\n".join(lines)))


async def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv if argv is not None else sys.argv[1:])

    try:
        client = AuthClient(args.robot_ip)
    except RobotCertRegistryError as err:
        console.print(
            Panel(
                Text(f"[red]{err}[/red]"),
                title="HTTPS setup failed",
                border_style="red",
            )
        )
        return 1

    auth_base = client.base_url

    console.print(
        Panel(
            Text.from_markup(f"Inspecting auth-server at [bold]{auth_base}[/bold] (HTTPS, read-only)"),
            border_style="blue",
        )
    )

    has_creds = bool(args.username and args.password)
    if args.username and not args.password:
        console.print("[yellow]--username without --password; skipping login.[/yellow]")
    elif args.password and not args.username:
        console.print("[yellow]--password without --username; skipping login.[/yellow]")
    elif args.usernames and not has_creds:
        console.print("[yellow]--user requires --username and --password (or AUTH_USERNAME / AUTH_PASSWORD).[/yellow]")

    async with client:
        try:
            ac_enabled, summary = await _inspect_public(client, auth_base)
        except (httpx.HTTPStatusError, httpx.RequestError, ValidationError, json.JSONDecodeError) as err:
            _panel("Auth inspection failed", Text(f"[red]{type(err).__name__}[/red]: {err}"))
            return 1

        if "settings" not in summary:
            return 1

        if has_creds:
            await _inspect_authenticated(
                client,
                username=args.username,
                password=args.password,
                usernames=args.usernames,
            )
        elif ac_enabled:
            console.print(
                "[dim]Access control is ON. Pass --username/--password for user and introspection reads.[/dim]"
            )

        _print_summary(ac_enabled, summary)

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
