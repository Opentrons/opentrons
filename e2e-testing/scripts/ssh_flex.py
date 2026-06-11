#!/usr/bin/env python3
"""Open an SSH session to a Flex as root using ~/.ssh/robot_key.

Usage:
    uv run python scripts/ssh_flex.py <robot-ip>
    uv run python scripts/ssh_flex.py 192.168.0.20 --key ~/.ssh/flex_key
    uv run python scripts/ssh_flex.py              # host from ROBOT_IP in .env
    uv run python scripts/ssh_flex.py 192.168.0.20 -- ls -la /data/auth-server

Environment:
    ROBOT_IP          Default host if omitted on the command line
    FLEX_SSH_KEY      Path to private key (default: ~/.ssh/robot_key)
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv

from automation.flex_ssh import build_ssh_argv, default_ssh_key

load_dotenv()

DEFAULT_USER = "root"


def _parse_args(argv: list[str]) -> tuple[argparse.Namespace, list[str]]:
    parser = argparse.ArgumentParser(
        description="SSH to a Flex robot as root with robot_key.",
    )
    parser.add_argument(
        "robot_ip",
        nargs="?",
        default=os.environ.get("ROBOT_IP"),
        help="Robot IP or hostname (or set ROBOT_IP)",
    )
    parser.add_argument(
        "--key",
        type=Path,
        default=None,
        help=f"Private key path (default: {default_ssh_key()})",
    )
    parser.add_argument(
        "--user",
        default=DEFAULT_USER,
        help=f"SSH user (default: {DEFAULT_USER})",
    )
    return parser.parse_known_args(argv)


def _remote_command_from_remainder(remainder: list[str]) -> str | None:
    if not remainder:
        return None
    if remainder[0] == "--":
        remainder = remainder[1:]
    if not remainder:
        return None
    return " ".join(remainder)


def main(argv: list[str] | None = None) -> int:
    args, remainder = _parse_args(argv or sys.argv[1:])
    remote_command = _remote_command_from_remainder(remainder)

    if not args.robot_ip:
        print(
            "error: provide robot_ip or set ROBOT_IP in the environment or .env",
            file=sys.stderr,
        )
        return 2

    try:
        ssh_argv = build_ssh_argv(
            host=args.robot_ip,
            remote_command=remote_command,
            key=args.key,
            user=args.user,
        )
    except FileNotFoundError as err:
        print(f"error: {err}", file=sys.stderr)
        return 2

    return subprocess.call(ssh_argv)


if __name__ == "__main__":
    raise SystemExit(main())
