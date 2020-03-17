from aiohttp import web
from aiohttp.web_urldispatcher import UrlDispatcher

from .session import CalibrationSession
from .models import (CalibrationCheckStates,
                     CalibrationSessionStatus,
                     CalibrationErrorStates)


def _format_status(
        session: 'CalibrationSession',
        router: UrlDispatcher,
        pipette_id: str = None) -> 'CalibrationSessionStatus':
    pips = session._pipettes
    instruments = {token.hex: data for token, data in pips.items() if token}
    current = session.state_machine.current_state
    next = session.state_machine.next_state(current.value).name
    path = router.get(next, '')
    if path:
        url = path.url_for()
    else:
        url = path
    links = {'links': {next: url}}
    token = session.token.hex
    status = CalibrationSessionStatus(
        instruments=instruments,
        activeInstrument=pipette_id,
        currentStep=current.name,
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
        return web.json_response(response.dict(), status=200)


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
        # There is a new session created, we must cache currently attached
        # instruments and return them.
        hardware = request.app['com.opentrons.hardware']
        await hardware.cache_instruments()
        new_session = CalibrationSession(
            hardware, CalibrationCheckStates, CalibrationErrorStates)
        session_storage.sessions[session_type] = new_session
        response = _format_status(new_session, request.app.router)
        return web.json_response(response.dict(), status=201)
    else:
        response = _format_status(current_session, request.app.router)
        return web.json_response(response.dict(), status=200)


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
