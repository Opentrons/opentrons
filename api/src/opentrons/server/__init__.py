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

from .endpoints.calibration.constants import (
    ALLOWED_SESSIONS, LabwareLoaded, TipAttachError)
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


def _determine_error_message(
        request: web.Request,
        router: UrlDispatcher, type: str, pipette: str) -> typing.Dict:
    """
    Helper function to determine the exact error messaging for any
    TipAttachError thrown by a calibration session.
    """
    invalidate = router['invalidateTip'].url_for(type=type)
    drop = router['dropTip'].url_for(type=type)
    pickup = router['pickUpTip'].url_for(type=type)
    if request.path == pickup:
        msg = f"Tip is already attached to {pipette} pipette."
        links = {
            "dropTip": str(drop),
            "invalidateTip": str(invalidate)
        }
    elif request.path == drop or request.path == invalidate:
        msg = f"No tip attached to {pipette} pipette."
        links = {"pickUpTip": str(pickup)}
    else:
        msg = "Conflict with server."
        links = {}
    return {"message": msg, "links": links}


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


async def misc_error_handling(
        request: web.Request,
        session: 'CheckCalibrationSession',
        handler: typing.Callable) -> web.Response:
    """
    Miscellaneous error handling for calibration sessions. Specifically, it
    handles all responses that might require a 409 error response.
    """
    try:
        response = await handler(request, session)
    except (TipAttachError, LabwareLoaded) as e:
        router = request.app.router
        if isinstance(e, TipAttachError):
            type = request.match_info['type']
            req = await request.json()

            error_response = _determine_error_message(
                request, router, type, req.get('pipetteId', ''))
        else:
            next = session.state_machine.next_state
            links = _format_links(session, next, router)
            error_response = {
                "message": "Labware Already Loaded.",
                **links}
        response = web.json_response(error_response, status=409)
    return response


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


@web.middleware
async def session_middleware(
        request: web.Request, handler: typing.Callable) -> web.Response:
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
        response = await misc_error_handling(request, session, handler)

    if response.text:
        return response
    else:
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
