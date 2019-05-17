"""
opentrons.calbration.v2.session: Session and labware management for deck cal

This module provides storage for things like which labware are loaded where
and a top-level session wrapper (other modules may add additional data) for
the calibration state.
"""

import functools
import json
from typing import Any, Callable, Dict, Optional

from aiohttp import web
from opentrons import types
from opentrons.hardware_control import API
from opentrons.protocol_api import geometry, labware
from opentrons.config import feature_flags as fflags

from . import prefix_from_rq


_SESSION_VARNAME = f'com.{__name__}.session'


def require_session(endpoint):
    """
    Decorator to check for an active deck cal session in an endpoint

    If a session is found, it will be provided to the endpoint as a
    session= keyword argument. If no session is found, a json response with
    status 409 Conflict and a json blob with an error and message will be sent.
    """

    @functools.wraps(endpoint)
    async def handler(request: web.Request, *args, **kwargs) -> web.Response:
        try:
            session = from_rq(request)
        except KeyError:
            return web.json_response(
                status=409,
                data={'error': 'no-session',
                      'message': 'There is no active calibration session'})
        return await endpoint(request, session)

    return handler


def from_rq(request: web.Request) -> 'CalibrationSession':
    """ Get a session from the current request.

    :raises KeyError: If there is no session
    """
    return request.app[_SESSION_VARNAME]


class CalibrationSession:
    """ Data storage for a calibration session.

    An active calibration session is required for both the deck attitude
    estimation and pipette offset estimation tasks, since we use it to
    load and maintain information about things like tipracks.

    It unfortunately reimplements a bit of what
    :py:class:`opentrons.protocol_api.contexts.ProtocolContext` does because
    this code all needs to work asynchronously (to the extent that's possible
    anyway; but the ProtocolContext forces synchronous hardware access so we
    definitely want to avoid that)
    """
    def __init__(self, hardware: API) -> None:
        self._hw = hardware
        self._deckmap = geometry.Deck()
        self._lw_from_ids: Dict[str, labware.Labware] = {}
        self._ids_from_lw: Dict[labware.Labware, str] = {}
        self._active_mount = types.Mount.LEFT
        self._tips_from = {m: None
                           for m in types.Mount}
        if fflags.short_fixed_trash():
            trash_name = 'opentrons_1_trash_0.85_l'
        else:
            trash_name = 'opentrons_1_trash_1.1_l'

        self._load_labware('12', name=trash_name)

    async def prepare(self) -> None:
        """ Prepare the session for use.

        :raises RuntimeError: If no instruments are attached.
        """
        await self._hw.cache_instruments()
        for mount, data in self._hw.attached_instruments:
            if not data:
                continue
            self._active_mount = mount
        else:
            raise RuntimeError("No pipettes attached to robot")
        await self._hw.home()

    async def set_active_mount(self, mount: types.Mount) -> None:
        if mount != self.active_mount:
            if self._hw.attached_instruments[self.active_mount]['has_tip']:
                await self._hw.drop_tip(self.active_mount)
            await self._hw.home_z(self.active_mount)
        self._active_mount = mount

    @property
    def active_mount(self) -> types.Mount:
        return self._active_mount

    @property
    def deck(self) -> geometry.Deck:
        return self._deckmap

    def deck_serializable(self, prefix: str) -> Dict[str, str]:
        def _entry(
                maybe_lw: Optional[labware.Labware])\
                -> Optional[Dict[str, Any]]:
            if not maybe_lw:
                return None
            lw_id = self._ids_from_lw[maybe_lw]
            return {
                "url": prefix + f'tipracks/{lw_id}',
                "id": lw_id,
                "load_name": maybe_lw.name
            }
        return {str(slot): _entry(maybe_lw)
                for slot, maybe_lw in self._deckmap.data.items()}

    @property
    def tipracks(self) -> Dict[str, labware.Labware]:
        """ A map from the tiprack ids in urls to labware objects """
        return self._lw_from_ids

    @property
    def hardware(self) -> API:
        return self._hw

    @property
    def tips_from(self) -> Dict[types.Mount, Optional[labware.Well]]:
        return self._tips_from

    def _load_labware(
            self, slot: str,
            name: str = None,
            definition: Dict[str, Any] = None,
            validation_pred: Callable[[labware.Labware], None] = None) -> str:
        assert not self._deckmap[slot], f'Slot {slot} already has a labware'
        pos = self._deckmap.position_for(slot)
        if name:
            lw_obj = labware.load(name, pos)
        elif definition:
            lw_obj = labware.load_from_definition(definition, pos)
        else:
            assert False, 'Neither name nor def specified'
        if validation_pred:
            validation_pred(lw_obj)
        self._deckmap[slot] = lw_obj
        lw_id = f'{lw_obj.ot_id}-{slot}'
        self._lw_from_ids[lw_id] = lw_obj
        self._ids_from_lw[lw_obj] = lw_id
        return lw_id

    def load_tiprack(self, slot: str,
                     name: str = None,
                     definition: Dict[str, Any] = None) -> str:
        """ Load a tiprack for use with calibration

        This can be either the name of a labware present on the robot
        (including previously-defined custom labware) or an inline json
        definition.

        Returns the name of the labware since it may be loaded from definition
        """
        def pred(lw: labware.Labware):
            assert lw.is_tiprack, f'Labware {lw.name} is not a tiprack'

        lw_id = self._load_labware(slot, name, definition, pred)
        self._active_mount = types.Mount.RIGHT
        return lw_id

    async def status(self, prefix: str) -> Dict[str, Any]:
        """ Return a status dict suitable for sending to clients
        """
        positions = {mount: await self._hw.current_position(mount)
                     for mount in types.Mount}
        return {
            'labware': self.deck_serializable(prefix),
            'pipettes': {mount.name.lower(): instr
                         for mount, instr
                         in self._hw.attached_instruments.items()},
            'position': {
                mount.name: {ax.name.lower(): pos
                             for ax, pos in position.items()}
                for mount, position in positions.items()},
            'active_mount': self.active_mount.name.lower()
        }


