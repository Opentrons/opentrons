""" opentrons.calibration.v2: Functions and endpoints for robot calibration

This module has the code necessary for calibration to map the position of
attached pipettes to key points on the deck. This encompasses

- gantry to deck attitude estimation (done ideally once in machine lifetime)
- per-pipette deck critical point offset estimation (done on every pipette
  attach)

Once the appropriate calibration actions are taken, pipettes with tips attached
via machine processes should be able to accurately move to any location on the
deck. Labware calibration during a protocol can then establish mappings from
labware critical points to deck coordinates.
"""

import aiohttp.web


def prefix_from_rq(req: aiohttp.web.Request) -> str:
    return req.app[_PREFIX_VARNAME]


from . import mounts, tipracks, session  # noqa(E402) Must be available to imports


_PREFIX_VARNAME = f'com.{__name__}.URL_PREFIX'


def install(app: aiohttp.web.Application, prefix: str) -> None:
    app[_PREFIX_VARNAME] = prefix
    app.router.add_post(prefix, session.start)
    app.router.add_get(prefix, session.status)
    app.router.add_delete(prefix, session.cancel)

    # tiprack focused endpoints
    app.router.add_get(prefix + 'deck', session.get_tipracks)
    app.router.add_post(prefix + 'deck/{slot}', session.add_tiprack)
    app.router.add_post(
        prefix + 'tiprack/{tiprack_id}/move_to', tipracks.move_to)
    app.router.add_post(
        prefix + 'tiprack/{tiprack_id}/try_pickup', tipracks.try_pick_up)
    app.router.add_post(
        prefix + 'tiprack/{tiprack_id}/pickup_status',
        tipracks.confirm_pick_up)
    # general mount commands
    app.router.add_post(
        prefix + 'mount/{mount}/jog',
        mounts.jog)
    app.router.add_post(
        prefix + 'mount/{mount}/set_active', mounts.set_active)
    app.router.add_post(
        prefix + 'mount/{mount}/pick_up_tip', mounts.pick_up_tip)
    app.router.add_post(prefix + 'mount/{mount}/return_tip', mounts.return_tip)
    app.router.add_post(prefix + 'mount/{mount}/jog', mounts.jog)
    # app.router.add_post(prefix + 'move', session.move_to)
    # app.router.add_post(prefix + 'keypoint/{keypoint}/move_to',
    #     dc_endp2.move_to_keypoint)
    # app.router.add_post(prefix + 'keypoint/{keypoint}/confirm_location',
    #     dc_endp2.confirm_keypoint_location)
