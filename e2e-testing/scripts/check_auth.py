#!/usr/bin/env python3
"""Run through auth-server calls used in ``automation/clients/auth.py``.

Teaching notes are in ``#`` comments below, not printed at runtime.

Usage:
    uv run python scripts/check_auth.py              # host from ROBOT_IP in .env
    uv run python scripts/check_auth.py localhost
    uv run python scripts/check_auth.py 10.0.0.42
"""

from __future__ import annotations

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

from automation.clients.auth import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    USER_PASSWORD,
    USER_USERNAME,
    AuthClient,
)

load_dotenv()

console = Console()

AUTH_SERVER_PORT = 33950

TEMP_USER_NAME = "_tutorial_temp_user"
TEMP_USER_PASSWORD = "TempP@ss1234!"
TEMP_USER_FULL_NAME = "tutorial temp user"


def resolve_host() -> str:
    if len(sys.argv) > 1:
        return sys.argv[1]
    env_host = os.environ.get("ROBOT_IP")
    if env_host:
        return env_host
    console.print(
        "[yellow]Pass a host or set ROBOT_IP.[/yellow]\n  Example: uv run python scripts/check_auth.py localhost"
    )
    raise SystemExit(1)


def _step(title: str, *parts: Any) -> None:
    """Print one numbered section inside a Rich panel."""
    content: Any = Group(*parts) if len(parts) > 1 else parts[0]
    console.print(Panel(content, title=title, border_style="cyan", padding=(0, 1)))


