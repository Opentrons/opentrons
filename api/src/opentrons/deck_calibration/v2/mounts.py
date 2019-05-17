"""
opentrons.calibration.v2.mounts: Endpoints for mount management

This module provides endpoints for actions with a mount as a primary resource
"""

import functools
import json
import logging
from typing import Dict, Any

from aiohttp import web

from opentrons import types

from .session import CalibrationSession, from_rq, require_session
from . import prefix_from_rq

MODULE_LOG = logging.getLogger(__name__)


def _require_mount(endpoint):
    """ Decorator to require a mount in the url

    This will get and check request.match_info["mount"] to be a valid mount
    with a pipette on it. If everything is ok, it will call the decorated
    endpoint with the mount in the mount= keyword and the instr dict in the
    instrument= keyword; otherwise, it will return
    a 404 Not Found with a json body with a message and error key.
    """
    @functools.wraps(endpoint)
    async def wrapper(req: web.Request, *args, **kwargs) -> web.Response:
        mount_name = req.match_info['mount']
        try:
            mount = types.Mount[mount_name.upper()]
        except (KeyError, AttributeError) as e:
            MODULE_LOG.error(f'_require_mount: Bad mount {mount_name}: {e}')
            return web.json_response(
                status=404,
                data={'error': 'bad-mount',
                      'message': f'Mount {mount_name} is not valid'})
        if 'session' in kwargs:
            session = kwargs['session']
        else:
            session = from_rq(req)
        pip = session.hardware.attached_pipettes[mount]
        if not pip:
            MODULE_LOG.error(f'_require_mount: No pipette on {mount_name}')
            return web.json_response(
                status=404,
                data={'error': 'no-pipette',
                      'message': f'No pipette on mount {mount_name}'}
            )
        kwargs['instrument'] = pip
        kwargs['mount'] = mount
        return await endpoint(req, *args, **kwargs)

    return wrapper


@require_session
@_require_mount
async def jog(request: web.Request,
              session: CalibrationSession,
              mount: types.Mount,
              instrument: Dict[str, Any]) -> web.Response:
    """ POST /calibration/v2/mount/{mount}/jog Move the mount by a vector

    This is a relative movement for the given mount. If a mount that isn't the
    active mount is specified, the active mount will switch (see
    POST /calibration/v2/mount/{mount}/activate).

    Body should be json and contain:
    {"x": x delta,
     "y": y delta,
     "z": z delta}

    Each is optional, but if present must be a float.

    Returns
    400 Bad Request: If the body isn't as specified above
    200 OK: Motion done
    """
    try:
        data = await request.json()
    except json.JSONDecodeError:
        return web.json_response(
            status=400,
            data={'error': 'bad-request',
                  'message': 'Request was not json'})
    try:
        delta = types.Point(**data)
    except TypeError:
        return web.json_response(
            status=400,
            data={'error': 'bad-request',
                  'message': 'Request has invalid key'})

    if mount != session.active_mount:
        await session.switch_mount(mount)

    await session.hardware.move_rel(session.active_mount, delta)
    prefix = prefix_from_rq(request)
    status = await session.status(prefix)
    mount_name = mount.name.lower()
    return web.json_response(
        status=200,
        data={'message': f'Moved {mount_name} {delta}',
              'status': status})


@require_session
@_require_mount
async def set_active(request: web.Request,
                     session: CalibrationSession,
                     mount: types.Mount,
                     instrument: Dict[str, Any]) -> web.Response:
    """
    POST /calibration/v2/mount/{mount}/set_active Set the active mount

    This will home the mount that was not just set active, mostly to get
    it up and out of the way.
    """

    await session.set_active_mount(mount)
    mount_name = mount.name.lower()
    prefix = prefix_from_rq(request)
    status = await session.status(prefix)
    if instrument['has_tip']:
        actions = {
            'return_tip': prefix + f'mount/{mount_name}/return_tip'
        }
    else:
        actions = {
            'pick_up_tip': prefix + f'mount/{mount_name}/pick_up_tip'
        }
    actions['jog'] = prefix + f'mount/{mount_name}/jog'
    return web.json_response(
        status=200,
        data={'message': f'Set active mount to {mount_name}',
              'status': status,
              'actions': actions}
    )


