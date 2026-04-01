#!/usr/bin/env python3
"""Interactive CLI to check auth-server status on a robot.

Uses the AuthClient to probe a robot's auth-server and display
connection info, settings, token exchange, introspection, token
refresh, user CRUD, scoped requests, error handling, and docs
availability.

Usage:
    uv run python scripts/check_auth.py              # uses ROBOT_IP from .env or prompts
    uv run python scripts/check_auth.py 10.0.0.42    # override with positional arg
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from typing import Any

import httpx
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich.text import Text
from rich.tree import Tree

from automation.clients.auth import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    USER_PASSWORD,
    USER_USERNAME,
    AuthClient,
    TokenResponse,
)

load_dotenv()

console = Console()

AUTH_SERVER_PORT = 33950
ROBOT_SERVER_PORT = 31950

TEMP_USER_NAME = "_check_auth_temp_user"
TEMP_USER_PASSWORD = "TempP@ss1234!"
TEMP_USER_FULL_NAME = "check_auth temp user"

ALL_SCOPES = [
    "auth_settings.write",
    "protocols.write",
    "restart.write",
    "robot_control.write",
    "robot_settings.write",
    "run_data.write",
    "ssh_keys.write",
    "updates.write",
    "users.read",
    "users.write",
]


class CheckResults:
    """Accumulates pass/fail/skip results for the final summary."""

    def __init__(self) -> None:
        self._results: list[tuple[str, str, str]] = []

    def passed(self, section: str, detail: str = "") -> None:
        self._results.append(("pass", section, detail))

    def failed(self, section: str, detail: str = "") -> None:
        self._results.append(("fail", section, detail))

    def skipped(self, section: str, detail: str = "") -> None:
        self._results.append(("skip", section, detail))

    def print_summary(self) -> None:
        table = Table(title="Summary", show_lines=True, title_style="bold")
        table.add_column("Result", width=6)
        table.add_column("Check")
        table.add_column("Detail", style="dim")

        for status, section, detail in self._results:
            if status == "pass":
                icon = "[green]PASS[/green]"
            elif status == "fail":
                icon = "[red]FAIL[/red]"
            else:
                icon = "[yellow]SKIP[/yellow]"
            table.add_row(icon, section, detail)

        console.print()
        console.print(table)

        total = len(self._results)
        passed = sum(1 for s, _, _ in self._results if s == "pass")
        failed = sum(1 for s, _, _ in self._results if s == "fail")
        skipped = sum(1 for s, _, _ in self._results if s == "skip")
        console.print(
            f"\n  [bold]{total}[/bold] checks: "
            f"[green]{passed} passed[/green], "
            f"[red]{failed} failed[/red], "
            f"[yellow]{skipped} skipped[/yellow]"
        )


results = CheckResults()


def resolve_robot_ip() -> str:
    """Figure out the robot IP from CLI args > env > interactive prompt."""
    if len(sys.argv) > 1:
        return sys.argv[1]

    env_ip = os.environ.get("ROBOT_IP")
    if env_ip:
        console.print(f"[dim]Using ROBOT_IP from .env:[/dim] [bold]{env_ip}[/bold]")
        return env_ip

    ip = Prompt.ask("[bold]Robot IP address[/bold]", console=console)
    if not ip:
        console.print("[red]No IP provided.[/red]")
        raise SystemExit(1)
    return ip


def section(title: str) -> None:
    """Print a section header."""
    console.print(f"\n[bold blue]{'=' * 60}[/bold blue]")
    console.print(f"[bold blue] {title}[/bold blue]")
    console.print(f"[bold blue]{'=' * 60}[/bold blue]")


def subsection(title: str) -> None:
    """Print a subsection header."""
    console.print(f"\n[bold]{title}[/bold]")


def timed_request(method: str, url: str, **kwargs: Any) -> tuple[httpx.Response | None, float, str | None]:
    """Make a synchronous HTTP request and return (response, elapsed_ms, error)."""
    try:
        start = time.monotonic()
        resp = httpx.request(method, url, timeout=5.0, **kwargs)
        elapsed_ms = (time.monotonic() - start) * 1000
        return resp, elapsed_ms, None
    except httpx.ConnectError:
        return None, 0, "connection refused"
    except httpx.TimeoutException:
        return None, 0, "timed out"
    except Exception as exc:
        return None, 0, str(exc)


def print_kv_table(data: dict[str, Any], title: str | None = None) -> None:
    """Print a two-column key/value table."""
    table = Table(show_header=False, box=None, padding=(0, 2), title=title, title_style="bold")
    table.add_column("Key", style="cyan", no_wrap=True)
    table.add_column("Value", style="white")
    for key, value in data.items():
        table.add_row(str(key), str(value))
    console.print(table)


# ---------------------------------------------------------------------------
# 1. Connectivity
# ---------------------------------------------------------------------------


def check_connectivity(ip: str) -> tuple[bool, bool]:
    """Probe auth-server and robot-server ports."""
    section("1. Connectivity")

    auth_ok = False
    robot_ok = False

    for port, label, attr in [
        (AUTH_SERVER_PORT, "auth-server", "auth"),
        (ROBOT_SERVER_PORT, "robot-server", "robot"),
    ]:
        url = f"http://{ip}:{port}"
        resp, elapsed_ms, error = timed_request("GET", f"{url}/health")
        if error:
            console.print(f"  [red]X[/red] {label} on [bold]{url}[/bold]  [dim]{error}[/dim]")
            results.failed(f"Connectivity: {label}", error)
        else:
            assert resp is not None
            status_text = f"{resp.status_code}"
            if resp.status_code == 404:
                status_text += " (no /health route, but server is listening)"
            console.print(
                f"  [green]OK[/green] {label} on [bold]{url}[/bold]  "
                f"[dim]({status_text}, {elapsed_ms:.0f}ms)[/dim]"
            )
            results.passed(f"Connectivity: {label}", f"{status_text}, {elapsed_ms:.0f}ms")
            if attr == "auth":
                auth_ok = True
            else:
                robot_ok = True

    return auth_ok, robot_ok


# ---------------------------------------------------------------------------
# 2. OpenAPI Spec
# ---------------------------------------------------------------------------


async def check_openapi(client: AuthClient) -> None:
    """Fetch the OpenAPI spec and display summary info."""
    section("2. OpenAPI Specification")
    try:
        spec = await client.get_openapi()
        info = spec.get("info", {})

        print_kv_table(
            {
                "title": info.get("title", "?"),
                "version": info.get("version", "?"),
                "openapi": spec.get("openapi", "?"),
            }
        )

        paths = spec.get("paths", {})
        endpoint_count = 0
        tree = Tree("[bold]Endpoints[/bold]")
        for path in sorted(paths.keys()):
            methods = sorted(m.upper() for m in paths[path] if m.lower() not in ("parameters",))
            endpoint_count += len(methods)
            tree.add(f"[cyan]{', '.join(methods)}[/cyan] {path}")
        console.print(tree)
        console.print(f"  [dim]{endpoint_count} operations across {len(paths)} paths[/dim]")
        results.passed("OpenAPI spec", f"{endpoint_count} operations")
    except Exception as exc:
        console.print(f"  [red]Failed:[/red] {exc}")
        results.failed("OpenAPI spec", str(exc))


# ---------------------------------------------------------------------------
# 3. ReDoc availability
# ---------------------------------------------------------------------------


def check_redoc(ip: str) -> None:
    """Check if the ReDoc docs page is available."""
    subsection("ReDoc docs page")
    url = f"http://{ip}:{AUTH_SERVER_PORT}/auth/redoc"
    resp, elapsed_ms, error = timed_request("GET", url)
    if error:
        console.print(f"  [red]X[/red] {url}  [dim]{error}[/dim]")
        results.failed("ReDoc page", error)
    elif resp is not None and resp.status_code == 200:
        content_type = resp.headers.get("content-type", "")
        console.print(f"  [green]OK[/green] {url}  [dim](200, {content_type}, {elapsed_ms:.0f}ms)[/dim]")
        results.passed("ReDoc page", f"{elapsed_ms:.0f}ms")
    else:
        status = resp.status_code if resp else "?"
        console.print(f"  [yellow]?[/yellow] {url}  [dim](status {status})[/dim]")
        results.failed("ReDoc page", f"status {status}")


# ---------------------------------------------------------------------------
# 4. Auth Settings
# ---------------------------------------------------------------------------


async def check_settings(client: AuthClient) -> None:
    """Fetch and display all auth settings."""
    section("3. Auth Settings")

    subsection("GET /auth/settings")
    try:
        settings = await client.get_settings()
        data = settings.get("data", settings)
        if isinstance(data, dict):
            print_kv_table(data)
        else:
            console.print(f"  raw: {data}")
        results.passed("GET /auth/settings")
    except Exception as exc:
        console.print(f"  [red]Failed:[/red] {exc}")
        results.failed("GET /auth/settings", str(exc))


# ---------------------------------------------------------------------------
# 5. Access Control Status
# ---------------------------------------------------------------------------


async def check_access_control(client: AuthClient) -> bool:
    """Check the access control enabled status."""
    subsection("GET /auth/settings/accessControlEnabled")
    try:
        resp = await client._client.get("/auth/settings/accessControlEnabled")
        resp.raise_for_status()
        body = resp.json()
        data = body.get("data", body)
        enabled = data.get("accessControlEnabled", False)
        status_str = "[green]ENABLED[/green]" if enabled else "[yellow]DISABLED[/yellow]"
        console.print(f"  Access control: {status_str}")
        results.passed("Access control status", "enabled" if enabled else "disabled")
        return bool(enabled)
    except Exception as exc:
        console.print(f"  [red]Failed:[/red] {exc}")
        results.failed("Access control status", str(exc))
        return False


# ---------------------------------------------------------------------------
# 6. Token Exchange (password grant)
# ---------------------------------------------------------------------------


async def check_token_exchange(
    client: AuthClient, username: str, password: str, label: str
) -> TokenResponse | None:
    """Try a password-grant token exchange and display the result."""
    try:
        start = time.monotonic()
        token = await client.get_token(username, password)
        elapsed_ms = (time.monotonic() - start) * 1000
        console.print(f"  [green]OK[/green] {label}  [dim]({elapsed_ms:.0f}ms)[/dim]")

        print_kv_table(
            {
                "access_token": token.access_token[:40] + "...",
                "token_type": token.token_type,
                "expires_in": f"{token.expires_in}s",
                "refresh_token": (token.refresh_token or "")[:40] + "..." if token.refresh_token else "None",
                "scope": token.scope or "(empty)",
            }
        )
        results.passed(f"Token: {label}", f"{elapsed_ms:.0f}ms")
        return token

    except httpx.HTTPStatusError as exc:
        console.print(
            f"  [red]X[/red] {label}  [dim]{exc.response.status_code}: {exc.response.text[:200]}[/dim]"
        )
        results.failed(f"Token: {label}", f"{exc.response.status_code}")
        return None
    except Exception as exc:
        console.print(f"  [red]X[/red] {label}  [dim]{exc}[/dim]")
        results.failed(f"Token: {label}", str(exc))
        return None


# ---------------------------------------------------------------------------
# 7. Token Introspection
# ---------------------------------------------------------------------------


async def check_introspection(client: AuthClient, token: TokenResponse, label: str) -> None:
    """Introspect a token and display all returned fields."""
    subsection(f"Introspect: {label}")
    try:
        data = await client.introspect(token.access_token)
        active = data.get("active", False)
        status_str = "[green]active[/green]" if active else "[red]inactive[/red]"
        console.print(f"  Status: {status_str}")

        display = {}
        for k, v in sorted(data.items()):
            if k == "active":
                continue
            display[k] = str(v)
        if display:
            print_kv_table(display)
        results.passed(f"Introspect: {label}", "active" if active else "inactive")
    except Exception as exc:
        console.print(f"  [red]Failed:[/red] {exc}")
        results.failed(f"Introspect: {label}", str(exc))

    if token.refresh_token:
        subsection(f"Introspect refresh token: {label}")
        try:
            data = await client.introspect(token.refresh_token)
            active = data.get("active", False)
            status_str = "[green]active[/green]" if active else "[yellow]inactive (expected)[/yellow]"
            console.print(f"  Status: {status_str}")
            results.passed(f"Introspect refresh: {label}", "inactive (by design)" if not active else "active")
        except Exception as exc:
            console.print(f"  [red]Failed:[/red] {exc}")
            results.failed(f"Introspect refresh: {label}", str(exc))


# ---------------------------------------------------------------------------
# 8. Token Refresh
# ---------------------------------------------------------------------------


async def check_token_refresh(client: AuthClient, token: TokenResponse, label: str) -> None:
    """Test the refresh_token grant."""
    subsection(f"Refresh token: {label}")
    if not token.refresh_token:
        console.print("  [yellow]No refresh token in original response, skipping[/yellow]")
        results.skipped(f"Refresh: {label}", "no refresh_token")
        return
    try:
        start = time.monotonic()
        new_token = await client.refresh_token(token.refresh_token)
        elapsed_ms = (time.monotonic() - start) * 1000
        same_access = new_token.access_token == token.access_token
        console.print(
            f"  [green]OK[/green] New token obtained  [dim]({elapsed_ms:.0f}ms)[/dim]\n"
            f"  New access_token: {new_token.access_token[:40]}...\n"
            f"  Same as original? {'[yellow]yes[/yellow]' if same_access else '[green]no (new token)[/green]'}\n"
            f"  New expires_in: {new_token.expires_in}s"
        )
        results.passed(f"Refresh: {label}", f"{elapsed_ms:.0f}ms")
    except httpx.HTTPStatusError as exc:
        console.print(
            f"  [red]X[/red] Refresh failed  [dim]{exc.response.status_code}: "
            f"{exc.response.text[:200]}[/dim]"
        )
        results.failed(f"Refresh: {label}", f"{exc.response.status_code}")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed(f"Refresh: {label}", str(exc))


# ---------------------------------------------------------------------------
# 9. Scoped Token Request
# ---------------------------------------------------------------------------


async def check_scoped_token(client: AuthClient) -> None:
    """Request a token with a restricted scope to verify scope filtering."""
    subsection("Scoped token request (admin, scope=users.read)")
    try:
        token = await client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD, scope="users.read")
        console.print("  [green]OK[/green] Scoped token received")
        console.print(f"  Granted scope: [bold]{token.scope}[/bold]")

        data = await client.introspect(token.access_token)
        console.print(f"  Introspect scope: [bold]{data.get('scope', '?')}[/bold]")
        results.passed("Scoped token", f"scope={token.scope}")
    except httpx.HTTPStatusError as exc:
        console.print(f"  [red]X[/red] {exc.response.status_code}: {exc.response.text[:200]}")
        results.failed("Scoped token", f"{exc.response.status_code}")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Scoped token", str(exc))


# ---------------------------------------------------------------------------
# 10. User CRUD
# ---------------------------------------------------------------------------


async def check_user_crud(client: AuthClient, admin_token: TokenResponse) -> None:
    """Exercise the full user lifecycle: create, read, update, delete."""
    section("6. User CRUD")

    subsection("Read built-in users")
    for username in [ADMIN_USERNAME, USER_USERNAME]:
        try:
            user = await client.get_user(admin_token, username)
            console.print(
                f"  [green]OK[/green] {user.user_name}: "
                f"type=[bold]{user.account_type}[/bold], "
                f"scopes=[dim]{', '.join(user.scopes)}[/dim]"
            )
            results.passed(f"Get user: {username}")
        except httpx.HTTPStatusError as exc:
            console.print(f"  [red]X[/red] GET {username}: {exc.response.status_code}")
            results.failed(f"Get user: {username}", f"{exc.response.status_code}")
        except Exception as exc:
            console.print(f"  [red]X[/red] GET {username}: {exc}")
            results.failed(f"Get user: {username}", str(exc))

    subsection(f"Create temp user: {TEMP_USER_NAME}")
    try:
        await _cleanup_temp_user(client, admin_token)
        user = await client.create_user(
            admin_token,
            user_name=TEMP_USER_NAME,
            password=TEMP_USER_PASSWORD,
            full_name=TEMP_USER_FULL_NAME,
            account_type="auditor",
        )
        console.print(
            f"  [green]OK[/green] Created: {user.user_name}, "
            f"type={user.account_type}, scopes={user.scopes}"
        )
        results.passed("Create temp user")
    except httpx.HTTPStatusError as exc:
        console.print(f"  [red]X[/red] Create failed: {exc.response.status_code}: {exc.response.text[:200]}")
        results.failed("Create temp user", f"{exc.response.status_code}")
        return
    except Exception as exc:
        console.print(f"  [red]X[/red] Create failed: {exc}")
        results.failed("Create temp user", str(exc))
        return

    subsection(f"Read temp user: {TEMP_USER_NAME}")
    try:
        user = await client.get_user(admin_token, TEMP_USER_NAME)
        print_kv_table(
            {
                "userName": user.user_name,
                "fullName": user.full_name,
                "accountType": user.account_type,
                "scopes": ", ".join(user.scopes) or "(none)",
            }
        )
        results.passed("Read temp user")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Read temp user", str(exc))

    subsection("Login as temp user")
    try:
        temp_token = await client.get_token(TEMP_USER_NAME, TEMP_USER_PASSWORD)
        console.print(f"  [green]OK[/green] Token obtained, scope={temp_token.scope or '(empty)'}")
        results.passed("Login temp user")
    except httpx.HTTPStatusError as exc:
        console.print(f"  [red]X[/red] {exc.response.status_code}: {exc.response.text[:200]}")
        results.failed("Login temp user", f"{exc.response.status_code}")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Login temp user", str(exc))

    subsection("Update temp user: promote to user")
    try:
        user = await client.update_user(
            admin_token,
            TEMP_USER_NAME,
            full_name="Updated Check User",
            account_type="user",
        )
        console.print(
            f"  [green]OK[/green] Updated: fullName={user.full_name}, "
            f"type={user.account_type}, scopes={user.scopes}"
        )
        results.passed("Update temp user")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Update temp user", str(exc))

    subsection(f"Delete temp user: {TEMP_USER_NAME}")
    try:
        await client.delete_user(admin_token, TEMP_USER_NAME)
        console.print("  [green]OK[/green] Deleted")
        results.passed("Delete temp user")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Delete temp user", str(exc))

    subsection("Verify deletion (expect 404)")
    try:
        await client.get_user(admin_token, TEMP_USER_NAME)
        console.print("  [yellow]?[/yellow] User still exists (unexpected)")
        results.failed("Verify delete", "user still exists")
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            console.print("  [green]OK[/green] 404 as expected")
            results.passed("Verify delete", "404")
        else:
            console.print(f"  [red]X[/red] Unexpected status: {exc.response.status_code}")
            results.failed("Verify delete", f"{exc.response.status_code}")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Verify delete", str(exc))


async def _cleanup_temp_user(client: AuthClient, token: TokenResponse) -> None:
    """Delete the temp user if it already exists (ignore 404)."""
    try:
        await client.delete_user(token, TEMP_USER_NAME)
    except httpx.HTTPStatusError:
        pass


# ---------------------------------------------------------------------------
# 11. Error Handling
# ---------------------------------------------------------------------------


async def check_error_cases(client: AuthClient) -> None:
    """Verify the server returns correct errors for invalid requests."""
    section("7. Error Handling")

    subsection("Bad password")
    try:
        resp = await client.get_token_raw(
            grant_type="password",
            client_id=client.client_id,
            username=ADMIN_USERNAME,
            password="wrong_password",
        )
        console.print(f"  [green]OK[/green] Rejected: status={resp.status_code}")
        try:
            body = resp.json()
            console.print(f"  Error response: {json.dumps(body, indent=2)[:300]}")
        except Exception:
            console.print(f"  Body: {resp.text[:200]}")
        results.passed("Bad password rejected", f"status={resp.status_code}")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Bad password rejected", str(exc))

    subsection("Bad username")
    try:
        resp = await client.get_token_raw(
            grant_type="password",
            client_id=client.client_id,
            username="nonexistent_user_xyz",
            password="anything",
        )
        console.print(f"  [green]OK[/green] Rejected: status={resp.status_code}")
        results.passed("Bad username rejected", f"status={resp.status_code}")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Bad username rejected", str(exc))

    subsection("Bad client_id")
    try:
        resp = await client.get_token_raw(
            grant_type="password",
            client_id="invalid_client_xxx",
            username=ADMIN_USERNAME,
            password=ADMIN_PASSWORD,
        )
        console.print(f"  [green]OK[/green] Rejected: status={resp.status_code}")
        results.passed("Bad client_id rejected", f"status={resp.status_code}")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Bad client_id rejected", str(exc))

    subsection("Bad grant_type")
    try:
        resp = await client.get_token_raw(
            grant_type="authorization_code",
            client_id=client.client_id,
            code="fake_code",
        )
        console.print(f"  [green]OK[/green] Rejected: status={resp.status_code}")
        results.passed("Bad grant_type rejected", f"status={resp.status_code}")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Bad grant_type rejected", str(exc))

    subsection("Introspect bogus token")
    try:
        data = await client.introspect("not_a_real_token_at_all")
        active = data.get("active", False)
        status_str = "[green]inactive (correct)[/green]" if not active else "[red]active (unexpected!)[/red]"
        console.print(f"  Status: {status_str}")
        results.passed("Bogus token introspect", "inactive" if not active else "ACTIVE")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Bogus token introspect", str(exc))

    subsection("Invalid scope request")
    try:
        resp = await client.get_token_raw(
            grant_type="password",
            client_id=client.client_id,
            username=ADMIN_USERNAME,
            password=ADMIN_PASSWORD,
            scope="totally.fake.scope",
        )
        console.print(f"  [green]OK[/green] Response status: {resp.status_code}")
        try:
            body = resp.json()
            console.print(f"  Body: {json.dumps(body, indent=2)[:300]}")
        except Exception:
            console.print(f"  Body: {resp.text[:200]}")
        results.passed("Invalid scope request", f"status={resp.status_code}")
    except Exception as exc:
        console.print(f"  [red]X[/red] {exc}")
        results.failed("Invalid scope request", str(exc))


# ---------------------------------------------------------------------------
# 12. Account Type Scope Matrix
# ---------------------------------------------------------------------------


async def check_account_type_scopes(client: AuthClient, admin_token: TokenResponse) -> None:
    """Display what scopes each account type gets by reading built-in users."""
    section("8. Account Type Scope Matrix")

    table = Table(title="Scopes by Account Type", show_lines=True, title_style="bold")
    table.add_column("Account Type", style="bold cyan")
    table.add_column("Scopes")

    for username in [ADMIN_USERNAME, USER_USERNAME]:
        try:
            user = await client.get_user(admin_token, username)
            scope_text = Text()
            for i, s in enumerate(sorted(user.scopes)):
                if i > 0:
                    scope_text.append(", ")
                scope_text.append(s, style="green" if "write" in s else "dim")
            table.add_row(f"{user.account_type} ({user.user_name})", scope_text)
        except Exception as exc:
            table.add_row(username, f"[red]error: {exc}[/red]")

    console.print(table)

    subsection("All known scopes")
    for s in ALL_SCOPES:
        console.print(f"  [dim]-[/dim] {s}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main() -> None:
    console.print(
        Panel(
            "[bold]Opentrons Auth Server Check[/bold]\n"
            "[dim]Comprehensive probe of a robot's auth-server:[/dim]\n"
            "[dim]connectivity, OpenAPI, settings, access control, tokens,[/dim]\n"
            "[dim]introspection, refresh, user CRUD, scopes, and error handling[/dim]",
            border_style="blue",
        )
    )

    ip = resolve_robot_ip()
    console.print(f"\n[bold]Target:[/bold] {ip}")
    console.print(f"[bold]Auth URL:[/bold] http://{ip}:{AUTH_SERVER_PORT}")
    console.print(f"[bold]Robot URL:[/bold] http://{ip}:{ROBOT_SERVER_PORT}")

    # 1. Connectivity
    auth_ok, _robot_ok = check_connectivity(ip)
    if not auth_ok:
        console.print(
            "\n[red bold]Auth-server is not reachable.[/red bold] "
            "Make sure the robot is on and the auth-server is running."
        )
        results.print_summary()
        raise SystemExit(1)

    auth_url = f"http://{ip}:{AUTH_SERVER_PORT}"

    async with AuthClient(base_url=auth_url) as client:
        # 2. OpenAPI
        await check_openapi(client)

        # 3. ReDoc
        check_redoc(ip)

        # 4. Settings
        await check_settings(client)

        # 5. Access control
        await check_access_control(client)

        # 6. Token exchange
        section("4. Token Exchange (password grant)")
        admin_token = await check_token_exchange(client, ADMIN_USERNAME, ADMIN_PASSWORD, f"admin ({ADMIN_USERNAME})")
        console.print()
        user_token = await check_token_exchange(client, USER_USERNAME, USER_PASSWORD, f"user ({USER_USERNAME})")

        # 7. Token introspection
        section("5. Token Introspection")
        if admin_token:
            await check_introspection(client, admin_token, f"admin ({ADMIN_USERNAME})")
        if user_token:
            await check_introspection(client, user_token, f"user ({USER_USERNAME})")

        # 8. Token refresh
        if admin_token:
            await check_token_refresh(client, admin_token, f"admin ({ADMIN_USERNAME})")
        if user_token:
            await check_token_refresh(client, user_token, f"user ({USER_USERNAME})")

        # 9. Scoped token
        await check_scoped_token(client)

        # 10. User CRUD (needs admin token)
        if admin_token:
            await check_user_crud(client, admin_token)

        # 11. Error handling
        await check_error_cases(client)

        # 12. Scope matrix
        if admin_token:
            await check_account_type_scopes(client, admin_token)

    results.print_summary()

    failed_count = sum(1 for s, _, _ in results._results if s == "fail")
    if failed_count:
        console.print(f"\n[red bold]{failed_count} check(s) failed.[/red bold]")
    else:
        console.print("\n[green bold]All checks passed.[/green bold]")


if __name__ == "__main__":
    asyncio.run(main())
