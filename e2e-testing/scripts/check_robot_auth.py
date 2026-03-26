#!/usr/bin/env python3
"""Interactive CLI to walk through calling an authenticated robot-server endpoint.

Gets a token from the auth-server, then calls robot-server GET /health and
GET /runs with that token, using the RobotClient and Pydantic response models.

Usage:
    uv run python scripts/check_robot_auth.py              # uses ROBOT_IP from .env or prompts
    uv run python scripts/check_robot_auth.py 10.0.0.42    # override with positional arg
"""

from __future__ import annotations

import asyncio
import os
import sys
import time

import httpx
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

from automation.clients.auth import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    AuthClient,
)
from automation.clients.robot import (
    DEFAULT_ROBOT_SERVER_PORT,
    RobotClient,
)

load_dotenv()

console = Console()

AUTH_SERVER_PORT = 33950


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


async def main() -> None:
    console.print(
        Panel(
            "[bold]Robot-server authenticated endpoint check[/bold]\n"
            "[dim]Get a token from auth-server, then call robot GET /health and GET /runs[/dim]",
            border_style="blue",
        )
    )

    ip = resolve_robot_ip()
    console.print(f"\n[bold]Target:[/bold] {ip}\n")

    # Connectivity
    console.print("[bold]Connectivity[/bold]")
    auth_ok = check_reachable(ip, AUTH_SERVER_PORT, "auth-server")
    robot_ok = check_reachable(ip, DEFAULT_ROBOT_SERVER_PORT, "robot-server")

    if not auth_ok:
        console.print(
            "\n[red bold]Auth-server is not reachable.[/red bold] Get a token manually or start the auth-server."
        )
        raise SystemExit(1)

    if not robot_ok:
        console.print(
            "\n[yellow bold]Robot-server is not reachable.[/yellow bold] "
            "Continuing to fetch token; authenticated calls may fail."
        )

    auth_url = f"http://{ip}:{AUTH_SERVER_PORT}"
    robot_url = f"http://{ip}:{DEFAULT_ROBOT_SERVER_PORT}"

    # Get token
    console.print("\n[bold]Token (password grant)[/bold]")
    async with AuthClient(base_url=auth_url) as auth_client:
        try:
            token = await auth_client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
            console.print(
                f"  [green]:heavy_check_mark:[/green] Got token for [bold]{ADMIN_USERNAME}[/bold] "
                f"[dim](expires_in={token.expires_in}s)[/dim]"
            )
            access_token = token.access_token
        except httpx.HTTPStatusError as exc:
            console.print(
                f"  [red]:cross_mark:[/red] Token exchange failed  "
                f"[dim]{exc.response.status_code}: {exc.response.text[:120]}[/dim]"
            )
            raise SystemExit(1) from exc

    # Call robot-server with token
    console.print("\n[bold]Robot-server GET /health (with token)[/bold]")
    async with RobotClient(base_url=robot_url) as robot_client:
        try:
            start = time.monotonic()
            health = await robot_client.get_health(access_token=access_token)
            elapsed_ms = (time.monotonic() - start) * 1000
            console.print(f"  [green]:heavy_check_mark:[/green] 200  [dim]({elapsed_ms:.0f}ms)[/dim]")

            table = Table(show_header=False, box=None, padding=(0, 2))
            table.add_column("Key", style="cyan")
            table.add_column("Value", style="white")
            table.add_row("name", health.name)
            table.add_row("robot_model", health.robot_model)
            table.add_row("api_version", health.api_version)
            table.add_row("fw_version", health.fw_version)
            table.add_row("system_version", health.system_version)
            table.add_row("robot_serial", str(health.robot_serial))
            console.print(table)
        except httpx.HTTPStatusError as exc:
            console.print(
                f"  [red]:cross_mark:[/red] GET /health failed  "
                f"[dim]{exc.response.status_code}: {exc.response.text[:200]}[/dim]"
            )
        except Exception as exc:
            console.print(f"  [red]:cross_mark:[/red] {exc}")

    console.print("\n[bold]Robot-server GET /runs (with token)[/bold]")
    async with RobotClient(base_url=robot_url) as robot_client:
        try:
            start = time.monotonic()
            runs = await robot_client.get_runs(access_token=access_token)
            elapsed_ms = (time.monotonic() - start) * 1000
            console.print(f"  [green]:heavy_check_mark:[/green] 200  [dim]({elapsed_ms:.0f}ms)[/dim]")

            meta = runs.meta
            total = meta.total_length if meta else len(runs.data)
            console.print(f"  [dim]Total runs:[/dim] {total}")

            if runs.data:
                run_table = Table(
                    title="Runs (first 5)",
                    show_header=True,
                    header_style="bold cyan",
                )
                run_table.add_column("id", style="dim")
                run_table.add_column("status")
                run_table.add_column("current")
                run_table.add_column("protocol_id", style="dim")
                for r in runs.data[:5]:
                    run_table.add_row(
                        r.id[:20] + "..." if len(r.id) > 20 else r.id,
                        r.status,
                        "yes" if r.current else "",
                        r.protocol_id or "",
                    )
                console.print(run_table)
            else:
                console.print("  [dim]No runs.[/dim]")
        except httpx.HTTPStatusError as exc:
            console.print(
                f"  [red]:cross_mark:[/red] GET /runs failed  "
                f"[dim]{exc.response.status_code}: {exc.response.text[:200]}[/dim]"
            )
        except Exception as exc:
            console.print(f"  [red]:cross_mark:[/red] {exc}")

    console.print("\n[green bold]Done.[/green bold]")


if __name__ == "__main__":
    asyncio.run(main())
