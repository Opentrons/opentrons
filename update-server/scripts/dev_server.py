#!/usr/bin/env python3
"""
Local dev runner for the update-server HTTP layer (macOS/non-robot).

Runs the REAL aiohttp session state machine. Only the hardware-specific
parts are replaced so this works on a Mac:

  Hardware stub           What it replaces
  ──────────────────────  ───────────────────────────────────────────────────
  write_update (OT-2)     writes rootfs.ext4 to a tmpfile
  write_update (OT-3)     simulates progress; skips 2 GB xz decompress
  mount_update            yields a tmpdir, no mount/umount syscalls
  commit_update           no-op (no ot-switch-partitions / fw_setenv)
  write_machine_id        no-op (/etc/machine-id not on macOS)
  PartitionManager (OT-3) all calls stub-out safely
  control._do_restart     logs "restart: no-op" instead of calling reboot
  NameSynchronizer        returns "dev-robot"; no Avahi/D-Bus required
  boot_id                 injected fake string

Signature checking is always disabled (no production cert locally).

Usage (from update-server/):
    uv run python scripts/dev_server.py                   # OT-2 / buildroot
    uv run python scripts/dev_server.py --flex            # OT-3 / openembedded

Then in another terminal:
    # OT-2
    python .cursor/skills/robot-ip-health/scripts/update_robot.py \\
        localhost --version 8.3.0 --port 34000

    # OT-3 / Flex
    python .cursor/skills/robot-ip-health/scripts/update_robot.py \\
        localhost --version 8.8.1 --port 34000
"""

import argparse
import asyncio
import contextlib
import json
import logging
import os
import shutil
import tempfile
from typing import Callable, Generator, Optional, Tuple
from unittest.mock import AsyncMock, MagicMock

from aiohttp import web

from otupdate.common import control as control_mod
from otupdate.common.name_management.name_synchronizer import NameSynchronizer
from otupdate.common.update_actions import FILE_ACTIONS_VARNAME, Partition

LOG = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# OT-2 / buildroot dev actions
# ──────────────────────────────────────────────────────────────────────────────
from otupdate.buildroot import get_app as br_get_app
from otupdate.buildroot.update_actions import OT2UpdateActions, write_file


class DevOT2UpdateActions(OT2UpdateActions):
    """OT2UpdateActions with hardware calls replaced by safe local stubs.

    validate_update is inherited — it unzips, sha256-hashes, and checks the
    rootfs hash (signature checking disabled via config).
    """

    def __init__(self, partfile: str) -> None:
        self._partfile = partfile

    def write_update(
        self,
        rootfs_filepath: str,
        progress_callback: Callable[[float], None],
        chunk_size: int = 1024,
        file_size: Optional[int] = None,
    ) -> Partition:
        LOG.info(f"[dev-ot2] write_update → {self._partfile}")
        write_file(rootfs_filepath, self._partfile, progress_callback, chunk_size, file_size)
        return Partition(2, self._partfile)

    @contextlib.contextmanager
    def mount_update(self) -> Generator[str, None, None]:
        with tempfile.TemporaryDirectory() as mountpoint:
            LOG.info(f"[dev-ot2] mount_update → {mountpoint}")
            yield mountpoint

    def commit_update(self) -> None:
        LOG.info("[dev-ot2] commit_update → no-op")

    def write_machine_id(self, current_root: str, new_root: str) -> None:
        LOG.info("[dev-ot2] write_machine_id → no-op")

    def clean_up(self, download_dir: str) -> None:
        LOG.info(f"[dev-ot2] clean_up → {download_dir}")
        super().clean_up(download_dir)


# ──────────────────────────────────────────────────────────────────────────────
# OT-3 / openembedded dev actions
# ──────────────────────────────────────────────────────────────────────────────
from otupdate.openembedded import get_app as oe_get_app
from otupdate.openembedded.update_actions import (
    OT3UpdateActions,
    PartitionManager,
    RootFSInterface,
)


