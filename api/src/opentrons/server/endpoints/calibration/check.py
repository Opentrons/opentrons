from uuid import UUID
from aiohttp import web

from opentrons import types
from .session import CheckCalibrationSession, TipAttachError


async def get_session(request: web.Request, session) -> web.Response:
    """
    GET /calibration/check/session

    If a session exists, this endpoint will return the current status.

    Otherwise, this endpoint will return a 404 with links to the post request.
    """
    return web.json_response(status=200)


async def create_session(request):
    """
    POST /calibration/check/session

    If a session exists, this endpoint will return the current status.

    The status message is in the shape of:
    :py:class:`.models.CalibrationSessionStatus`
    """
    session_type = request.match_info['type']
    session_storage = request.app['com.opentrons.session_manager']
    current_session = session_storage.sessions.get(session_type)
    if not current_session:
        hardware = request.config_dict['com.opentrons.hardware']
        await CheckCalibrationSession.build(hardware)
        new_session = CheckCalibrationSession(hardware)
        session_storage.sessions[session_type] = new_session
        return web.json_response(status=201)
    else:
        router = request.app.router
        path = router.get('sessionExit')
        error_response = {
            "message": f"A {session_type} session exists."
                       "Please delete to proceed.",
            "links": {"deleteSession": str(path.url_for(type=session_type))}}
        return web.json_response(error_response, status=409)


async def delete_session(request: web.Request, session):
    """
    DELETE /calibration/check/session

    Endpoint to delete a session if it exists.
    """
    session_type = request.match_info['type']
    session_storage = request.app['com.opentrons.session_manager']

    await session.delete_session()
    del session_storage.sessions[session_type]
    response = {'message': f"Successfully deleted {session_type} session."}
    return web.json_response(response, status=200)


async def load_labware(request: web.Request, session) -> web.Response:
    session.load_labware_objects()
    return web.json_response(status=200)


async def move(request: web.Request, session) -> web.Response:
    req = await request.json()
    pipette = req.get("pipetteId")
    loc = req.get("location")
    position = {
        "locationId": UUID(loc["locationId"]),
        "offset": types.Point(*loc["offset"])}
    await session.move(UUID(pipette), position)
    return web.json_response(status=200)


async def jog(request: web.Request, session: 'CheckCalibrationSession'):
    req = await request.json()
    pipette = req.get("pipetteId")
    vector = req.get("vector")
    await session.jog(UUID(pipette), types.Point(*vector))
    return web.json_response(status=200)


async def pick_up_tip(
        request: web.Request, session: 'CheckCalibrationSession'):
    session_type = request.match_info['type']

    req = await request.json()
    pipette = UUID(req.get("pipetteId"))
    try:
        await session.pick_up_tip(pipette)
        return web.json_response(status=200)
    except TipAttachError:
        router = request.app.router
        invalidate = router.get('invalidateTip')
        drop = router.get('dropTip')
        error_response = {
            "message": "Tip is already attached.",
            "links": {
                "dropTip": str(drop.url_for(type=session_type)),
                "invalidateTip": str(invalidate.url_for(type=session_type))
            }
        }
        return web.json_response(error_response, status=409)


async def invalidate_tip(
        request: web.Request, session: 'CheckCalibrationSession'):
    session_type = request.match_info['type']

    req = await request.json()
    pipette = UUID(req.get("pipetteId"))
    try:
        await session.invalidate_tip(pipette)
        return web.json_response(status=200)
    except TipAttachError:
        router = request.app.router
        path = router.get('pickUpTip')
        error_response = {
            "message": f"No tip attached to {pipette} pipette.",
            "links": {
                "pickUpTip": str(path.url_for(type=session_type))}}
        return web.json_response(error_response, status=409)


async def drop_tip(request: web.Request, session: 'CheckCalibrationSession'):
    session_type = request.match_info['type']

    req = await request.json()
    pipette = UUID(req.get("pipetteId"))
    try:
        await session.return_tip(pipette)
        return web.json_response(status=200)
    except TipAttachError:
        router = request.app.router
        pickup = router.get('pickUpTip')
        error_response = {
            "message": f"No tip attached to {pipette} pipette.",
            "links": {
                "pickUpTip": str(pickup.url_for(type=session_type))}}
        return web.json_response(error_response, status=409)
