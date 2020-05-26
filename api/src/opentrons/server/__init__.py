#!/usr/bin/env python

import asyncio
import logging
import shutil
import tempfile
import traceback
import typing

from aiohttp import web

from opentrons.config import CONFIG
from opentrons.hardware_control.threaded_async_lock import ThreadedAsyncLock
from opentrons.api.routers import MainRouter
from opentrons.hardware_control import ThreadManager

from .rpc import RPCServer
from .http import HTTPServer, CalibrationRoutes

from opentrons.calibration.check.session import SessionManager as CalSessionManager
from .endpoints.calibration.middlewares import \
        session_middleware as cal_session_middleware

log = logging.getLogger(__name__)


@web.middleware
async def error_middleware(
        request: web.Request, handler: typing.Callable) -> web.Response:
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
# See: https://docs.aiohttp.org/en/stable/web.html#command-line-interface-cli
def init(hardware: ThreadManager = None,
         loop: asyncio.AbstractEventLoop = None):
    """
    Builds an application and sets up RPC and HTTP servers with it.

    :param loop: A specific aiohttp event loop to use. If not specified, the
                 server will use the default event loop.
    :param hardware: The hardware manager or hardware adapter to connect to.
                     If not specified, the server will use
                     :py:attr:`opentrons.hardware`
    """
    app = web.Application(middlewares=[error_middleware])
    app['com.opentrons.http'] = HTTPServer(app, CONFIG['log_dir'])
    app['com.opentrons.hardware'] = hardware
    app['com.opentrons.motion_lock'] = ThreadedAsyncLock()
    app['com.opentrons.rpc'] = RPCServer(
        app, MainRouter(
            hardware, lock=app['com.opentrons.motion_lock'], loop=loop))
    app['com.opentrons.response_file_tempdir'] = tempfile.mkdtemp()
    calibration_app = web.Application(middlewares=[cal_session_middleware])
    calibration_app['com.opentrons.http'] = CalibrationRoutes(calibration_app)
    calibration_app['com.opentrons.session_manager'] = CalSessionManager()
    app.add_subapp('/calibration/', calibration_app)

    app['calibration'] = calibration_app

    async def dispose_response_file_tempdir(app):
        temppath = app.get('com.opentrons.response_file_tempdir')
        if temppath:
            try:
                shutil.rmtree(temppath)
            except Exception:
                log.exception(f"failed to remove app temp path {temppath}")

    async def shutdown_hardware(app):
        if app['com.opentrons.hardware']:
            app['com.opentrons.hardware'].clean_up()

    app.on_shutdown.append(dispose_response_file_tempdir)
    app.on_shutdown.append(shutdown_hardware)
    app.on_shutdown.freeze()
    return app


def run(hardware: ThreadManager,
        hostname=None,
        port=None,
        path=None):
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

    web.run_app(init(hardware=hardware), host=hostname, port=port, path=path)
