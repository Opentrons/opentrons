#!/usr/bin/env python3
"""Stop active runs and clear leftover run state on a Flex robot.

Usage:
    uv run python scripts/cleanup_robot_runs.py 192.168.0.20
    ROBOT_IP=192.168.0.20 uv run python scripts/cleanup_robot_runs.py

Uses ``demo_service``, then ``demo_admin``, then ``demo_operator``, then
``AUTH_USERNAME`` / ``AUTH_PASSWORD``. When access control is disabled, calls
run endpoints without a token.

Requires robot CA trust in ``robot-certs/``.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from automation.clients.auth import AuthClient
from automation.robot_certs.registry import RobotCertRegistryError
from automation.robot_cleanup import cleanup_robot_runs, resolve_robot_control_session

load_dotenv()

console = Console()


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Stop active protocol runs and clear leftover run state on a Flex robot.",
    )
    parser.add_argument(
        "robot_ip",
        nargs="?",
        default=os.environ.get("ROBOT_IP"),
        help="Robot hostname or IP (default: ROBOT_IP from environment)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="Seconds to wait for a run to stop (default: 30)",
    )
    parser.add_argument(
        "--keep-idle-runs",
        action="store_true",
        help="Stop active runs but leave idle/stopped protocol runs in place",
    )
    parser.add_argument(
        "--skip-update-cancel",
        action="store_true",
        help="Do not POST /server/update/cancel",
    )
    parser.add_argument(
        "--restart",
        action="store_true",
        help="POST /server/restart after cleanup (reboots the robot in ~1s)",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Print nothing on success when nothing changed",
    )
    return parser.parse_args(argv)


def _render_report(report: object) -> None:
    from automation.robot_cleanup import CleanupReport

    assert isinstance(report, CleanupReport)
    table = Table(title="Robot cleanup", show_header=True, header_style="bold cyan")
    table.add_column("Target")
    table.add_column("Action")
    table.add_column("Outcome")
    for step in report.actions:
        table.add_row(step.target, step.action, step.outcome)
    console.print(
        Panel(
            table,
            title=f"Authenticated as {report.auth_label}",
            border_style="green" if report.changed else "blue",
        )
    )


async def main(argv: list[str] | None = None) -> None:
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    if not args.robot_ip:
        console.print(
            "[yellow]Pass a robot IP or set ROBOT_IP.[/yellow]\n"
            "  Example: uv run python scripts/cleanup_robot_runs.py 192.168.0.20"
        )
        raise SystemExit(1)

    try:
        client = AuthClient(args.robot_ip)
    except RobotCertRegistryError as err:
        console.print(Panel(f"[red]{err}[/red]", title="HTTPS setup failed", border_style="red"))
        raise SystemExit(1) from err

    async with client:
        try:
            session = await resolve_robot_control_session(client)
        except ValueError as err:
            console.print(f"[red]{err}[/red]")
            raise SystemExit(1) from err

        report = await cleanup_robot_runs(
            client,
            session,
            delete_idle=not args.keep_idle_runs,
            cancel_update=not args.skip_update_cancel,
            restart=args.restart,
            timeout_s=args.timeout,
        )

    if args.quiet and not report.changed:
        return

    if report.changed:
        _render_report(report)
    else:
        console.print(
            Panel(
                "No active runs or leftover update sessions found.",
                title=f"Robot clean ({report.auth_label})",
                border_style="blue",
            )
        )

    if args.restart:
        console.print("[yellow]Robot is rebooting; HTTPS will be unavailable briefly.[/yellow]")


if __name__ == "__main__":
    asyncio.run(main())
