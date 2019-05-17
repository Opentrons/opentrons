""" Endpoints and session management for system calibration

This module has the code necessary for calibration to map the attitude
of the deck relative to the gantry
"""

from json import JSONDecodeError
from typing import Callable, Dict, Optional

from aiohttp import web

from opentrons import types
from opentrons.hardware_control import types as hwtypes, API

from . import dots_set, prefix_from_rq, session

_COLLISION_SAFETY_OFFSET_MM = 10


def _get_tip_probe_base(
        hw: API) -> types.Point:
    center = hw.config.tip_probe.center
    return types.Point(
        *center._replace(z=center.z + _COLLISION_SAFETY_OFFSET_MM))


def _get_deck_cal(which: int) -> types.Point:
    point = dots_set()[which]
    return types.Point(point[0],
                       point[1],
                       _COLLISION_SAFETY_OFFSET_MM)


# The keypoints map associates common names with (callables providing)
# absolute deck coordinates. These are callables so they will work
# with changing definitions, e.g. changing the robot config or feature flags
KEYPOINTS: Dict[str, Callable[[API], types.Point]] = {
    'deck-cal-slot-1': lambda _hw: _get_deck_cal(0),
    'deck-cal-slot-3': lambda _hw: _get_deck_cal(1),
    'deck-cal-slot-7': lambda _hw: _get_deck_cal(2),
    'tip-probe-z': _get_tip_probe_base
}


class AttitudeEstimationFlow:
    """ Data storage for the deck/gantry attitude estimation flow

    This flow calculates the rotation matrix that brings the assumed
    locations of the deck calibration points to the user-calibrated
    locations of the deck calibration points. It also provides a
    vector between the two point sets when using the pipette used to
    drive the flow.

    The rotation is saved separately from the vector.
    """

    def __init__(self) -> None:
        self._point_locations: Dict[str, Optional[types.Point]] = {
            'deck-cal-slot-1': None,
            'deck-cal-slot-3': None,
            'deck-cal-slot-7': None,
        }

    def __next__(self) -> str:
        for key in self._point_locations:
            if not self._point_locations[key]:
                return '/calibration/v2/confirm_keypoint_location'


class PipetteOffsetEstimationFlow:
    """ Data storage for the pipette/gantry offset estimation flow

    This flow calculates the vector between the nominal position of
    a pipette's tip critical point and the user-calibrated position of the
    pipette's tip critical point.
    """
    pass


async def move_to_tiprack(
        session: session.CalibrationSession,
        slot: str,
        mount: types.Mount,
        cp: hwtypes.CriticalPoint = None) -> web.Response:
    lw = session.deck[slot]
    if not lw:
        return web.json_response(
            status=400,
            data={'error': 'invalid-slot',
                  'message': f'slot {slot} has no tiprack'})
    dest_well = lw.next_tip()
    if not dest_well:
        return web.json_response(
            status=500,
            data={'error': 'no-tips',
                  'message': f'No tips left on {repr(lw)}'})
    dest = dest_well.top(z=_COLLISION_SAFETY_OFFSET_MM)
    await session.hardware.move_to(
        mount, dest.point, cp)


async def move_to_keypoint(
        session: session.CalibrationSession,
        keypoint: str,
        mount: types.Mount,
        cp: hwtypes.CriticalPoint = None) -> web.Response:
    if keypoint not in KEYPOINTS:
        return web.json_response(
            status=400,
            data={'error': 'invalid-keypoint',
                  'message': f'Keypoint {keypoint} is not in '
                  f'{", ".join(KEYPOINTS.keys())}'})
    await session.hardware.move_to(
        mount, KEYPOINTS[keypoint](session.hardware), cp)


async def move_absolute(
        session: session.CalibrationSession,
        dest: types.Point,
        mount: types.Mount,
        cp: hwtypes.CriticalPoint = None) -> web.Response:
    await session.hardware.move_to(
        mount, dest, cp)
    status = await session.status()
    return web.json_response(
        status=200,
        data={'message': f'Moved {mount.name.lower()} mount to {tuple(dest)}',
              'status': status}
    )


