#!/usr/bin/env python3
"""Run gripper calibration directly on the OT3, including from an SSH terminal."""

import os
from pathlib import Path
import subprocess
import sys


def _package_paths() -> list[str]:
    """Prefer the running server's package paths; allow help/recovery while stopped."""
    fallback = ["/opt/opentrons-robot-server", "/usr/lib/python3.10/site-packages"]
    try:
        pid = subprocess.check_output(
            [
                "systemctl",
                "show",
                "--property=MainPID",
                "--value",
                "opentrons-robot-server",
            ],
            text=True,
            timeout=10,
        ).strip()
        if pid.isdecimal() and int(pid) > 0:
            for item in Path(f"/proc/{pid}/environ").read_bytes().split(b"\0"):
                key, separator, value = item.partition(b"=")
                if separator and key == b"PYTHONPATH":
                    return [
                        part for part in value.decode().split(os.pathsep) if part
                    ] or fallback
    except (OSError, subprocess.SubprocessError):
        pass
    return fallback


def main() -> int:
    """Load the robot-side module without starting another SSH connection."""
    paths = _package_paths()
    sys.path[:] = paths + [entry for entry in sys.path if entry not in paths]
    try:
        from hardware_testing.gravimetric.offset_calibration.__main__ import main as run
    except ModuleNotFoundError as error:
        print(f"缺少 OT3 校准配套模块，请先部署 offset_calibration：{error}", file=sys.stderr)
        return 1
    return run()


if __name__ == "__main__":
    sys.exit(main())
