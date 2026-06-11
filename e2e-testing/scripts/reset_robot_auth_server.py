#!/usr/bin/env python3
"""Reset auth-server state on a Flex robot over SSH.

Runs the same steps as a manual Jupyter terminal reset:

    systemctl stop opentrons-auth-server
    rm -rf /var/lib/opentrons-auth-server
    systemctl start opentrons-auth-server
    systemctl restart opentrons-robot-app

This wipes all auth-server users, tokens, and access-control settings on the robot.
Re-provision demo users afterward with ``make provision-demo-users``.

Usage:
    uv run python scripts/reset_robot_auth_server.py 192.168.0.20
    ROBOT_IP=192.168.0.20 uv run python scripts/reset_robot_auth_server.py --yes

Requires root SSH access (``~/.ssh/robot_key`` by default; see ``scripts/ssh_flex.py``).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel

from automation.flex_ssh import run_ssh

load_dotenv()

console = Console()

AUTH_SERVER_DATA_DIR = "/var/lib/opentrons-auth-server"
REMOTE_RESET_COMMAND = (
    "systemctl stop opentrons-auth-server"
    f" && rm -rf {AUTH_SERVER_DATA_DIR}"
    " && systemctl start opentrons-auth-server"
    " && systemctl restart opentrons-robot-app"
)


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reset Flex auth-server state over SSH (wipes users and access-control settings).",
    )
    parser.add_argument(
        "robot_ip",
        nargs="?",
        default=os.environ.get("ROBOT_IP"),
        help="Robot IP or hostname (default: ROBOT_IP from environment)",
    )
    parser.add_argument(
        "--key",
        type=Path,
        default=None,
        help="SSH private key path (default: FLEX_SSH_KEY or ~/.ssh/robot_key)",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip confirmation prompt",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the remote command without running it",
    )
    parser.add_argument(
        "--skip-robot-app",
        action="store_true",
        help="Do not restart opentrons-robot-app",
    )
    return parser.parse_args(argv)


def _remote_command(*, skip_robot_app: bool) -> str:
    if skip_robot_app:
        return (
            "systemctl stop opentrons-auth-server"
            f" && rm -rf {AUTH_SERVER_DATA_DIR}"
            " && systemctl start opentrons-auth-server"
        )
    return REMOTE_RESET_COMMAND


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    if not args.robot_ip:
        console.print(
            "[yellow]Pass a robot IP or set ROBOT_IP.[/yellow]\n"
            "  Example: uv run python scripts/reset_robot_auth_server.py 192.168.0.20 --yes"
        )
        return 1

    remote_command = _remote_command(skip_robot_app=args.skip_robot_app)
    console.print(
        Panel(
            f"[bold]Host:[/bold] {args.robot_ip}\n"
            f"[bold]Remote command:[/bold]\n  {remote_command}\n\n"
            "This deletes all auth-server data on the robot, including users and "
            "access-control settings.",
            title="Auth-server reset",
            border_style="yellow",
        )
    )

    if args.dry_run:
        return 0

    if not args.yes:
        confirm = console.input("[yellow]Type reset to continue:[/yellow] ").strip()
        if confirm != "reset":
            console.print("[red]Aborted.[/red]")
            return 1

    try:
        exit_code = run_ssh(args.robot_ip, remote_command, key=args.key)
    except FileNotFoundError as err:
        console.print(f"[red]{err}[/red]")
        return 1

    if exit_code == 0:
        console.print(
            Panel(
                "Auth-server data wiped and services restarted.\n"
                "Run [bold]make provision-demo-users ROBOT_IP=...[/bold] to recreate demo accounts.",
                title="Done",
                border_style="green",
            )
        )
    else:
        console.print(
            "[red]SSH command failed with exit code "
            f"{exit_code}.[/red]\n"
            "If you see Permission denied (publickey), confirm the matching public key "
            "is on the robot (USB + POST /server/ssh_keys/from_local) or set "
            "FLEX_SSH_KEY to your private key path."
        )
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
