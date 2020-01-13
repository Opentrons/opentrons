import inspect
import json
import logging
from aiohttp import web
from ..util import http_version
from opentrons import __version__, config, protocol_api, protocols

log = logging.getLogger(__name__)

@http_version(0, 0)
async def health(request: web.Request) -> web.Response:
    static_paths = ['/logs/serial.log', '/logs/api.log']
    # This conditional handles the case where we have just changed the
    # use protocol api v2 feature flag, so it does not match the type
    # of hardware we're actually using.
    fw_version = request.app['com.opentrons.hardware'].fw_version
    if inspect.iscoroutine(fw_version):
        fw_version = await fw_version

    if config.feature_flags.use_protocol_api_v2():
        max_supported = protocol_api.MAX_SUPPORTED_VERSION
    else:
        max_supported = protocols.types.APIVersion(1, 0)
    res = {
        'name': config.name(),
        'api_version': __version__,
        'fw_version': fw_version,
        'logs': static_paths,
        'system_version': config.OT_SYSTEM_VERSION,
        'protocol_api_version': list(max_supported)
    }
    return web.json_response(
        headers={'Access-Control-Allow-Origin': '*'},
        body=json.dumps(res))
