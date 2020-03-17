import json
from aiohttp import web
from aiohttp.web_urldispatcher import UrlDispatcher

from .session import CalibrationSession
from .models import CalibrationSessionStatus


def _format_status(
        session: 'CalibrationSession',
        router: UrlDispatcher,
        pipette_id: str = None) -> 'CalibrationSessionStatus':
    pips = session._pipettes
    # pydantic restricts dictionary keys that can be evaluated. Since
    # the session pipettes dictionary has a UUID as a key, we must first
    # convert the UUID to a hex string.
    instruments = {token.hex: data for token, data in pips.items() if token}
    current = session.state_machine.current_state.name
    next = session.state_machine.next_state(current).name
    path = router.get(next, '')
    if path:
        url = path.url_for()
    else:
        url = path
    links = {'links': {next: url}}
    token = session.token
    status = CalibrationSessionStatus(
        instruments=instruments,
        activeInstrument=pipette_id,
        currentStep=current,
        nextSteps=links,
        sessionToken=token)
    return status


async def get_current_session(request):
    """
    GET /calibration/check/session

    If a session exists, this endpoint will return the current status.

    The status message is in the shape of:
    :py:class:`.models.CalibrationSessionStatus`

    See the model above for more information.
    """
    session_type = request.match_info['type']
    pip_id = request.match_info['id']
    session_storage = request.app['com.opentrons.session_manager']
    current_session = session_storage.sessions.get(session_type)
    if not current_session:
        response = {'message': f'A {session_type} session does not exist.'}
        return web.json_response(response, status=404)
    else:
        response = _format_status(current_session, request.app.router, pip_id)
        serialize = response.json()
        return web.json_response(json.loads(serialize), status=200)


async def create_session(request):
    """
    POST /calibration/check/session

    Endpoint to create a sessions if it does not exist. Otherwise, acts
    like GET /calibration/check/session.
    """
    session_type = request.match_info['type']
    session_storage = request.app['com.opentrons.session_manager']
    current_session = session_storage.sessions.get(session_type)
    if not current_session:
        hardware = request.app['com.opentrons.hardware']
        await hardware.cache_instruments()
        new_session = CalibrationSession(hardware)
        session_storage.sessions[session_type] = new_session
        response = _format_status(new_session, request.app.router)
        # Ugly work-around for serializing UUIDs and Axis types. See
        # models.py for further information.
        serialize = response.json()
        return web.json_response(json.loads(serialize), status=201)
    else:
        response = _format_status(current_session, request.app.router)
        serialize = response.json()
        return web.json_response(json.loads(serialize), status=200)


async def delete_session(request):
    """
    DELETE /calibration/check/session

    Endpoint to delete a session if it exists.
    """
    session_type = request.match_info['type']
    session_storage = request.app['com.opentrons.session_manager']
    current_session = session_storage.sessions.get(session_type)
    if not current_session:
        response = {'message': f'A {session_type} session does not exist.'}
        return web.json_response(response, status=404)
    else:
        await current_session.hardware.home()
        del session_storage.sessions[session_type]
        return web.json_response(status=200)
