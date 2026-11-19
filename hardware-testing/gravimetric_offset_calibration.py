#!/usr/bin/env python3
"""Launch the robot's calibration terminal from a computer using only Python stdlib."""

import argparse
from pathlib import Path
import re
import shlex
import subprocess
import sys
from typing import Optional


def ssh_command(host: str, key: Optional[str], arguments: list[str]) -> list[str]:
    """Quote remote arguments and reject hosts that could become SSH options."""
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9.:-]*", host):
        raise ValueError("--host 必须是机器人 IP 或主机名，不能包含用户名、空格或命令。")
    command = [
        "ssh",
        "-tt",
        "-o",
        "ServerAliveInterval=5",
        "-o",
        "ServerAliveCountMax=3",
        "-o",
        "HostkeyAlgorithms=+ssh-rsa",
        "-o",
        "PubkeyAcceptedAlgorithms=+ssh-rsa",
    ]
    if key:
        key_path = Path(key).expanduser()
        if not key_path.is_file():
            raise ValueError(f"SSH 私钥不存在：{key_path}")
        command.extend(["-i", str(key_path)])
    command.extend(
        [
            f"root@{host}",
            shlex.join(
                [
                    "env",
                    "PYTHONPATH=/opt/opentrons-robot-server:/usr/lib/python3.10/site-packages",
                    "python3",
                    "-u",
                    "-m",
                    "hardware_testing.gravimetric.offset_calibration",
                    *arguments,
                ]
            ),
        ]
    )
    return command


def main(argv: Optional[list[str]] = None) -> int:
    """Pass remaining arguments to the installed robot-side tool over a PTY."""
    parser = argparse.ArgumentParser(
        description="电脑端方向键校准入口。需先将本版本 hardware-testing 部署到机器人。",
        epilog="后续选项透传：--rack T200 --stacker A4 --direction both --resume；--list 只列路线。",
    )
    parser.add_argument("--host", required=True)
    parser.add_argument("--key", help="SSH 私钥；省略则使用 ssh-agent/默认密钥")
    args, remote_args = parser.parse_known_args(argv)
    try:
        command = ssh_command(args.host, args.key, remote_args)
        return subprocess.call(command)
    except (ValueError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
