"""
otupdate.buildroot.control: non-update-specific endpoints for otupdate

This has endpoints like /restart that aren't specific to update tasks.
"""
import asyncio
import logging
import subprocess
from typing import Callable, Coroutine, Mapping

from aiohttp import web

from .constants import RESTART_LOCK_NAME


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
        version_dict: Mapping[str, str],
        device_name: str) -> Callable[[web.Request],
                                      Coroutine[None, None, web.Response]]:
    """ Build a coroutine to serve /health that captures version info
    """
    async def health(request: web.Request) -> web.Response:
        return web.json_response(
            {
                'name': device_name,
                'updateServerVersion': version_dict.get(
                    'update_server_version', 'unknown'),
                'apiServerVersion': version_dict.get(
                    'opentrons_api_version', 'unknown'),
                'smoothieVersion': 'unimplemented',
                'systemVersion': version_dict.get(
                    'buildroot_version', 'unknown')
            }
        )
    return health
