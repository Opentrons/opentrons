""" update-server implementation for buildroot systems """
import asyncio
import logging
import json
from typing import Mapping
from aiohttp import web

from . import constants, name_management

from . import config, control, update, ssh_key_management


BR_BUILTIN_VERSION_FILE = '/etc/VERSION.json'
#: Location of the builtin system version

LOG = logging.getLogger(__name__)


@web.middleware
async def log_error_middleware(request, handler):
    try:
        resp = await handler(request)
    except Exception:
        LOG.exception(f"Exception serving {request.method} {request.path}")
        raise
    return resp


def get_version(version_file: str) -> Mapping[str, str]:
    LOG.debug(f"Loading version file {version_file}")
    return json.load(open(version_file, 'r'))


def get_app(system_version_file: str = None,
            config_file_override: str = None,
            name_override: str = None,
            loop: asyncio.AbstractEventLoop = None) -> web.Application:
    """ Build and return the aiohttp.web.Application that runs the server

    The params can be overloaded for testing.
    """
    if not system_version_file:
        system_version_file = BR_BUILTIN_VERSION_FILE

    version = get_version(system_version_file)
    name = name_override or name_management.get_name()
    config_obj = config.load(config_file_override)

    LOG.info("Setup: " + '\n\t'.join([
        f'Device name: {name}',
        'Buildroot version:         '
        f'{version.get("buildroot_version", "unknown")}',
        '\t(from git sha      '
        f'{version.get("buildroot_sha", "unknown")}',
        'API version:               '
        f'{version.get("opentrons_api_version", "unknown")}',
        '\t(from git sha      '
        f'{version.get("opentrons_api_sha", "unknown")}',
        'Update server version:     '
        f'{version.get("update_server_version", "unknown")}',
        '\t(from git sha      '
        f'{version.get("update_server_sha", "unknown")}',
        'Smoothie firmware version: TODO'
    ]))

    if not loop:
        loop = asyncio.get_event_loop()

    app = web.Application(middlewares=[log_error_middleware])
    app[config.CONFIG_VARNAME] = config_obj
    app[constants.RESTART_LOCK_NAME] = asyncio.Lock()
    app[constants.DEVICE_NAME_VARNAME] = name
    app.router.add_routes([
        web.get('/server/update/health',
                control.build_health_endpoint(version)),
        web.post('/server/update/begin', update.begin),
        web.post('/server/update/cancel', update.cancel),
        web.get('/server/update/{session}/status', update.status),
        web.post('/server/update/{session}/file', update.file_upload),
        web.post('/server/update/{session}/commit', update.commit),
        web.post('/server/restart', control.restart),
        web.get('/server/ssh_keys', ssh_key_management.list_keys),
        web.post('/server/ssh_keys', ssh_key_management.add),
        web.delete('/server/ssh_keys', ssh_key_management.clear),
        web.delete('/server/ssh_keys/{key_md5}', ssh_key_management.remove),
        web.post('/server/name', name_management.set_name_endpoint),
        web.get('/server/name', name_management.get_name_endpoint),
    ])
    return app
