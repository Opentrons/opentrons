#!/usr/bin/env python3
"""Run through auth-server calls used in ``automation/clients/auth.py``.

Teaching notes are in ``#`` comments below, not printed at runtime.

Usage:
    uv run python scripts/check_auth.py 192.168.0.20
    ROBOT_IP=192.168.0.20 uv run python scripts/check_auth.py

Requires ``AUTH_USERNAME`` / ``AUTH_PASSWORD`` and robot CA trust in ``robot-certs/``.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from typing import Any

import httpx
from dotenv import load_dotenv
from rich.console import Console, Group
from rich.panel import Panel
from rich.pretty import Pretty
from rich.text import Text

from automation.auth_helpers import obtain_admin_session, resolve_admin_credentials
from automation.clients.auth import AuthClient
from automation.robot_certs.registry import RobotCertRegistryError

load_dotenv()

console = Console()

TEMP_USER_NAME = "_tutorial_temp_user"
TEMP_USER_PASSWORD = "TempP@ss1234!"
TEMP_USER_FULL_NAME = "tutorial temp user"


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Walk through AuthClient calls against a Flex robot.")
    parser.add_argument(
        "robot_ip",
        nargs="?",
        default=os.environ.get("ROBOT_IP"),
        help="Robot hostname or IP (default: ROBOT_IP from environment)",
    )
    return parser.parse_args(argv)


def _step(title: str, *parts: Any) -> None:
    """Print one numbered section inside a Rich panel."""
    content: Any = Group(*parts) if len(parts) > 1 else parts[0]
    console.print(Panel(content, title=title, border_style="cyan", padding=(0, 1)))


async def main(argv: list[str] | None = None) -> None:
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    if not args.robot_ip:
        console.print(
            "[yellow]Pass a robot IP or set ROBOT_IP.[/yellow]\n"
            "  Example: uv run python scripts/check_auth.py 192.168.0.20"
        )
        raise SystemExit(1)

    try:
        resolve_admin_credentials()
    except ValueError as err:
        console.print(f"[red]{err}[/red]")
        raise SystemExit(1) from err

    try:
        client = AuthClient(args.robot_ip)
    except RobotCertRegistryError as err:
        console.print(Panel(f"[red]{err}[/red]", title="HTTPS setup failed", border_style="red"))
        raise SystemExit(1) from err

    base_url = client.base_url

    async with client:
        if not await client.is_alive():
            console.print(
                Panel(
                    f"[red]Robot auth-server not reachable or GET /auth/settings did not return "
                    f"a valid settings body.[/red]\n[dim]{base_url}/auth/settings[/dim]",
                    title="0. Auth server (GET /auth/settings)",
                    border_style="red",
                    padding=(0, 1),
                )
            )
            raise SystemExit(1)

        _step(
            "0. Auth server (GET /auth/settings)",
            Text.from_markup(
                f"[green]is_alive[/green]: validated [bold]SettingsResponseData[/bold] "
                f"from [dim]{base_url}/auth/settings[/dim]"
            ),
        )

        redoc_url = f"{base_url}/auth/redoc"
        _step(
            "1. ReDoc",
            Text.from_markup(f"Open in a browser: [link={redoc_url}]{redoc_url}[/link]"),
        )

        spec = await client.get_openapi()
        _step(
            "2. OpenAPI (GET /auth/openapi.json)",
            f"title={spec.info.title!r} version={spec.info.version!r} paths={len(spec.paths)}",
        )

        settings = await client.get_settings()
        _step(
            "3. Settings (GET /auth/settings)",
            Text.from_markup("[bold]SettingsResponseData[/bold]"),
            Pretty(settings),
        )

        ac = await client.get_access_control_settings()
        _step(
            "4. Access control (GET /auth/settings/accessControlEnabled)",
            Pretty(ac),
        )

        admin = await obtain_admin_session(client)
        admin_token = admin.token
        _step(
            "5. Password grant (POST /auth/oauth2/token)",
            f"username={admin.username!r} type={admin_token.token_type!r} expires_in={admin_token.expires_in} "
            f"access_token~={admin_token.access_token[:24]}... "
            f"refresh_token={'yes' if admin_token.refresh_token else 'no'}",
        )

        intro = await client.introspect(admin_token.access_token)
        _step("6. Introspect (POST /auth/oauth2/introspect)", Pretty(intro))

        if admin_token.refresh_token:
            refreshed = await client.refresh_token(admin_token.refresh_token)
            _step(
                "7. Refresh token (POST /auth/oauth2/token)",
                f"type={refreshed.token_type!r} expires_in={refreshed.expires_in} "
                f"access_token~={refreshed.access_token[:24]}...",
            )

        scoped = await client.get_token(admin.username, admin.password, scope="users.read")
        _step(
            "8. Scoped password grant",
            f"scope={scoped.scope!r} access_token~={scoped.access_token[:24]}...",
        )

        try:
            await client.delete_user(admin_token, TEMP_USER_NAME)
        except httpx.HTTPStatusError:
            pass

        created = await client.create_user(
            admin_token,
            user_name=TEMP_USER_NAME,
            password=TEMP_USER_PASSWORD,
            full_name=TEMP_USER_FULL_NAME,
            account_type="auditor",
        )

        user_lines: list[Pretty] = [Pretty(await client.get_user(admin_token, admin.username))]
        user_lines.append(Pretty(await client.get_user(admin_token, TEMP_USER_NAME)))
        _step("9. GET /auth/users/byUsername/{name}", Group(*user_lines))

        updated = await client.update_user(
            admin_token,
            TEMP_USER_NAME,
            full_name="Updated display name",
            account_type="user",
        )
        _step(
            "10. User create / PATCH",
            Text.from_markup(f"Created [bold]{created.user_name}[/bold]"),
            Pretty(updated),
        )

        bad = await client.get_token_raw(
            grant_type="password",
            client_id=client.client_id,
            username=admin.username,
            password="wrong_password_intentionally",
        )
        assert bad.status_code == 400, f"expected HTTP 400, got {bad.status_code}: {bad.text!r}"
        err_body = bad.json()
        assert err_body.get("error") == "invalid_grant", err_body
        err_msg = err_body.get("error_description")
        assert isinstance(err_msg, str) and err_msg.strip(), err_body
        body_text = json.dumps(err_body, indent=2)[:400]
        _step(
            "11. Raw token response (wrong password)",
            f"HTTP {bad.status_code}",
            body_text,
        )

        user_token = await client.get_token(TEMP_USER_NAME, TEMP_USER_PASSWORD)

        async def intro_label(token: str) -> str:
            p = await client.introspect(token)
            return "active" if p.active else "inactive"

        ia, ib, uu = await asyncio.gather(
            intro_label(admin_token.access_token),
            intro_label(user_token.access_token),
            client.get_user(admin_token, TEMP_USER_NAME),
        )
        _step(
            "12. asyncio.gather (concurrent client calls)",
            f"admin token introspect: {ia!r}",
            f"temp user token introspect: {ib!r}",
            Pretty(uu),
        )

        await client.delete_user(admin_token, TEMP_USER_NAME)
        _step("13. Delete temp user", f"Deleted {TEMP_USER_NAME}")


if __name__ == "__main__":
    asyncio.run(main())
