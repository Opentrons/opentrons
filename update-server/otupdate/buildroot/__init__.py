""" update-server implementation for buildroot systems """
import asyncio
import logging
import json
from typing import Mapping
from aiohttp import web

from . import constants, name_management

from . import config, control, update, ssh_key_management
from .util import HTTPVersionMismatchError, ERROR_CODES, SUPPORTED_VERSIONS

BR_BUILTIN_VERSION_FILE = '/etc/VERSION.json'
#: Location of the builtin system version

LOG = logging.getLogger(__name__)


@web.middleware
async def log_error_middleware(request, handler):
    minVersion = SUPPORTED_VERSIONS[0]
    maxVersion = SUPPORTED_VERSIONS[-1]
    try:
        resp = await handler(request)
    except HTTPVersionMismatchError as error:
        msg = error.message
        data = {
            "type": "error",
            "errorId": ERROR_CODES["unsupportedVersion"],
            "errorType": "unsupportedVersion",
            "message": msg,
            "supportedHttpApiVersions": {
                "minimum": minVersion, "maximum": maxVersion},
            "links": {}
        }
        # Client is trying to use a version higher than supported
        resp = web.json_response(data, status=406)
    except web.HTTPNotFound:
        LOG.exception("Exception handler for request {}".format(request))
        msg = "Request was not found at {}".format(request)
        data = {
            "type": "error",
            "errorId": ERROR_CODES["HTTPNotFound"],
            "errorType": "HTTPNotFound",
            "message": msg,
            "supportedHttpApiVersions": {
                "minimum": minVersion, "maximum": maxVersion},
            "links": {}
        }
        resp = web.json_response(data, status=404)
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
        f'Buildroot version:         '
        f'{version.get("buildroot_version", "unknown")}',
        f'\t(from git sha      '
        f'{version.get("buildroot_sha", "unknown")}',
        f'API version:               '
        f'{version.get("opentrons_api_version", "unknown")}',
        f'\t(from git sha      '
        f'{version.get("opentrons_api_sha", "unknown")}',
        f'Update server version:     '
        f'{version.get("update_server_version", "unknown")}',
        f'\t(from git sha      '
        f'{version.get("update_server_sha", "unknown")}',
        f'Smoothie firmware version: TODO'
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
