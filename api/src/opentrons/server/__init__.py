#!/usr/bin/env python

import asyncio
import logging
import shutil
import tempfile
import traceback
import typing

from aiohttp import web
from aiohttp.web_urldispatcher import UrlDispatcher

from opentrons.config import CONFIG
from opentrons.hardware_control.threaded_async_lock import ThreadedAsyncLock

from .rpc import RPCServer
from .http import HTTPServer, CalibrationRoutes
from opentrons.api.routers import MainRouter
from opentrons.hardware_control import ThreadManager

from .endpoints.calibration.constants import ALLOWED_SESSIONS
from .endpoints.calibration.session import (
    SessionManager, CheckCalibrationSession)
from .endpoints.calibration.util import CalibrationCheckState
from .endpoints.calibration.models import (
    CalibrationSessionStatus, LabwareStatus)

log = logging.getLogger(__name__)


def _format_links(
        session: 'CheckCalibrationSession',
        next: CalibrationCheckState,
        router: UrlDispatcher) -> typing.Dict:
    if session.state_machine.requires_move(next):
        path = router.get('move', '')
    else:
        path = router.get(next.name, '')

    params = session.format_params(next.name)
    if path:
        url = str(path.url_for(type=session.session_type))
    else:
        url = path
    return {'links': {next.name: {'url': url, 'params': params}}}


def status_response(
        session: 'CheckCalibrationSession',
        request: web.Request,
        response: web.Response) -> web.Response:

    current = session.state_machine.current_state.name
    next = session.state_machine.next_state
    links = _format_links(session, next, request.app.router)

    lw_status = session.labware_status.values()

    sess_status = CalibrationSessionStatus(
        instruments=session.pipette_status,
        currentStep=current,
        nextSteps=links,
        labware=[LabwareStatus(**data) for data in lw_status])
    return web.json_response(text=sess_status.json(), status=response.status)


def no_session_error_response(start_url: str, type: str) -> web.Response:
    error_response = {
        "message": f"No {type} session exists. Please create one.",
        "links": {"createSession": {'url': start_url, 'params': {}}}}
    return web.json_response(error_response, status=404)


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


@web.middleware
async def session_middleware(request, handler):
    """
    Middleware used for the calibration sub-app. This includes all routes
    found in the :py:class:`.http:CalibrationRoutes` class.

    *Note* Does NOT include old deck calibration endpoints.
    """

    session_type = request.match_info['type']
    session_storage = request.app['com.opentrons.session_manager']

    if session_type not in ALLOWED_SESSIONS:
        message = f"Session of type {session_type} is not supported."
        return web.json_response(message, status=403)

    router = request.app.router
    start_url = str(router.get('sessionStart').url_for(type=session_type))
    session = session_storage.sessions.get(session_type)
    if start_url == request.path and request.method == 'POST':
        response = await handler(request)
    elif not session:
        response = no_session_error_response(start_url, session_type)
    else:
        response = await handler(request, session)

    if response.text:
        return response
    else:
        session = session_storage.sessions.get(session_type)
        return status_response(session, request, response)


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
    calibration_app = web.Application(middlewares=[session_middleware])
    calibration_app['com.opentrons.http'] = CalibrationRoutes(calibration_app)
    calibration_app['com.opentrons.session_manager'] = SessionManager()
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
