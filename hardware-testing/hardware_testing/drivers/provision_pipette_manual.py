#!/usr/bin/env python3
"""Provision a pipette identity from a terminal without robot-server.

This is the bootstrap path for a pipette whose EEPROM identity is blank or
invalid. The operator supplies the serial from the production record; no
existing barcode and no robot-server hardware initialization are required.
Stop opentrons-robot-server before using this tool to avoid competing CAN
clients, then start it again after a successful write.
"""

import argparse
import asyncio
import json
import sys
from typing import Optional

from opentrons_hardware.drivers.can_bus import CanMessenger, build
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

from . import provision_pipette_protocol as worker


def _prompt_serial() -> str:
    """Read and validate a production serial without relying on a barcode."""
    while True:
        try:
            serial = input("输入生产系统分配的完整移液器序列号: ").strip()
        except (EOFError, KeyboardInterrupt) as error:
            raise SystemExit("未输入序列号，已取消首次烧录。") from error
        try:
            worker.parse_target(serial)
        except ValueError as error:
            print(f"序列号无效：{error}")
            continue
        return serial


def _confirm(serial: str, before_hex: str) -> bool:
    """Require an explicit confirmation before changing EEPROM."""
    try:
        answer = input(f"当前身份 {before_hex}；将写入 {serial}。确认写入？(y/n): ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        return False
    return answer == "y"


def _emit(result: worker.Result) -> None:
    """Print one machine-readable result for production tooling."""
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))


async def _provision(args: argparse.Namespace, serial: str) -> int:
    """Read, confirm, write, and verify one pipette identity over CAN."""
    async with (
        build.driver(build_settings(args)) as driver,
        CanMessenger(driver) as messenger,
    ):
        inspected = await worker.provision(
            messenger,
            action="inspect",
            which=args.which,
            requested_serial=serial,
            attempts=args.attempts,
            timeout=args.timeout,
        )
        if inspected.get("success") is not True:
            _emit(inspected)
            return 1
        before = inspected["before"]["raw_hex"]
        print(f"左侧当前身份: {inspected['before'].get('serial') or '空白/未知'} " f"({before})")
        if not args.yes and not _confirm(serial, before):
            print("已取消，未写入 EEPROM。")
            return 2
        result = await worker.provision(
            messenger,
            action="write",
            which=args.which,
            requested_serial=serial,
            expected_before_hex=before,
            attempts=args.attempts,
            timeout=args.timeout,
        )
        _emit(result)
        return 0 if result.get("success") is True else 1


def main(argv: Optional[list[str]] = None) -> int:
    """Run one manually entered bootstrap write."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--serial", help="Production serial; omit to enter it interactively"
    )
    parser.add_argument("--which", choices=["left", "right"], default="left")
    parser.add_argument(
        "--yes", action="store_true", help="Skip the write confirmation"
    )
    parser.add_argument("--attempts", type=int, default=3)
    parser.add_argument("--timeout", type=float, default=1.0)
    add_can_args(parser)
    args = parser.parse_args(argv)
    serial = args.serial or _prompt_serial()
    try:
        worker.parse_target(serial)
    except ValueError as error:
        parser.error(str(error))
    return asyncio.run(_provision(args, serial))


if __name__ == "__main__":
    sys.exit(main())
