"""
otupdate.common.control: non-update-specific endpoints for otupdate

This has endpoints like /restart that aren't specific to update tasks or machines.
"""
import asyncio
import logging
import subprocess
from functools import lru_cache
from pathlib import Path
from typing import Callable, Coroutine, Mapping

from aiohttp import web

from .constants import (
    RESTART_LOCK_NAME, DEVICE_BOOT_ID_NAME, DEVICE_NAME_VARNAME
)

LOG = logging.getLogger(__name__)


def _do_restart():
    subprocess.check_call(['reboot'])


async def restart(request: web.Request) -> web.Response:
    """ Restart the robot.

    Blocks while the restart lock is held.
    """
    async with request.app[RESTART_LOCK_NAME]:
        asyncio.get_event_loop().call_later(1, _do_restart)
    return web.json_response({'message': 'Restarting in 1s'},
                             status=200)


def build_health_endpoint(
        version_dict: Mapping[str, str])\
        -> Callable[[web.Request],
                    Coroutine[None, None, web.Response]]:
    """ Build a coroutine to serve /health that captures version info
    """
    async def health(request: web.Request) -> web.Response:
        return web.json_response(
            {
                'name': request.app[DEVICE_NAME_VARNAME],
                'updateServerVersion': version_dict.get(
                    'update_server_version', 'unknown'),
                'serialNumber': get_serial(),
                'apiServerVersion': version_dict.get(
                    'opentrons_api_version', 'unknown'),
                'smoothieVersion': 'unimplemented',
                'systemVersion': version_dict.get(
                    'buildroot_version', 'unknown'),
                'capabilities': {'buildrootUpdate': '/server/update/begin',
                                 'restart': '/server/restart'},
                'bootId': request.app[DEVICE_BOOT_ID_NAME]
            },
            headers={'Access-Control-Allow-Origin': '*'}
        )
    return health


def get_serial() -> str:
    """ Get the device serial number. """
    try:
        return Path('/var/serial').read_text().strip()
    except OSError:
        return 'unknown'


@lru_cache(maxsize=1)
def get_boot_id() -> str:
    # See the "/proc Interface" section in man(4) random.
    return Path('/proc/sys/kernel/random/boot_id').read_text().strip()
