"""
otupdate.common.control: non-update-specific endpoints for otupdate

This has endpoints like /restart that aren't specific to update tasks or machines.
"""
import asyncio
import logging
import subprocess
from functools import lru_cache
from pathlib import Path
from typing import Callable, Coroutine, Mapping, Any

from aiohttp import web

from .constants import RESTART_LOCK_NAME, DEVICE_BOOT_ID_NAME
from .name_management import get_name_synchronizer

LOG = logging.getLogger(__name__)


def _do_restart():
    subprocess.check_call(["reboot"])


async def restart(request: web.Request) -> web.Response:
    """Restart the robot.

    Blocks while the restart lock is held.
    """
    async with request.app[RESTART_LOCK_NAME]:
        asyncio.get_event_loop().call_later(1, _do_restart)
    return web.json_response({"message": "Restarting in 1s"}, status=200)


def build_health_endpoint(
    health_response: Mapping[str, Any]
) -> Callable[[web.Request], Coroutine[None, None, web.Response]]:
    """Build a coroutine to serve /health that captures version info"""

    async def health(request: web.Request) -> web.Response:
        return web.json_response(
            {
                **health_response,
                **{
                    "name": await get_name_synchronizer(request).get_name(),
                    "serialNumber": get_serial(),
                    "bootId": request.app[DEVICE_BOOT_ID_NAME],
                },
            },
            headers={"Access-Control-Allow-Origin": "*"},
        )

    return health


def get_serial() -> str:
    """Get the device serial number."""
    try:
        return Path("/var/serial").read_text().strip()
    except OSError:
        return "unknown"


@lru_cache(maxsize=1)
def get_boot_id() -> str:
    # See the "/proc Interface" section in man(4) random.
    return Path("/proc/sys/kernel/random/boot_id").read_text().strip()