class DevPartitionManager(PartitionManager):
    """PartitionManager with all subprocess calls replaced by no-ops."""

    def __init__(self, partfile: str) -> None:
        self._fake = Partition(3, partfile, partfile)

    def used_partition(self) -> bytes:
        return b"2"  # say partition 2 is active → unused is 3

    def find_unused_partition(self, which: bytes) -> Partition:
        return self._fake

    def umount_fs(self, path: str) -> bool:
        LOG.info(f"[dev-ot3] umount_fs {path} → no-op")
        return True

    def mount_fs(self, path: str, mount_point: str) -> bool:
        LOG.info(f"[dev-ot3] mount_fs {path} → no-op")
        return True

    def switch_partition(self) -> Partition:
        LOG.info("[dev-ot3] switch_partition → no-op")
        return self._fake

    def resize_partition(self, path: str) -> bool:
        LOG.info(f"[dev-ot3] resize_partition {path} → no-op")
        return True

    def mountpoint_root(self) -> str:
        return tempfile.gettempdir()

    @staticmethod
    def get_partition_size(path: str) -> int:
        return 4 * 1024 * 1024 * 1024  # 4 GB so the size check always passes


class DevRootFSInterface(RootFSInterface):
    """Skips the expensive xz decompress+write; emits realistic progress ticks.

    The real decompression would take several minutes and ~2 GB of disk on a
    Mac — for a dev demo we simulate the write stage with progress callbacks
    while still running the REAL validate_update (hash check on the xz file).
    """

    def write_update(
        self,
        rootfs_filepath: str,
        part: Partition,
        progress_callback: Callable[[float], None],
        chunk_size: int = 1024,
    ) -> Tuple[bool, str]:
        size_mb = os.path.getsize(rootfs_filepath) / (1024 * 1024)
        LOG.info(f"[dev-ot3] write_update → simulating write ({size_mb:.0f} MB xz)")
        steps = 20
        for i in range(1, steps + 1):
            progress_callback(i / steps)
        return True, ""


class DevOT3UpdateActions(OT3UpdateActions):
    """OT3UpdateActions with hardware calls replaced by dev-safe stubs."""

    def __init__(self, partfile: str) -> None:
        super().__init__(
            root_FS_intf=DevRootFSInterface(),
            part_mngr=DevPartitionManager(partfile),
        )

    @contextlib.contextmanager
    def mount_update(self) -> Generator[str, None, None]:
        with tempfile.TemporaryDirectory() as mountpoint:
            LOG.info(f"[dev-ot3] mount_update → {mountpoint}")
            yield mountpoint

    def commit_update(self) -> None:
        LOG.info("[dev-ot3] commit_update → no-op")

    def write_machine_id(self, current_root: str, new_root: str) -> None:
        LOG.info("[dev-ot3] write_machine_id → no-op")

    def clean_up(self, download_dir: str) -> None:
        LOG.info(f"[dev-ot3] clean_up → {download_dir}")
        super().clean_up(download_dir)


# ──────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ──────────────────────────────────────────────────────────────────────────────
def _make_name_sync() -> NameSynchronizer:
    mock_sync: MagicMock = MagicMock(spec=NameSynchronizer)
    mock_sync.get_name = AsyncMock(return_value="dev-robot")
    mock_sync.set_name = AsyncMock(side_effect=lambda name: name)
    return mock_sync  # type: ignore[return-value]


def _make_temp_tree(flex: bool) -> tuple[str, str, str, str]:
    """Create all temp files/dirs. Returns (tmpdir, partfile, config_path, version_path)."""
    tmpdir = tempfile.mkdtemp(prefix="otupdate-dev-")
    partfile = os.path.join(tmpdir, "fake-partition.img")
    downloads = os.path.join(tmpdir, "downloads")
    os.makedirs(downloads, exist_ok=True)

    config_path = os.path.join(tmpdir, "config.json")
    with open(config_path, "w") as f:
        json.dump({"signature_required": False, "download_storage_path": downloads}, f)

    # VERSION.json key names differ between buildroot and openembedded
    version_path = os.path.join(tmpdir, "VERSION.json")
    with open(version_path, "w") as f:
        if flex:
            json.dump(
                {
                    "openembedded_version": "0.0.0-dev",
                    "opentrons_api_version": "0.0.0-dev",
                    "update_server_version": "0.0.0-dev",
                },
                f,
            )
        else:
            json.dump(
                {
                    "buildroot_version": "0.0.0-dev",
                    "opentrons_api_version": "0.0.0-dev",
                    "update_server_version": "0.0.0-dev",
                },
                f,
            )

    return tmpdir, partfile, config_path, version_path