async def move_relative(
        session: session.CalibrationSession,
        dest: types.Point,
        mount: types.Mount) -> web.Response:
    await session.hardware.move_rel(mount, dest)


async def move_to(request: web.Request) -> web.Response:  # noqa(C901)
    """
    POST /calibration/v2/move: Move a pipette to a position

    The position can either be a key point or an absolute location in
    deck coordinates.

    body should be a json dict:
    {
       'mount': 'left' or 'right' (required),
       'keypoint': one of :py:ref:`KeyPoints` names--|
       'tiprack': a slot with a tiprack in it        |
       'absolute': {'x': xpos, 'y': ypos, 'z': zpos} | one of these is required
       'relative': {'x': xpos, 'y': ypos, 'z': zpos}_|
       'criticalpoint': one of :py:ref:`CriticalPoint` (optional)
    }

    Returns
    409 Conflict: There is no active calibration session
    200 OK, body json blob with {'message': str,
                                 'status': as GET /calibration/v2/status}
            Complete
    400 Bad Request, json blob with {'error': error shortname,
                                     'message': message}
                      Request did not meet above requirements
    """
    session = request.app.get(_SESSION_VARNAME)
    if not session:
        return web.json_response(
            status=409,
            data={'error': 'no-session',
                  'message': 'No active calibration session in progress'})
    try:
        body = await request.json()
    except JSONDecodeError:
        return web.json_response(
            status=400,
            data={'error': 'bad-request-format',
                  'message': 'Body must be json'})
    if body.get('criticalpoint'):
        try:
            cp: Optional[hwtypes.CriticalPoint]\
                = hwtypes.CriticalPoint[body['criticalpoint'].upper()]
        except KeyError:
            return web.json_response(
                status=400,
                data={'error': 'bad-criticalpoint',
                      'message': f'Invalid critical point '
                      f'{body["criticalpoint"]}'})
    else:
        cp = None
    try:
        mount = types.Mount[body.get('mount', '').upper()]
    except KeyError:
        return web.json_response(
            status=400,
            data={'error': 'bad-mount',
                  'message': f'Invalid mount {body["mount"]}'})

    if body.get('keypoint'):
        return await move_to_keypoint(session, body['keypoint'], mount, cp)
    elif body.get('tiprack'):
        return await move_to_tiprack(session, body['tiprack'], mount, cp)
    elif body.get('absolute'):
        return await move_absolute(session, body['absolute'], mount, cp)
    elif body.get('relative'):
        return await move_relative(session, body['relative'], mount)
    else:
        return web.json_response(
            status=400,
            data={'error': 'no-motion-target',
                  'message': 'One of keypoint, tiprack, absolute, or'
                  ' relative must be specified'})


async def pick_up_tip(request: web.Request) -> web.Response:
    pass


async def confirm_tiprack_location(request: web.Request) -> web.Response:
    pass


async def return_tip(request: web.Request) -> web.Response:
    pass


async def confirm_keypoint_location(request: web.Request) -> web.Response:
    pass


async def start_flow(request: web.Request) -> web.Response:
    pass

# post /start
# common:
# post /load_labware
# post /move_to tiprack
# until post /confirm_tiprack_location:
#   post /move_to relatives to align
#   post /pick_up_tip (attempt=True?)
# for deck cal:
# post /begin_flow deck? (requires tip)
# for each deck cal keypoint:
#   post /move_to keypoint
#   until post /confirm_keypoint_location (keypoint):
#     post /move_rel
# maybe post /move_to keypoints to check
# post /confirm_deck
# for each mount:
#   post /begin_flow pipette (mount) (requires tip)
#   for each keypoint in (deck cal 1, tiprack):
#     until post /confirm_keypoint_loation(keypoint)
#       post move_rel