async def main() -> None:
    host = resolve_host()
    base_url = f"http://{host}:{AUTH_SERVER_PORT}".rstrip("/")

    # -------------------------------------------------------------------------
    # Before the walkthrough: confirm the auth-server is up by hitting
    # GET /auth/settings and validating the response (see AuthClient.is_alive).
    # -------------------------------------------------------------------------
    async with AuthClient(base_url=base_url) as client:
        # AuthClient(...) builds httpx.AsyncClient(base_url=...). Paths like
        # "/auth/settings" are relative to that base. Use async with to open the
        # pool; each request is await client.some_method().

        if not await client.is_alive():
            console.print(
                Panel(
                    f"[red]Auth server not reachable or GET /auth/settings did not return "
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

        # ---------------------------------------------------------------------
        # 1) Human-readable docs: open ReDoc in a browser. It is built from the
        # same description as GET /auth/openapi.json.
        # ---------------------------------------------------------------------
        redoc_url = f"{base_url}/auth/redoc"
        _step(
            "1. ReDoc",
            Text.from_markup(
                f"Open in a browser: [link={redoc_url}]{redoc_url}[/link]",
            ),
        )

        # ---------------------------------------------------------------------
        # 2) Machine-readable OpenAPI. Compare paths here to methods in
        # auth.py / models in auth_models/.
        # ---------------------------------------------------------------------
        spec = await client.get_openapi()
        _step(
            "2. OpenAPI (GET /auth/openapi.json)",
            f"title={spec.info.title!r} version={spec.info.version!r} paths={len(spec.paths)}",
        )

        # ---------------------------------------------------------------------
        # 3) GET /auth/settings returns {"data": {...}}. AuthClient validates
        # the envelope and returns auth_models.SettingsResponseData (dict, camelCase keys).
        # ---------------------------------------------------------------------
        settings = await client.get_settings()
        _step(
            "3. Settings (GET /auth/settings)",
            Text.from_markup("[bold]SettingsResponseData[/bold]"),
            Pretty(settings),
        )

        # ---------------------------------------------------------------------
        # 4) GET /auth/settings/accessControlEnabled is a smaller read for one
        # flag; returns auth_models.AccessControlResponseData via the same pattern.
        # ---------------------------------------------------------------------
        ac = await client.get_access_control_settings()
        _step(
            "4. Access control (GET /auth/settings/accessControlEnabled)",
            Pretty(ac),
        )

        # ---------------------------------------------------------------------
        # 5) POST /auth/oauth2/token with grant_type=password and form fields
        # (not JSON). get_token parses auth_models.TokenResponse.
        # ---------------------------------------------------------------------
        admin_token = await client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
        _step(
            "5. Password grant (POST /auth/oauth2/token)",
            f"type={admin_token.token_type!r} expires_in={admin_token.expires_in} "
            f"access_token~={admin_token.access_token[:24]}... "
            f"refresh_token={'yes' if admin_token.refresh_token else 'no'}",
        )

        # ---------------------------------------------------------------------
        # 6) POST /auth/oauth2/introspect (form: token, client_id). Produces
        # auth_models.TokenIntrospectionResponse (RFC 7662 style).
        # ---------------------------------------------------------------------
        intro = await client.introspect(admin_token.access_token)
        _step("6. Introspect (POST /auth/oauth2/introspect)", Pretty(intro))

        # ---------------------------------------------------------------------
        # 7) Same token URL with grant_type=refresh_token when a refresh_token
        # was returned from the password grant.
        # ---------------------------------------------------------------------
        if admin_token.refresh_token:
            refreshed = await client.refresh_token(admin_token.refresh_token)
            _step(
                "7. Refresh token (POST /auth/oauth2/token)",
                f"type={refreshed.token_type!r} expires_in={refreshed.expires_in} "
                f"access_token~={refreshed.access_token[:24]}...",
            )

        # ---------------------------------------------------------------------
        # 8) Optional scope: add scope= to the password grant form.
        # ---------------------------------------------------------------------
        scoped = await client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD, scope="users.read")
        _step(
            "8. Scoped password grant",
            f"scope={scoped.scope!r} access_token~={scoped.access_token[:24]}...",
        )

        # ---------------------------------------------------------------------
        # 9) /auth/users/* needs Authorization: Bearer <access_token>.
        # get_user validates {"data": user} into auth_models.UserResponse.
        # ---------------------------------------------------------------------
        user_lines: list[Pretty] = []
        for name in (ADMIN_USERNAME, USER_USERNAME):
            user = await client.get_user(admin_token, name)
            user_lines.append(Pretty(user))
        _step("9. GET /auth/users/{name}", Group(*user_lines))

        # ---------------------------------------------------------------------
        # 10) POST creates a user (JSON body {"data": {...}} with camelCase in
        # JSON). PATCH sends only fields you change. DELETE removes the user.
        # ---------------------------------------------------------------------
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

        updated = await client.update_user(
            admin_token,
            TEMP_USER_NAME,
            full_name="Updated display name",
            account_type="user",
        )

        await client.delete_user(admin_token, TEMP_USER_NAME)
        _step(
            "10. User create / PATCH / delete",
            Text.from_markup(f"Created [bold]{created.user_name}[/bold]"),
            Pretty(updated),
            f"Deleted {TEMP_USER_NAME}",
        )

        # ---------------------------------------------------------------------
        # 11) get_token_raw returns httpx.Response without raise_for_status.
        # Use this to teach or test error status codes and JSON error bodies.
        # ---------------------------------------------------------------------
        bad = await client.get_token_raw(
            grant_type="password",
            client_id=client.client_id,
            username=ADMIN_USERNAME,
            password="wrong_password_intentionally",
        )
        # Same expectations as auth-server integration (wrong password grant).
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

        # ---------------------------------------------------------------------
        # 12) asyncio.gather runs multiple awaits concurrently on one thread
        # while each client call waits on I/O.
        # ---------------------------------------------------------------------
        user_token = await client.get_token(USER_USERNAME, USER_PASSWORD)

        async def intro_label(token: str) -> str:
            p = await client.introspect(token)
            return "active" if p.active else "inactive"

        ia, ib, uu = await asyncio.gather(
            intro_label(admin_token.access_token),
            intro_label(user_token.access_token),
            client.get_user(admin_token, USER_USERNAME),
        )
        _step(
            "12. asyncio.gather (concurrent client calls)",
            f"admin token introspect: {ia!r}",
            f"user token introspect: {ib!r}",
            Pretty(uu),
        )


if __name__ == "__main__":
    asyncio.run(main())
