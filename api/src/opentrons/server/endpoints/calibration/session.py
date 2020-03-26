import typing
from uuid import uuid4
from pydantic import UUID4

from opentrons.hardware_control.types import Axis

from .models import AttachedPipette
from .util import CalibrationCheckMachine
from opentrons.hardware_control import ThreadManager
from opentrons.protocol_api import labware, geometry

"""
A set of endpoints that can be used to create a session for any robot
calibration tasks such as checking your calibration data, performing mount
offset or a robot deck transform.
"""


ALTERNATIVE_LABWARE = ['opentrons_96_filtertiprack_{}ul']
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
        self._pipettes = self._key_by_uuid(hardware.get_attached_instruments())
        self._hardware = hardware
        self._deck = geometry.Deck()
        self._lw_definitions: typing.Dict[str, typing.Dict] = {}
        self._slot_options = ['8', '6']
        self._labware_info = self._determine_required_labware()

    def _key_by_uuid(self, new_pipettes: typing.Dict) -> typing.Dict:
        pipette_dict = {}
        for mount, data in new_pipettes.items():
            token = uuid4()
            data['mount_axis'] = Axis.by_mount(mount)
            data['plunger_axis'] = Axis.of_plunger(mount)
            pipette_dict[token] = {**data}
        return pipette_dict

    def _determine_required_labware(self) -> typing.Dict:
        lw: typing.Dict[str, typing.Dict] = {}
        for id, data in self._pipettes.items():
            vol = data['max_volume']
            load_name = LOAD_NAME.format(vol)
            if_labware = lw.get(load_name)
            if if_labware:
                lw[load_name]['forPipettes'].append(id)
            else:
                lw_def = labware.get_labware_definition(load_name)
                slot = self._decide_slot()
                lw[load_name] = self._build_lw_dict(
                    slot, load_name, lw_def, vol, id)
                self._lw_definitions[load_name] = {
                    'definition': lw_def,
                    'slot': slot,
                    'object': None}
        return lw

    def _build_lw_dict(
            self,
            slot: typing.Optional[str], load_name: str,
            lw_def: labware.LabwareDefinition, vol: str,
            id: UUID4) -> typing.Dict:
        lw: typing.Dict[str, typing.Any] = {}
        lw['tiprackID'] = uuid4()
        lw['alternatives'] = [name.format(vol) for name in ALTERNATIVE_LABWARE]
        lw['forPipettes'] = [id]
        lw['loadName'] = load_name
        lw['slot'] = slot
        lw['namespace'] = lw_def['namespace']
        lw['version'] = lw_def['version']
        return lw

    def _decide_slot(self) -> typing.Optional[str]:
        if self._slot_options:
            return self._slot_options.pop(0)
        else:
            return None

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

    @property
    def labware(self) -> typing.Dict:
        return self._labware_info


class CheckCalibrationSession(CalibrationSession):
    def __init__(self, hardware: 'ThreadManager'):
        super().__init__(hardware)
        self.state_machine = CalibrationCheckMachine()

    def _create_labware_objects(self):
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'loadLabware',\
            'You cannot build a labware object during {curr_state} state.'
        objs = {}
        for name, data in self._lw_definitions.items():
            parent = self._deck.position_for(data['slot'])
            objs[name] = {
                'object': labware.Labware(data['definition'], parent)}
        self._lw_definitions.update(**objs)
