import typing
from aiohttp import web
from aiohttp.web_urldispatcher import UrlDispatcher
from .session import CheckCalibrationSession, CalibrationCheckTrigger, CalibrationException
from .models import CalibrationSessionStatus, LabwareStatus, AttachedPipette
from .constants import ALLOWED_SESSIONS
from .util import StateMachineError


TRIGGER_TO_PATH = {
    CalibrationCheckTrigger.load_labware: "loadLabware",
    CalibrationCheckTrigger.prepare_pipette: "preparePipette",
    CalibrationCheckTrigger.jog: "jog",
    CalibrationCheckTrigger.pick_up_tip: "pickUpTip",
    CalibrationCheckTrigger.confirm_tip_attached: "confirmTip",
    CalibrationCheckTrigger.invalidate_tip: "invalidateTip",
    CalibrationCheckTrigger.confirm_step: "confirmStep",
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


def status_response(
        session: 'CheckCalibrationSession',
        request: web.Request,
        response: web.Response) -> web.Response:

    current_state = session.current_state_name
    potential_triggers = session.get_potential_triggers()
    links = _format_links(session, potential_triggers, request.app.router)

    lw_status = session.labware_status.values()

    instruments = {
        str(k): AttachedPipette(model=v.model,
                                name=v.name,
                                tip_length=v.tip_length,
                                has_tip=v.has_tip,
                                tiprack_id=v.tiprack_id)
        for k, v in session.pipette_status().items()
    }

    sess_status = CalibrationSessionStatus(
        instruments=instruments,
        currentStep=current_state,
        nextSteps=links,
        labware=[LabwareStatus(alternatives=data.alternatives,
                               slot=data.slot,
                               id=data.id,
                               forPipettes=data.forPipettes,
                               loadName=data.loadName,
                               namespace=data.namespace,
                               version=data.version) for data in lw_status])
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
    except (CalibrationException, StateMachineError) as e:
        router = request.app.router
        potential_triggers = session.get_potential_triggers()
        links = _format_links(session, potential_triggers, router)
        error_response = {
            "message": str(e),
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
