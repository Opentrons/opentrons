import typing
from uuid import UUID
from aiohttp import web
from aiohttp.web_urldispatcher import UrlDispatcher

from .util import CalibrationCheckState
from .session import CheckCalibrationSession
from .models import CalibrationSessionStatus, LabwareStatus, AttachedPipette

ALLOWED_SESSIONS = ['check']
TypeSession = typing.Tuple[str, typing.Optional[CheckCalibrationSession]]


def _fetch_type_and_session(request: web.Request) -> TypeSession:
    session_type = request.match_info['type']
    session_storage = request.app['com.opentrons.session_manager']
    session = session_storage.sessions.get(session_type)
    return session_type, session


def _format_links(
        session: 'CheckCalibrationSession',
        next: CalibrationCheckState,
        router: UrlDispatcher) -> typing.Dict:
    if session.state_machine.requires_move(next):
        path = router.get('move', '')
        params = session.format_move_params(next.name)
    else:
        path = router.get(next.name, '')
        params = {}
    if path:
        url = str(path.url_for(type=session.session_type))
    else:
        url = path
    return {'links': {next.name: {'url': url, 'params': params}}}


def _format_status(
        session: 'CheckCalibrationSession',
        router: UrlDispatcher) -> 'CalibrationSessionStatus':
    pips = session.pipette_status
    # pydantic restricts dictionary keys that can be evaluated. Since
    # the session pipettes dictionary has a UUID as a key, we must first
    # convert the UUID to a hex string.
    instruments = {
        token.hex: AttachedPipette(**data)
        for token, data in pips.items() if token}
    current = session.state_machine.current_state.name
    next = session.state_machine.next_state
    links = _format_links(session, next, router)

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
        await hardware.set_lights(rails=True)
        await hardware.home()
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
    session_type, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    session.load_labware_objects()
    response = _format_status(session, request.app.router)
    return web.json_response(text=response.json(), status=200)


async def move(request: web.Request) -> web.Response:
    session_type, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    req = await request.json()
    pipette = req.get("pipetteId")
    loc = req.get("location")
    position = {"locationId": UUID(loc["locationId"]), "offset": loc["offset"]}
    await session.move(UUID(pipette), position)
    response = _format_status(session, request.app.router)
    return web.json_response(text=response.json(), status=200)


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
    await session.jog(UUID(pipette), vector)
    response = _format_status(session, request.app.router)
    return web.json_response(text=response.json(), status=200)


async def pick_up_tip(request):
    session_type, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    req = await request.json()
    pipette = UUID(req.get("pipetteId"))
    if not session.get_pipette(pipette).has_tip:
        await session.pick_up_tip(pipette)
        response = _format_status(session, request.app.router)
        return web.json_response(text=response.json(), status=200)
    else:
        invalidate_path = f"/calibration/{session_type}/session/invalidateTip"
        error_response = {
            "message": "Tip is already attached.",
            "links": {
                "dropTip": f"/calibration/{session_type}/session/dropTip",
                "invalidateTip": invalidate_path
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
    pipette = UUID(req.get("pipetteId"))
    if session.get_pipette(pipette).has_tip:
        session.invalidate_tip(pipette)
        response = _format_status(session, request.app.router)
        return web.json_response(text=response.json(), status=200)
    else:
        error_response = {
            "message": f"No tip attached to {pipette} pipette.",
            "links": {
                "pickUpTip": f"/calibration/{session_type}/session/pickUpTip"}}
        return web.json_response(error_response, status=409)


async def drop_tip(request):
    session_type, session = _fetch_type_and_session(request)
    if not session:
        error_response = {
            "message": f"No {session_type} session exists. Please create one.",
            "links": {"createSession": f"/calibration/{session_type}/session"}}
        return web.json_response(error_response, status=404)
    req = await request.json()
    pipette = UUID(req.get("pipetteId"))
    if session.get_pipette(pipette).has_tip:
        await session.return_tip(pipette)
        response = _format_status(session, request.app.router)
        return web.json_response(text=response.json(), status=200)
    else:
        error_response = {
            "message": f"No tip attached to {pipette} pipette.",
            "links": {
                "pickUpTip": f"/calibration/{session_type}/session/pickUpTip"}}
        return web.json_response(error_response, status=409)