def _health_handler(robot_model: str) -> web.RequestHandler:
    """Build a /health stub that reports the given robot_model."""

    async def handler(request: web.Request) -> web.Response:
        return web.json_response(
            {
                "name": "dev-robot",
                "robot_model": robot_model,
                "robot_serial": "dev-serial",
                "api_version": "0.0.0-dev",
                "fw_version": "0.0.0-dev",
                "board_revision": "dev",
                "logs": [],
                "systemTime": "2026-01-01T00:00:00.000Z",
                "links": {},
                "activeProtocolRun": None,
            }
        )

    return handler


# ──────────────────────────────────────────────────────────────────────────────
# Server entry point
# ──────────────────────────────────────────────────────────────────────────────
async def run_server(port: int, flex: bool) -> None:
    tmpdir, partfile, config_path, version_path = _make_temp_tree(flex)

    original_do_restart = control_mod._do_restart  # type: ignore[attr-defined]
    control_mod._do_restart = lambda: LOG.info(  # type: ignore[attr-defined]
        "[dev] /server/restart → no-op"
    )

    try:
        name_sync = _make_name_sync()

        if flex:
            robot_model = "OT-3 Standard"
            app = await oe_get_app(
                name_synchronizer=name_sync,
                system_version_file=version_path,
                config_file_override=config_path,
                boot_id_override="dev-boot-id-abc123",
            )
            app[FILE_ACTIONS_VARNAME] = DevOT3UpdateActions(partfile)
            example_version = "8.8.1"
            label = "Flex / OT-3  (openembedded)"
        else:
            robot_model = "OT-2 Standard"
            app = await br_get_app(
                name_synchronizer=name_sync,
                system_version_file=version_path,
                config_file_override=config_path,
                boot_id_override="dev-boot-id-abc123",
            )
            app[FILE_ACTIONS_VARNAME] = DevOT2UpdateActions(partfile)
            example_version = "8.3.0"
            label = "OT-2  (buildroot)"

        app.router.add_get("/health", _health_handler(robot_model))

        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", port)
        await site.start()

        print(f"\n{'─'*62}")
        print(f"  Update server (dev mode) — {label}")
        print(f"  Listening:          http://localhost:{port}")
        print(f"  Robot model:        {robot_model}")
        print(f"  Signature check:    DISABLED")
        print(f"  Fake partition:     {partfile}")
        print(f"{'─'*62}")
        print(f"\n  Run update_robot.py against this server:")
        print(
            f"  python .cursor/skills/robot-ip-health/scripts/update_robot.py \\\n"
            f"    localhost --version {example_version} --port {port}\n"
        )
        print("  Press Ctrl+C to stop\n")

        stop = asyncio.Event()
        try:
            await stop.wait()
        except (KeyboardInterrupt, asyncio.CancelledError):
            pass

    finally:
        control_mod._do_restart = original_do_restart  # type: ignore[attr-defined]
        await runner.cleanup()
        shutil.rmtree(tmpdir, ignore_errors=True)
        LOG.info(f"[dev] Cleaned up {tmpdir}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Local dev runner for the update-server HTTP layer.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--port",
        type=int,
        default=34000,
        help="Port to listen on (default: 34000)",
    )
    parser.add_argument(
        "--flex",
        action="store_true",
        help="Run in OT-3 / Flex (openembedded) mode instead of OT-2",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Log level (default: INFO)",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(name)-35s %(levelname)-8s %(message)s",
        datefmt="%H:%M:%S",
    )

    try:
        asyncio.run(run_server(args.port, args.flex))
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
