import inspect
import json
import logging
from aiohttp import web
from opentrons import __version__, config

log = logging.getLogger(__name__)


async def health(request: web.Request) -> web.Response:
    static_paths = ['/logs/serial.log', '/logs/api.log']
    # This conditional handles the case where we have just changed the
    # use protocol api v2 feature flag, so it does not match the type
    # of hardware we're actually using.
    fw_version = request.app['com.opentrons.hardware'].fw_version
    if inspect.iscoroutine(fw_version):
        fw_version = await fw_version

    res = {
        'name': config.name(),
        'api_version': __version__,
        'fw_version': fw_version,
        'logs': static_paths,
        'system_version': config.OT_SYSTEM_VERSION
    }
    return web.json_response(
        headers={'Access-Control-Allow-Origin': '*'},
        body=json.dumps(res))
