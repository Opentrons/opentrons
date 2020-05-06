import json
import logging
import pkgutil
from aiohttp import web
from opentrons import __version__, config, protocol_api

log = logging.getLogger(__name__)


async def health(request: web.Request) -> web.Response:
    res = {
        'name': config.name(),
        'api_version': __version__,
        'fw_version': request.app['com.opentrons.hardware'].fw_version,
        'board_revision': request.app['com.opentrons.hardware'].board_revision,
        'logs': ['/logs/serial.log', '/logs/api.log'],
        'system_version': config.OT_SYSTEM_VERSION,
        'protocol_api_version': list(protocol_api.MAX_SUPPORTED_VERSION),
        'links': {
            'apiLog': '/logs/api.log',
            'serialLog': '/logs/serial.log',
            'apiSpec': '/openapi'
        }
    }
    return web.json_response(
        headers={'Access-Control-Allow-Origin': '*'},
        body=json.dumps(res))


async def get_openapi_spec(request: web.Request) -> web.Response:
    spec = json.loads(pkgutil.get_data(  # type: ignore
        'opentrons', 'server/openapi.json'))
    return web.json_response(spec, status=200)
