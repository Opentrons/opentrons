import typing
from aiohttp import web
from aiohttp.web_urldispatcher import UrlDispatcher

from .session import CheckCalibrationSession
from .models import CalibrationSessionStatus, LabwareStatus

ALLOWED_SESSIONS = ['check']
TypeSession = typing.Tuple[str, typing.Optional[CheckCalibrationSession]]


def _fetch_type_and_session(request: web.Request) -> TypeSession:
    session_type = request.match_info['type']
    session_storage = request.app['com.opentrons.session_manager']
    session = session_storage.sessions.get(session_type)
    return session_type, session


def _format_status(
        session: 'CheckCalibrationSession',
        router: UrlDispatcher) -> 'CalibrationSessionStatus':
    pips = session.pipette_status
    # pydantic restricts dictionary keys that can be evaluated. Since
    # the session pipettes dictionary has a UUID as a key, we must first
    # convert the UUID to a hex string.
    instruments = {token.hex: data for token, data in pips.items() if token}
    current = session.state_machine.current_state.name
    next = session.state_machine.next_state
    if next:
        path = router.get(next.name, '')
        if path:
            url = str(path.url_for(type=session.session_type))
        else:
            url = path
        links = {'links': {next.name: url}}
    else:
        links = {'links': {}}
    lw_status = session.labware_status.values()
    status = CalibrationSessionStatus(
        instruments=instruments,
        currentStep=current,
        nextSteps=links,
        labware=[LabwareStatus(**data) for data in lw_status])
    return status


async def get_session(request: web.Request) -> web.Response:
    """
    GET /calibration/check/session

    If a session exists, this endpoint will return the current status.

    Otherwise, this endpoint will return a 404 with links to the post request.
    """
    session_type = request.match_info['type']
    session_storage = request.app['com.opentrons.session_manager']
    current_session = session_storage.sessions.get(session_type)
    if current_session:
        response = _format_status(current_session, request.app.router)
        return web.json_response(text=response.json(), status=200)
    else:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)


async def create_session(request):
    """
    POST /calibration/check/session

    If a session exists, this endpoint will return the current status.

    The status message is in the shape of:
    :py:class:`.models.CalibrationSessionStatus`
    """
    session_type = request.match_info['type']
    if session_type not in ALLOWED_SESSIONS:
        message = f"Session of type {session_type} is not supported."
        return web.json_response(message, status=403)

    session_storage = request.app['com.opentrons.session_manager']
    current_session = session_storage.sessions.get(session_type)
    if not current_session:
        hardware = request.app['com.opentrons.hardware']
        await hardware.cache_instruments()
        new_session = CheckCalibrationSession(hardware)
        session_storage.sessions[session_type] = new_session

        response = _format_status(new_session, request.app.router)
        return web.json_response(text=response.json(), status=201)
    else:
        error_response = {
            "message": f"A {session_type} session exists."
                       "Please delete to proceed.",
            "links": {"deleteSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=409)


async def delete_session(request):
    """
    DELETE /calibration/check/session

    Endpoint to delete a session if it exists.
    """
    session_type = request.match_info['type']
    session_storage = request.app['com.opentrons.session_manager']
    current_session = session_storage.sessions.get(session_type)
    if not current_session:
        response = {"message": f"A {session_type} session does not exist."}
        return web.json_response(response, status=404)
    else:
        await current_session.delete_session()
        del session_storage.sessions[session_type]
        response = {'message': f"Successfully deleted {session_type} session."}
        return web.json_response(response, status=200)


async def load_labware(request: web.Request) -> web.Response:
    _, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    response = _format_status(session, request.app.router)
    return web.json_response(response, status=200)


async def move(request: web.Request) -> web.Response:
    session_type, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    req = await request.json()
    pipette = req.get("pipetteId")
    position = req.get("location")

    session.move(pipette, position)
    response = _format_status(session, request.app.router)
    return web.json_response(response, status=200)


async def jog(request):
    session_type, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    req = await request.json()
    pipette = req.get("pipetteId")
    vector = req.get("vector")
    session.jog(pipette, vector)
    response = _format_status(session, request.app.router)
    return web.json_response(response, status=200)


async def pick_up_tip(request):
    session_type, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    req = await request.json()
    pipette = req.get("pipetteId")
    vector = req.get("vector")
    try:
        session.pick_up_tip(pipette)
        response = _format_status(session, request.app.router)
        return web.json_response(response, status=200)
    except AssertionError:
        error_response = {
            "message": "Tip is already attached.",
            "links": {
                "dropTip": f"/calibration/{session_type}/session/dropTip",
                "invalidateTip": f"/calibration/{session_type}/session/invalidateTip"
            }
        }
        return web.json_response(error_response, status=409)


async def invalidate_tip(request):
    session_type, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    req = await request.json()
    pipette_id = req.get("pipetteId")
    session.invalidate_tip(pipette_id)
    response = _format_status(session, request.app.router)
    return web.json_response(response, status=200)


async def drop_tip(request):
    session_type, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    req = await request.json()
    pipette = req.get("pipetteId")
    session.return_tip(pipette)
    response = _format_status(session, request.app.router)
    return web.json_response(response, status=200)
