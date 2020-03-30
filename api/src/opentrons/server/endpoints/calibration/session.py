import typing
from uuid import uuid4, UUID
from dataclasses import dataclass

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


@dataclass
class LabwareInfo:
    """
    This class purely maps to :py:class:`.models.LabwareStatus` and is
    intended to inform a client about the tipracks required for a session.

    :note: The UUID class is utilized here instead of UUID4 for type checking
    as UUID4 is only valid in pydantic models.
    """
    alternatives: typing.List[str]
    forPipettes: typing.List[UUID]
    loadName: str
    slot: typing.Optional[str]
    namespace: str
    version: str
    id: UUID


@dataclass
class LabwareDefinition:
    """
    This class will be used internally to move/pick up tip from the tipracks
    specified.

    :note: The UUID class is utilized here instead of UUID4 for type checking
    as UUID4 is only valid in pydantic models.
    """
    definition: labware.LabwareDefinition
    slot: typing.Optional[str]
    object: typing.Optional[labware.Labware]
    id: UUID


class CalibrationSession:
    """Class that controls state of the current deck calibration session"""
    def __init__(self, hardware: ThreadManager):
        self._pipettes = self._key_by_uuid(hardware.get_attached_instruments())
        self._hardware = hardware
        self._deck = geometry.Deck()
        self._lw_definitions: typing.Dict[UUID, LabwareDefinition] = {}
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

    def _determine_required_labware(self) -> typing.Dict[UUID, LabwareInfo]:
        """
        A function that inserts tiprack information into two dataclasses
        :py:class:`.LabwareInfo` and :py:class:`.LabwareDefinition` based
        on the current pipettes attached.
        """
        lw: typing.Dict[UUID, LabwareInfo] = {}
        _uuid: typing.Optional[UUID] = None
        for id, data in self._pipettes.items():
            vol = data['max_volume']
            load_name = LOAD_NAME.format(vol)
            if_labware = None
            if _uuid:
                if_labware = lw.get(_uuid)
            if _uuid and if_labware and if_labware.loadName == load_name:
                lw[_uuid].forPipettes.append(id)
            else:
                lw_def = labware.get_labware_definition(load_name)
                alt_lw = [name.format(vol) for name in ALTERNATIVE_LABWARE]
                new_uuid: UUID = uuid4()
                _uuid = new_uuid
                slot = self._decide_slot()
                lw[new_uuid] = LabwareInfo(
                    alternatives=alt_lw,
                    forPipettes=[id],
                    loadName=load_name,
                    slot=slot,
                    namespace=lw_def['namespace'],
                    version=lw_def['version'],
                    id=new_uuid)
                self._lw_definitions[new_uuid] = LabwareDefinition(
                    definition=lw_def,
                    slot=slot,
                    id=new_uuid,
                    object=None)
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

    def get_pipette(self, uuid: UUID) -> 'AttachedPipette':
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

    def _load_labware_objects(self):
        """
        A function that takes tiprack information and loads them onto the deck.
        """
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'loadLabware',\
            f'You cannot build a labware object during {curr_state} state.'
        for name, data in self._lw_definitions.items():
            parent = self._deck.position_for(data.slot)
            self._lw_definitions[name].object =\
                labware.Labware(data.definition, parent)
            self._deck[data.slot] = self._lw_definitions[name].object
