import typing
from uuid import uuid4, UUID
from dataclasses import dataclass, asdict

from opentrons.types import Mount, Point
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
    slot: str
    namespace: str
    version: str
    id: UUID
    definition: labware.LabwareDefinition


class CalibrationSession:
    """Class that controls state of the current deck calibration session"""
    def __init__(self, hardware: ThreadManager):
        self._pipettes = self._key_by_uuid(hardware.get_attached_instruments())
        self._hardware = hardware
        self._deck = geometry.Deck()
        self._slot_options = ['8', '6']
        self._labware_info = self._determine_required_labware()

    def _key_by_uuid(self, new_pipettes: typing.Dict) -> typing.Dict:
        pipette_dict = {}
        for mount, data in new_pipettes.items():
            # TODO: Adding in error state is out of scope for this PR.
            # This is to ensure during testing that two pipettes are
            # attached -- for now.
            assert data, "Please attach pipettes before proceeding"
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
                slot = self._available_slot_options()
                lw[new_uuid] = LabwareInfo(
                    alternatives=alt_lw,
                    forPipettes=[id],
                    loadName=load_name,
                    slot=slot,
                    namespace=lw_def['namespace'],
                    version=lw_def['version'],
                    id=new_uuid,
                    definition=lw_def)
        return lw

    def _available_slot_options(self) -> str:
        if self._slot_options:
            return self._slot_options.pop(0)
        else:
            raise KeyError("No available slots remaining")

    def _convert_to_mount(self, mount: str) -> Mount:
        if mount == 'z':
            return Mount.LEFT
        else:
            return Mount.RIGHT

    def _jog(self, pipette: UUID, vector: Point):
        """
        General function that can be used by all session types to jog around
        a specified pipette.
        """
        pip = self.get_pipette(pipette)
        mount = pip['mount_axis']
        self._hardware.move_rel(self._convert_to_mount(mount), vector)

    def _add_tip(self, pipette: UUID, tip_length: float):
        self._pipettes[pipette]['hasTip'] = True
        self._pipettes[pipette]['tipLength'] = tip_length

    def _remove_tip(self, pipette: UUID):
        self._pipettes[pipette]['hasTip'] = False
        self._pipettes[pipette]['tipLength'] = 0.0

    def _has_tip(self, pipette: UUID) -> bool:
        return self._pipettes[pipette]['hasTip']

    def _pick_up_tip(self, pipette: UUID, tiprack: UUID):
        pip = self.get_pipette(pipette)
        mount = self._convert_to_mount(pip['mount_axis'])
        lw_info = self.get_tiprack(tiprack)
        tip_length = self._deck[lw_info.slot].tip_length
        self._hardware.pick_up_tip(mount, tip_length)
        self._add_tip(pipette, tip_length)

    def _return_tip(self, pipette: UUID):
        pip = self.get_pipette(pipette)
        mount = self._convert_to_mount(pip['mount_axis'])
        self._hardware.drop_tip(mount)

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

    def get_tiprack(self, uuid: UUID):
        return self._labware_info[uuid]

    @property
    def pipettes(self) -> typing.Dict:
        return self._pipettes

    @property
    def labware_status(self) -> typing.Dict:
        to_dict = {}
        for name, value in self._labware_info.items():
            temp_dict = asdict(value)
            del temp_dict['definition']
            to_dict[name] = temp_dict
        return to_dict


class CheckCalibrationSession(CalibrationSession):
    def __init__(self, hardware: 'ThreadManager'):
        super().__init__(hardware)
        self.state_machine = CalibrationCheckMachine()
        self._moves = Moves()

    def _load_labware_objects(self):
        """
        A function that takes tiprack information and loads them onto the deck.
        """
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'loadLabware',\
            f'You cannot build a labware object during {curr_state} state.'
        for name, data in self._labware_info.items():
            parent = self._deck.position_for(data.slot)
            self._deck[data.slot] = labware.Labware(data.definition, parent)
            'You cannot build a labware object during {curr_state} state.'
        objs = {}
        for name, data in self._lw_definitions.items():
            parent = self._deck.position_for(data['slot'])
            objs[name] = {
                'object': labware.Labware(data['definition'], parent)}
        self._lw_definitions.update(**objs)
        self.state_machine.update_state()

    def pick_up_tip(self, pipette: UUID):
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'pickUpTip',\
            f'You cannot pick up tip during {curr_state} state'
        self._pick_up_tip(pipette)
        self.state_machine.update_state()

    def invalidate_tip(self, pipette: UUID):
        self.state_machine.update_state(self.get_state('invalidateTip'))
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'invalidateTip',\
            f'You cannot remove a tip during {curr_state} state'
        self._remove_tip(pipette)

    def drop_tip(self, pipette: UUID):
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'dropTip',\
            f'You cannot drop a tip during {curr_state} state'
        self._remove_tip(pipette)
        self.state_machine.update_state()

    def move(self, pipette: UUID, position: typing.Dict[str, typing.Union[UUID, typing.List]]):
        assert position["locationId"] in self._moves.values()
        pt = Point(position["location"])
        self._move(pipette, pt)
        self.state_machine.update_state()

    def jog(self, pipette: UUID, vector: typing.List):
        self._jog(pipette, Point(vector))
        self.state_machine.update_state()
