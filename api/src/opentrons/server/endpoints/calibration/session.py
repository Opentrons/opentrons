import typing
from enum import Enum
from uuid import UUID, uuid1
from aiohttp import web
from opentrons.hardware_control.types import Axis
from pydantic import BaseModel, Field

from .util import CALIBRATION_ACTIONS

if typing.TYPE_CHECKING:
    from opentrons.hardware_control import ThreadManager  # noqa(F501)

"""
A set of endpoints that can be used to create a session for any deck
calibration tasks such as checking your calibration data, performing mount
offset or a deck transform.
"""


class CalibrationCheckActions(str, Enum):
    """The actions available for calibration check"""
    specifyLabware = "specifyLabware",
    checkHeight = "checkHeight",
    checkPointOne = "checkPointOne",
    checkPointTwo = "checkPointTwo",
    checkPointThree = "checkPointThree"


class AttachedPipette(BaseModel):
    """Pipette (if any) attached to the mount"""
    model: typing.Optional[str] = \
        Field(...,
              description="The model of the attached pipette. These are snake "
                          "case as in the Protocol API. This includes the full"
                          " version string")
    name: typing.Optional[str] = \
        Field(...,
              description="The name of the attached pipette - the model "
                          "without the version string")
    tip_length: typing.Optional[float] = \
        Field(...,
              description="The default tip length for this pipette, if "
                          "attached")
    mount_axis: str = \
        Field(...,
              description="The axis that moves this pipette up and down")
    plunger_axis: str = \
        Field(...,
              description="The axis that moves this pipette's plunger")
    id: typing.Optional[str] = \
        Field(...,
              description="The serial number of the attached pipette")


class Instruments(BaseModel):
    """None"""
    left_id: AttachedPipette
    right_id: AttachedPipette

    class Config:
        schema_extra = {
            "fakeUUID1": {
                "model": "p300_single_v1.5",
                "name": "p300_single",
                "tip_length": 51.7,
                "mount_axis": "z",
                "plunger_axis": "b",
                "id": "P3HS12123041"
            },
            "fakeUUID2": {
                "model": None,
                "name": None,
                "tip_length": None,
                "mount_axis": "a",
                "plunger_axis": "c",
                "id": None
            }
        }


class CalibrationSessionStatus(BaseModel):
    instruments: typing.Dict[str, Instruments]
    activeInstrument: UUID = Field(..., description="Token of active pipette")
    currentStep: str = Field(..., description="Current step of session")
    nextSteps: typing.List[CalibrationCheckActions]


class CalibrationSession:
    """Class that controls state of the current deck calibration session"""
    def __init__(self, hardware: 'ThreadManager', session_type: str):
        self.token = str(uuid1())
        self._current_uuid: typing.Optional[str] = None
        self.pipettes = self._key_by_uuid(hardware.get_attached_instruments())
        self._hardware = hardware
        self._current_step = None
        self._next_steps = None
        self._full_steps = self._format_steps(session_type)

    def _key_by_uuid(self, new_pipettes: dict):
        pipette_dict = {}
        for mount, data in new_pipettes.items():
            token = str(uuid1())
            if mount.name.lower() == 'right':
                self.current_uuid = token
            data['mount_axis'] = str(Axis.by_mount(mount)).lower()
            data['plunger_axis'] = str(Axis.of_plunger(mount)).lower()
            pipette_dict[token] = {**data}
        return pipette_dict

    def _format_steps(self, session_type: str):
        available_actions = CALIBRATION_ACTIONS[session_type]
        full_steps = {}
        for id in self.pipettes.keys():
            full_steps[id] = {key: False for key in available_actions}
        return full_steps

    async def cache_instruments(self):
        await self.hardware.cache_instruments()
        new_dict = self._key_by_uuid(self.hardware.get_attached_instruments())
        self.pipettes.update(new_dict)

    @property
    def hardware(self):
        return self._hardware

    @property
    def current_pipette(self):
        return self.pipettes[self.current_uuid]

    @property
    def current_uuid(self):
        return self._current_uuid

    @current_uuid.setter
    def current_uuid(self, uuid: str):
        self._current_uuid = uuid

    @property
    def current_step(self):
        return self._current_step

    @current_step.setter
    def current_step(self, step):
        self._full_steps[self.current_uuid][step] = True
        self._current_step = step

    @property
    def next_steps(self):
        available_actions = self._full_steps[self.current_uuid]
        return [key for key, value in available_actions.items() if not value]


class SessionManager:
    """Small wrapper to keep track of deck calibration sessions created."""
    def __init__(self):
        self._sessions = {}

    @property
    def sessions(self):
        return self._sessions

    @sessions.setter
    def sessions(self, key, value):
        self._sessions[key] = value


session_storage = SessionManager()


def _format_status(session_type: str):
    session = session_storage.sessions.get(session_type)
    status = {
        'instruments': session.pipettes,
        'activeInstrument': session.current_uuid,
        'currentStep': session.current_step,
        'nextSteps': session.next_steps}
    return status


async def get_current_session(request):
    """
    GET /calibration/check/session

    If a session exists, this endpoint will return the current status.

    The status message is in the shape of:
    :py:class:`.CalibrationSessionStatus`

    See the model above for more information.
    """
    session_type = request.match_info['type']
    current_session = session_storage.sessions.get(session_type)
    if not current_session:
        response = {'message': f'A {session_type} session does not exist.'}
        return web.json_response(response, status=404)
    else:
        response = _format_status(session_type)
        return web.json_response(response, status=200)


async def create_session(request):
    """
    POST /calibration/check/session

    Endpoint to create a sessions if it does not exist. Otherwise, acts
    like GET /calibration/check/session.
    """
    session_type = request.match_info['type']
    current_session = session_storage.sessions.get(session_type)
    if not current_session:
        # There is a new session created, we must cache currently attached
        # instruments and returning them.
        hardware = request.app['com.opentrons.hardware']
        await hardware.cache_instruments()
        session_storage.sessions[session_type] =\
            CalibrationSession(hardware, session_type)
        session_storage.sessions[session_type].current_step = 'specifyLabware'
        response = _format_status(session_type)
        return web.json_response(response, status=201)
    else:
        return web.json_response(status=200)


async def delete_session(request):
    """
    DELETE /calibration/check/session

    Endpoint to delete a session if it exists.
    """
    session_type = request.match_info['type']
    current_session = session_storage.sessions.get(session_type)
    if not current_session:
        response = {'message': f'A {session_type} session does not exist.'}
        return web.json_response(response, status=404)
    else:
        await current_session.hardware.home()
        del session_storage.sessions[session_type]
        return web.json_response(status=200)