def _require_slot(endpoint):
    """
    Decorator requiring a valid slotname in the {slot} url match field

    If the slot is found it will be provided to the endpoint as a slot=
    keyword argument. The object currently in the slot (if any) will be
    provided in a labware= keyword argument.

    If no slot is found, respond with a json response
    with status code 400 Bad Request and a body with an error and message
    key.
    """

    @functools.wraps(endpoint)
    async def handler(request: web.Request, *args, **kwargs):
        slot = request.match_info['slot']
        if 'session' in kwargs:
            session: CalibrationSession = kwargs['session']
        else:
            session = from_rq(request)
        try:
            lw = session.deck[slot]
        except KeyError:
            return web.json_response(
                status=404,
                data={'error': 'bad-slotname',
                      'message': f'{slot} is not a valid slot name'})
        kwargs['slot'] = slot
        kwargs['labware'] = lw
        return await endpoint(request, *args, **kwargs)


@require_session
@_require_slot
async def add_tiprack(
        request: web.Request, session: CalibrationSession,
        slot: str, labware: Optional[geometry.DeckItem]) -> web.Response:
    """
    POST /calibration/v2/deck/{slot}
    body {"name": name (optional), "definition": definition (optional)}

    Specify either the load name (in "name") or full inline definition
    (in "definition") of a tiprack to load into the slot in the url.

    Requires a calibration session (409 Conflict otherwise), a valid slot
    (404 Not Found) otherwise, and the above request body specifying a
    tiprack (400 Bad Request) otherwise, in an empty slot (409 Conflict
    otherwise)

    If everything is ok, returns 201 Created with a json body:
    {"message": some human-readable message,
     "url": A url with tiprack-focused slot actions}
    """
    if labware:
        return web.json_response(
            status=409,
            data={'error': 'slot-filled',
                  'message': f'{labware.name} already present in slot {slot}'})
    try:
        data = await request.json()
    except json.JSONDecodeError:
        return web.json_response(
            status=400, data={'error': 'bad-json',
                              'message': 'Request body had invalid json'})
    try:
        session.load_tiprack(slot, **data)
    except AssertionError as ae:
        return web.json_response(
            status=400,
            data={'error': 'bad-request',
                  'message': str(ae)})
    prefix = prefix_from_rq(request)
    lw_details = session.deck_serializable(prefix)[slot]
    data = {'message': f'Loaded {lw.name} in slot {slot}'}
    data.update(lw_details)
    return web.json_response(
        status=201,
        data=data)


@require_session
async def get_tipracks(
        request: web.Request, session: CalibrationSession) -> web.Response:
    """
    GET /calibration/v2/deck

    Returns the current status of the deck as a json blob:

    {"1": null or {"url": url,
                   "name": tiprack loadName},
     "2": ...}
    """
    prefix = prefix_from_rq(request)
    return web.json_response(
        status=200,
        data=session.deck_serializable(prefix))


async def start(request: web.Request) -> web.Response:
    """
    POST /calibration/v2: Begin a calibration session

    Set the url param force=true to wipe away an in-progress calibration
    session, if one exists (this is equivalent to POST /calibration/v2/cancel
    before POST /calibration/v2/start).

    There is no tokenization for calibration sessions, so they can be reused.

    Returns:
    201 Created: A calibration session has begun. Body is a json blob:
                 {"status": as GET /calibration/v2}
    404 Not Found: This endpoint is only loaded and available if API v2 is
                   enabled on the robot.
    409 Conflict: A calibration session is already in progress

    """
    if request.app.get(_SESSION_VARNAME):
        # if there aren't any query params request.url.query is none
        if request.url.query\
           and request.url.query.get('force').lower() == 'true':
            del request.app[_SESSION_VARNAME]
        else:
            return web.json_response(
                status=409,
                data={
                    'error': 'in-progress',
                    'message': 'A calibration session is already in progress'
                })
    session = CalibrationSession(request.app['com.opentrons.hardware'])
    await session.hardware.home()
    request.app[_SESSION_VARNAME] = session
    status = await session.status(prefix_from_rq(request))
    return web.json_response(status=201,
                             data={'status': status})


@require_session
async def status(
        request: web.Request, session: CalibrationSession) -> web.Response:
    """
    GET /calibration/v2: Get the status of the calibration subsystem

    Returns:
    200 OK, body: json blob
    404 Not Found: If API v2 is not enabled
    409 Conflict: there is no active calibration session
    """
    prefix = prefix_from_rq(request)
    status = await session.status(prefix)
    return web.json_response(status=200, data=status)


async def cancel(request: web.Request) -> web.Response:
    """
    DELETE /calibration/v2: Stop an active calibration session

    Returns
    202 Accepted: The session was deleted (regardless of whether a session
                  was active)
    """
    request.app.pop(_SESSION_VARNAME, None)
    return web.json_response(
        status=202,
        data={'message': 'Session deleted'})
