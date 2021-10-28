""" update-server implementation for openembedded systems """
import asyncio
import logging
import json
from aiohttp import web

from otupdate.common import config, constants, control, ssh_key_management, name_management
from . import update, update_actions

LOG = logging.getLogger(__name__)


@web.middleware
async def log_error_middleware(request, handler):
    try:
        resp = await handler(request)
    except Exception:
        LOG.exception(f"Exception serving {request.method} {request.path}")
        raise
    return resp

def get_version_dict(version_file: Optional[str]) -> Mapping[str, str]:
    version = {}
    if version_file:
        try:
            version = json.load(open(version_file))
        except Exception:
            logging.exception("Could not load version, using defaults")
    return version

def get_app(system_version_file: str = None,
            config_file_override: str = None,
            name_override: str = None,
            boot_id_override: str = None,
            loop: asyncio.AbstractEventLoop = None) -> web.Application:
    """ Build and return the aiohttp.web.Application that runs the server

    """

    version = get_version_dict(system_version_file)

    if not loop:
        loop = asyncio.get_event_loop()

    config_obj = config.load(config_file_override)

    app = web.Application(middlewares=[log_error_middleware])
    name = name_override or name_management.get_name()
    boot_id = boot_id_override or control.get_boot_id()
    app[config.CONFIG_VARNAME] = config_obj
    app[constants.RESTART_LOCK_NAME] = asyncio.Lock()
    app[constants.DEVICE_BOOT_ID_NAME] = boot_id
    app[constants.DEVICE_NAME_VARNAME] = name
    update_actions.OT3UpdateActions.build_and_insert(app)

    LOG.info("Setup: " + "\n\t".join([
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
    ]))
    app.router.add_routes([
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
