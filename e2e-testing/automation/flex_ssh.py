"""SSH helpers for running commands on a Flex robot as root."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

DEFAULT_KEY = Path.home() / ".ssh" / "robot_key"
FALLBACK_KEY = Path.home() / ".ssh" / "flex_key"
DEFAULT_USER = "root"


def default_ssh_key() -> Path:
    return Path(os.environ.get("FLEX_SSH_KEY", str(DEFAULT_KEY))).expanduser()


def ssh_keys_to_try(key: Path | None) -> list[Path]:
    """Return SSH private keys to attempt, in order.

    When ``key`` is passed explicitly, only that key is used. Otherwise use
    ``FLEX_SSH_KEY``, then common local keys (``robot_key``, ``flex_key``).
    """

    if key is not None:
        return [key.expanduser()]

    if os.environ.get("FLEX_SSH_KEY"):
        return [Path(os.environ["FLEX_SSH_KEY"]).expanduser()]

    keys: list[Path] = []
    for candidate in (DEFAULT_KEY, FALLBACK_KEY):
        path = candidate.expanduser()
        if path.is_file() and path not in keys:
            keys.append(path)
    return keys or [DEFAULT_KEY.expanduser()]


def build_ssh_argv(
    *,
    host: str,
    remote_command: str | None = None,
    key: Path | None = None,
    user: str = DEFAULT_USER,
    allocate_tty: bool = False,
) -> list[str]:
    key_path = (key or default_ssh_key()).expanduser()
    if not key_path.is_file():
        raise FileNotFoundError(f"SSH private key not found: {key_path}")

    ssh_argv = [
        "ssh",
        "-i",
        str(key_path),
        "-o",
        "IdentitiesOnly=yes",
        "-o",
        "StrictHostKeyChecking=accept-new",
    ]
    if allocate_tty or remote_command is None:
        ssh_argv.insert(1, "-t")
    ssh_argv.append(f"{user}@{host}")
    if remote_command:
        ssh_argv.append(remote_command)
    return ssh_argv


def run_ssh(
    host: str,
    remote_command: str,
    *,
    key: Path | None = None,
    user: str = DEFAULT_USER,
) -> int:
    keys = ssh_keys_to_try(key)
    last_exit_code = 1

    for index, key_path in enumerate(keys):
        if not key_path.is_file():
            if index == 0:
                raise FileNotFoundError(f"SSH private key not found: {key_path}")
            continue

        ssh_argv = build_ssh_argv(
            host=host,
            remote_command=remote_command,
            key=key_path,
            user=user,
        )
        last_exit_code = subprocess.call(ssh_argv)
        if last_exit_code == 0:
            return 0
        # 255 usually means auth failure; try the next local key if any remain.
        if last_exit_code != 255 or index == len(keys) - 1:
            return last_exit_code

    return last_exit_code
