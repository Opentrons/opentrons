#!/usr/bin/env python

import logging
import traceback
from opentrons.util import environment
from aiohttp import web
from .rpc import RPCServer
from .http import HTTPServer
from opentrons.api.routers import MainRouter

log = logging.getLogger(__name__)
log_file_path = environment.get_path('LOG_DIR')


@web.middleware
async def error_middleware(request, handler):
    try:
        response = await handler(request)
    except web.HTTPNotFound:
        log.exception("Exception handler for request {}".format(request))
        data = {
            'message': 'File was not found at {}'.format(request)
        }
        response = web.json_response(data, status=404)
    except Exception as e:
        log.exception("Exception in handler for request {}".format(request))
        data = {
            'message': 'An unexpected error occured - {}'.format(e),
            'traceback': traceback.format_exc()
        }
        response = web.json_response(data, status=500)

    return response


# Support for running using aiohttp CLI.
# See: https://docs.aiohttp.org/en/stable/web.html#command-line-interface-cli  # NOQA
def init(loop=None):
    """
    Builds an application and sets up RPC and HTTP servers with it
    """

    app = web.Application(loop=loop, middlewares=[error_middleware])
    app['opentronsRpc'] = RPCServer(app, MainRouter())
    app['opentronsHttp'] = HTTPServer(app, log_file_path)

    return app


def run(hostname=None, port=None, path=None):
    """
    The arguments are not all optional. Either a path or hostname+port should
    be specified; you have to specify one.
    """
    if path:
        log.debug("Starting Opentrons server application on {}".format(
            path))
        hostname, port = None, None
    else:
        log.debug("Starting Opentrons server application on {}:{}".format(
            hostname, port))
        path = None

    web.run_app(init(), host=hostname, port=port, path=path)
