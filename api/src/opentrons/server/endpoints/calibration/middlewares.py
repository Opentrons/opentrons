import typing
import logging
from aiohttp import web
from aiohttp.web_urldispatcher import UrlDispatcher
from .session import CheckCalibrationSession, CalibrationCheckTrigger
from .models import CalibrationSessionStatus, LabwareStatus
from .constants import ALLOWED_SESSIONS, LabwareLoaded, TipAttachError
from .util import StateMachineError

MODULE_LOG = logging.getLogger(__name__)

TRIGGER_TO_PATH = {
    CalibrationCheckTrigger.load_labware: "loadLabware",
    CalibrationCheckTrigger.prepare_pipette: "preparePipette",
    CalibrationCheckTrigger.jog: "jog",
    CalibrationCheckTrigger.pick_up_tip: "pickUpTip",
    CalibrationCheckTrigger.confirm_tip_attached: "confirmTip",
    CalibrationCheckTrigger.invalidate_tip: "invalidateTip",
    CalibrationCheckTrigger.compare_point: "comparePoint",
    CalibrationCheckTrigger.go_to_next_check: "confirmStep",
    CalibrationCheckTrigger.exit: "sessionExit",
    # CalibrationCheckTrigger.reject_calibration: "reject_calibration",
    # CalibrationCheckTrigger.no_pipettes: "no_pipettes",
}


def _format_links(
        session: 'CheckCalibrationSession',
        potential_triggers: typing.Set[str],
        router: UrlDispatcher) -> typing.Dict:
    def _gen_triggers(triggers):
        links = {}
        for p in triggers:
            route_name = TRIGGER_TO_PATH.get(p)
            path = router.get(route_name, '')
            params = session.format_params(p)
            if path:
                url = str(path.url_for(type=session.session_type))
            else:
                url = path
            if url:
                links[route_name] = {'url': url, 'params': params}
        return links

    return {'links': _gen_triggers(potential_triggers)}


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

    current_state = session.current_state_name
    potential_triggers = session.get_potential_triggers()
    links = _format_links(session, potential_triggers, request.app.router)

    lw_status = session.labware_status.values()

    sess_status = CalibrationSessionStatus(
        instruments=session.pipette_status,
        currentStep=current_state,
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
    except (TipAttachError, LabwareLoaded, StateMachineError) as e:
        router = request.app.router
        if isinstance(e, TipAttachError):
            type = request.match_info['type']
            req = await request.json()

            error_response = _determine_error_message(
                request, router, type, req.get('pipetteId', ''))
        else:
            MODULE_LOG.exception("Calibration Check Exception: {}".format(e))
            potential_triggers = session.get_potential_triggers()
            links = _format_links(session, potential_triggers, router)
            error_response = {
                "message": "Labware Already Loaded.",
                **links}
        response = web.json_response(error_response, status=409)
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
        session = session_storage.sessions.get(session_type)
        return status_response(session, request, response)
