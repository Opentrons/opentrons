import os
import json
import logging
from aiohttp import web
from opentrons import robot, __version__

log = logging.getLogger(__name__)

# TODO(mc, 2018-02-22): this naming logic is copied instead of shared
#   from compute/scripts/anounce_mdns.py
NAME = 'opentrons-{}'.format(
    os.environ.get('RESIN_DEVICE_NAME_AT_INIT', 'dev'))


async def health(request: web.Request) -> web.Response:
    static_paths = ['/logs/serial.log', '/logs/api.log']
    res = {
        'name': NAME,
        'api_version': __version__,
        'fw_version': robot.fw_version,
        'logs': static_paths
    }
    return web.json_response(
        headers={'Access-Control-Allow-Origin': '*'},
        body=json.dumps(res))
