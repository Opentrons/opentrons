#!/usr/bin/env python3
"""Interactive CLI to check auth-server status on a robot.

Uses the AuthClient to probe a robot's auth-server and display
connection info, settings, and token exchange results.

Usage:
    uv run python scripts/check_auth.py              # uses ROBOT_IP from .env or prompts
    uv run python scripts/check_auth.py 10.0.0.42    # override with positional arg
"""

from __future__ import annotations

import os
import sys
import time

import httpx
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

from automation.auth_client import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    USER_PASSWORD,
    USER_USERNAME,
    AuthClient,
)

load_dotenv()

console = Console()

AUTH_SERVER_PORT = 33950
ROBOT_SERVER_PORT = 31950


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


def check_reachable(ip: str, port: int, label: str, timeout: float = 3.0) -> bool:
    """Try to connect to a host:port and report the result."""
    url = f"http://{ip}:{port}"
    try:
        start = time.monotonic()
        resp = httpx.get(f"{url}/health", timeout=timeout)
        elapsed_ms = (time.monotonic() - start) * 1000
        console.print(
            f"  [green]:heavy_check_mark:[/green] {label} on [bold]{url}[/bold]  "
            f"[dim]({resp.status_code}, {elapsed_ms:.0f}ms)[/dim]"
        )
        return True
    except httpx.ConnectError:
        console.print(f"  [red]:cross_mark:[/red] {label} on [bold]{url}[/bold]  [dim]connection refused[/dim]")
        return False
    except httpx.TimeoutException:
        console.print(f"  [yellow]:warning:[/yellow] {label} on [bold]{url}[/bold]  [dim]timed out[/dim]")
        return False
    except Exception as exc:
        console.print(f"  [red]:cross_mark:[/red] {label} on [bold]{url}[/bold]  [dim]{exc}[/dim]")
        return False


def check_auth_settings(client: AuthClient) -> None:
    """Fetch and display auth settings."""
    console.print("\n[bold]Auth Settings[/bold]")
    try:
        settings = client.get_settings()
        data = settings.get("data", settings)
        table = Table(show_header=False, box=None, padding=(0, 2))
        table.add_column("Key", style="cyan")
        table.add_column("Value", style="white")
        for key, value in data.items() if isinstance(data, dict) else [("raw", data)]:
            table.add_row(str(key), str(value))
        console.print(table)
    except Exception as exc:
        console.print(f"  [red]Failed to get settings:[/red] {exc}")


def check_token_exchange(client: AuthClient, username: str, password: str, label: str) -> None:
    """Try a password-grant token exchange and display the result."""
    try:
        start = time.monotonic()
        token = client.get_token(username, password)
        elapsed_ms = (time.monotonic() - start) * 1000
        console.print(f"  [green]:heavy_check_mark:[/green] {label}  [dim]({elapsed_ms:.0f}ms)[/dim]")

        table = Table(show_header=False, box=None, padding=(0, 2))
        table.add_column("Field", style="cyan")
        table.add_column("Value", style="white")
        table.add_row("access_token", token.access_token[:40] + "...")
        table.add_row("token_type", token.token_type)
        table.add_row("expires_in", f"{token.expires_in}s")
        table.add_row("refresh_token", (token.refresh_token or "")[:40] + "..." if token.refresh_token else "None")
        table.add_row("scope", token.scope)
        console.print(table)

        introspect = client.introspect(token.access_token)
        active = introspect.get("active", False)
        status = "[green]active[/green]" if active else "[red]inactive[/red]"
        console.print(f"  Introspection: {status}  user=[bold]{introspect.get('username', '?')}[/bold]")

    except httpx.HTTPStatusError as exc:
        console.print(
            f"  [red]:cross_mark:[/red] {label}  [dim]{exc.response.status_code}: {exc.response.text[:120]}[/dim]"
        )
    except Exception as exc:
        console.print(f"  [red]:cross_mark:[/red] {label}  [dim]{exc}[/dim]")


def main() -> None:
    console.print(
        Panel(
            "[bold]Opentrons Auth Server Check[/bold]\n"
            "[dim]Probe a robot's auth-server and validate the OAuth 2 flow[/dim]",
            border_style="blue",
        )
    )

    ip = resolve_robot_ip()
    console.print(f"\n[bold]Target:[/bold] {ip}\n")

    # -- Connectivity checks ---------------------------------------------------
    console.print("[bold]Connectivity[/bold]")
    auth_ok = check_reachable(ip, AUTH_SERVER_PORT, "auth-server")
    check_reachable(ip, ROBOT_SERVER_PORT, "robot-server")

    if not auth_ok:
        console.print(
            "\n[red bold]Auth-server is not reachable.[/red bold] "
            "Make sure the robot is on and the auth-server is running."
        )
        raise SystemExit(1)

    # -- Auth settings ---------------------------------------------------------
    auth_url = f"http://{ip}:{AUTH_SERVER_PORT}"
    with AuthClient(base_url=auth_url) as client:
        check_auth_settings(client)

        # -- Token exchange ----------------------------------------------------
        console.print("\n[bold]Token Exchange (password grant)[/bold]")
        check_token_exchange(client, ADMIN_USERNAME, ADMIN_PASSWORD, f"admin ({ADMIN_USERNAME})")
        console.print()
        check_token_exchange(client, USER_USERNAME, USER_PASSWORD, f"user  ({USER_USERNAME})")

    console.print("\n[green bold]Done.[/green bold]")


if __name__ == "__main__":
    main()
