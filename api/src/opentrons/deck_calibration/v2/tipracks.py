"""
opentrons.calibration.v2.tipracks: Endpoints for managing and using tipracks

Here you can find the endpoints to load labware into the session, pick
up tips, and in general do everything under {prefix}/tipracks
"""
import functools
import json
import logging

from aiohttp import web

from opentrons import types
from opentrons.protocol_api import labware
from .session import CalibrationSession, from_rq, require_session
from . import prefix_from_rq


_TIPRACK_Z_SAFETY_MM = 10
MODULE_LOG = logging.getLogger(__name__)


def _require_tiprack(endpoint):
    """
    Decorator requiring a valid loaded tiprack in the {tiprack_id} url match

    If the tiprack is found it will be provided to the endpoint as a tiprack=
    keyword argument.

    If not slot is found, respond with a json response with status code 404
    Not Found and a bdoy with an error and message key.
    """

    @functools.wraps(endpoint)
    async def handler(request: web.Request, *args, **kwargs):
        tr_name = request.match_info['tiprack_id']
        if 'session' in kwargs:
            session: CalibrationSession = kwargs['session']
        else:
            session = from_rq(request)
        try:
            tiprack = session.labware[tr_name]
        except KeyError:
            MODULE_LOG.error('_require_tiprack: Bd labware name {tr_name}')
            return web.json_response(
                status=404,
                data={'error': 'no-such-labware',
                      'message': 'No such labware attached'})
        kwargs['tiprack'] = tiprack
        return await endpoint(request, *args, *kwargs)


@require_session
@_require_tiprack
async def move_to(
        request: web.Request,
        session: CalibrationSession,
        tiprack: labware.Labware) -> web.Response:
    """
    POST /calibration/v2/tiprack/{tiprack_id}/move_to Move to a tiprack
    (for calibration)

    json body (optional): {"mount": "left" or "right"} If not specified, use
    whatever the active pipette is (see /calibration/v2/mount/{mount}/activate)
    If the specified mount is not the activated mount, this mount will be
    activated (implicitly homing the other one).

    This moves the specified pipette to near well 1 of the specified labware
    """
    try:
        body = await request.json()
        which = types.Mount[body['mount'].upper()]
    except (json.JSONDecodeError, KeyError):
        which = session.active_mount

    await session.set_active_mount(which)
    await session.hw.move_to(session.active_mount,
                             tiprack.wells()[0].top(_TIPRACK_Z_SAFETY_MM))
    pref = prefix_from_rq(request)
    status = await session.status(pref)
    tiprack_url = request.match['tiprack_id']
    mount_name = session.active_mount.name.lower()
    MODULE_LOG.info(
        f"tipracks.move_to: {mount_name} -> {repr(tiprack)}")
    actions = {
        'jog': pref + f'jog',
        'try_pick_up': pref + f'tiprack/{tiprack_url}/try_pick_up'
    }
    return web.json_response(
        status=200,
        data={'message':
              f'Moved {mount_name} pipette to well 0 of {repr(tiprack)}',
              'status': status,
              'actions': actions})


@require_session
@_require_tiprack
async def try_pick_up(
        request: web.Request,
        session: CalibrationSession,
        tiprack: labware.Labware) -> web.Response:
    """
    POST /calibration/v2/tiprack/{tiprack_id}/try_pick_up Try to pick up
    a tip from the given tiprack, assuming the pipette has been correctly
    located relative to it by prior user action. Do not, at least for now,
    consider the pipette to have a tip attached.

    Uses the active mount.
    """
    await session._hw.pick_up_tip(session.active_mount, tiprack.tip_length)
    session._hw.remove_tip(session.set_active_mount)
    mount_name = session.active_mount.name.lower()
    prefix = prefix_from_rq(request)
    status = await session.status(prefix)
    tiprack_url = request.match['tiprack_id']
    MODULE_LOG.info(f'tipracks.try_pick_up: {mount_name} from {repr(tiprack)}')
    return web.json_response(
        status=200,
        data={'message': f'Tried to pick up tip with mount {mount_name}',
              'status': status,
              'actions': {
                  'confirm': prefix + f'tiprack/{tiprack_url}/confirm_pick_up',
                  'try_pick_up': prefix + f'tiprack/{tiprack_url}/try_pick_up'
              }})


@require_session
@_require_tiprack
async def confirm_pick_up(
        request: web.Request,
        session: CalibrationSession,
        tiprack: labware.Labware) -> web.Response:
    """
    POST /calibration/v2/tiprack/{tiprack_id}/confirm_pick_up Confirm that
    the previous call to try_pick_up succeeded in picking up a tip.
    """
    tiprack.use_tips(
        0, session._hw.attached_instruments[session.active_mount]['channels'])
    session._hw.add_tip(session.active_mount, tiprack.tip_length)
    pos = await session._hw.gantry_position(session.active_mount)
    delta = pos - tiprack.wells()[0].top().point
    tiprack.set_calibration(delta)
    prefix = prefix_from_rq(request)
    status = await session.status(prefix)
    mount_name = session.active_mount.name.lower()
    MODULE_LOG.info(
        f'tipracks.confirm_pick_up: {mount_name} from {repr(tiprack)}: '
        f'{delta}')
    return web.json_response(
        status=200,
        data={'message':
              f'Confirmed tip pickup, loaded calibration for {repr(tiprack)}',
              'status': status,
              'actions': {
                  'start_attitude_flow': '',
                  'start_offset_flow': '',
                  'return_tip': prefix + f'mount/{mount_name}/return_tip'
              }})