@require_session
@_require_mount
async def pick_up_tip(request: web.Request,
                      session: CalibrationSession,
                      mount: types.Mount,
                      instrument: Dict[str, Any]) -> web.Response:
    """
    POST /calibration/v2/mount/{mount}/pick_up_tip
    body: {"tiprack": tiprack_id}

    The tiprack_id should be the contents of one of the "id" fields of
    - the ['tipracks'][{slot}] field of GET /status
    - the [{slot}] field of GET /deck
    - the the return of POST /deck/{slot}

    If this is not the active mount, the active mount will be set to this mount
    Returns
    200 OK: The system went and picked up a tip on the given mount
    404 Not Found: The specified tiprack id was not valid
    400 Bad Request: The request body was invalid json or the "tiprack" key was
                     not present
    409 Conflict: There is already a tip on the mount
    """
    try:
        body = await request.json()
        lw_id = body['tiprack']
    except (json.JSONDecodeError, KeyError):
        MODULE_LOG.exception('calibration.v2.mounts.pick_up_tip: bad request')
        return web.json_response(
            status=400,
            data={'error': 'bad-request-body',
                  'message': 'Invalid body: bad json or no tiprack key'})
    try:
        tiprack = session.tipracks[lw_id]
    except KeyError:
        return web.json_response(
            status=404,
            data={'error': 'no-such-tiprack',
                  'message': f'Tiprack {lw_id} does not exist'})

    if mount != session.active_mount:
        await session.switch_mount(mount)
    prefix = prefix_from_rq(request)
    mount_name = mount.name.lower()
    if instrument['has_tip']:
        return web.json_response(
            status=409,
            data={
                'error': 'has-tip',
                'message': 'Pipette on {mount.name.lower()} has tip',
                'actions': {
                    'return_tip': prefix + f'mount/{mount_name}/return_tip'
                }
            })

    tip_well = tiprack.next_tip(instrument['channels'])
    if not tip_well:
        return web.json_response(
            status=409,
            data={
                'error': 'no-tips-left',
                'message': 'Tiprack {repr(tiprack)} has no tips left'})
    await session.hardware.move_to(mount,
                                   tip_well.top().point)
    await session.hardware.pick_up_tip(mount, tiprack.tip_length)
    session.tips_from[mount] = tip_well
    tiprack.use_tips(tip_well, instrument['channels'])
    return web.json_response(
        status=200,
        data={
            'message': f'Picked up tip on {mount_name} from {repr(tiprack)}',
            'actions': {
                'return_tip': prefix + 'mount/{mount_name}/return_tip',
                'jog': prefix + 'mount/{mount_name}/jog'
            }
        }
    )


@require_session
@_require_mount
async def return_tip(request: web.Request,
                     session: CalibrationSession,
                     mount: types.Mount,
                     instrument: Dict[str, Any]) -> web.Response:
    """
    POST /calibration/v2/mount/{mount}/return_tip

    Return the current tip on the current pipette to the labware it came from

    If this is not the active mount, the active mount will be set to this mount
    Returns
    200 OK: The tip was returned
    409 Conflict: There is no tip on the mount
    """
    prefix = prefix_from_rq(request)
    mname = mount.name.lower()
    if not instrument['has_tip']:
        return web.json_response(
            status=409,
            data={'error': 'no-tip',
                  'message': f'{mname} has no tip',
                  'actions': {
                      'pick_up_tip': prefix + f'mount/{mname}/pick_up_tip'}})
    dest = session.tips_from[mount]
    assert dest, 'No tip tracked for mount {mname}'
    if mount != session.active_mount:
        session.switch_mount(mount)

    await session.hardware.move_to(mount,
                                   dest.bottom().move(z=10))
    await session.hardware.drop_tip(mount)

    try:
        dest.parent.return_tips(dest, instrument['channels'])
    except AssertionError:
        MODULE_LOG.exception('well {dest} had a tip already')
    return web.json_response(
        status=200,
        data={'message': f'Dropped tip from {mname} to {dest}',
              'actions': {
                  'pick_up_tip': prefix + 'mount/{mname}/pick_up_tip'
              }})
