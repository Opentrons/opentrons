import typing
from uuid import uuid4
from pydantic import UUID4

from opentrons.hardware_control.types import Axis

from .models import AttachedPipette
from .util import CalibrationCheckMachine
from opentrons.hardware_control import ThreadManager

"""
A set of endpoints that can be used to create a session for any robot
calibration tasks such as checking your calibration data, performing mount
offset or a robot deck transform.
"""


ALTERNATIVE_LABWARE = 'opentrons_96_filtertiprack_{}ul'
LOAD_NAME = 'opentrons_96_tiprack_{}ul'


class SessionManager:
    """Small wrapper to keep track of robot calibration sessions created."""
    def __init__(self):
        self._sessions = {}

    @property
    def sessions(self):
        return self._sessions

    @sessions.setter
    def sessions(self, key: str, value: 'CalibrationSession'):
        self._sessions[key] = value


class CalibrationSession:
    """Class that controls state of the current deck calibration session"""
    def __init__(self, hardware: ThreadManager):
        self.token = uuid4()
        self._pipettes = self._key_by_uuid(hardware.get_attached_instruments())
        self._hardware = hardware

    def _key_by_uuid(self, new_pipettes: typing.Dict) -> typing.Dict:
        pipette_dict = {}
        for mount, data in new_pipettes.items():
            token = uuid4()
            data['mount_axis'] = Axis.by_mount(mount)
            data['plunger_axis'] = Axis.of_plunger(mount)
            pipette_dict[token] = {**data}
        return pipette_dict

    async def cache_instruments(self):
        await self.hardware.cache_instruments()
        new_dict = self._key_by_uuid(self.hardware.get_attached_instruments())
        self._pipettes.clear()
        self._pipettes.update(new_dict)

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    def get_pipette(self, uuid: UUID4) -> 'AttachedPipette':
        return self._pipettes[uuid]

    @property
    def pipettes(self) -> typing.Dict:
        return self._pipettes


class CheckCalibrationSession(CalibrationSession):
    def __init__(self, hardware: 'ThreadManager'):
        super().__init__(hardware)
        self.state_machine = CalibrationCheckMachine()
        self._lw_definitions = {}
        self._labware_info = self._determine_required_labware()

    def _determine_required_labware(self) -> typing.Dict:
        lw = {}
        for id, data in self._pipettes:
            vol = data['max_volume']
            load_name = LOAD_NAME.format(vol)
            if_labware = lw.get(load_name)
            if if_labware:
                lw[load_name]['forPipettes'].append(id)
            else:
                lw['tiprackID'] = uuid4()
                lw['alternatives'] = [ALTERNATIVE_LABWARE.format(vol)]
                lw['forPipettes'] = [id]
                lw['loadName'] = load_name
                lw['slot'] = slot.pop()
                lw['namespace'] =
                lw['version'] =
                self._lw_definitions[load_name] = definition
        return lw

    @property
    def labware(self) -> typing.Dict:
        return self._labware
