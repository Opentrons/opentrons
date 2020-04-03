import typing
from uuid import uuid4, UUID
from dataclasses import dataclass, asdict, field

from opentrons.types import Mount, Point
from opentrons.hardware_control.types import Axis

# from .models import AttachedPipette
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
class Pipette:
    model: typing.Optional[str]
    name: typing.Optional[str]
    tip_length: typing.Optional[float]
    mount_axis: Axis
    plunger_axis: typing.Optional[Axis]
    pipette_id: typing.Optional[str]
    has_tip: bool
    max_volume: int
    channels: int
    tip_overlap: typing.Dict[str, int]
    return_tip_height: int
    tiprack_id: typing.Optional[UUID]


@dataclass
class PipetteStatus:
    model: str
    name: str
    tip_length: float
    mount_axis: Axis
    plunger_axis: Axis
    pipette_uuid: Axis
    has_tip: bool


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


@dataclass
class Moves:
    """
    This class is meant to encapsulate the different moves
    """
    moveToTipRack: typing.Optional[typing.Dict[UUID, Point]] = field(default_factory=dict)
    checkPointOne: typing.Optional[typing.Dict[UUID, Point]] = field(default_factory=dict)
    checkPointTwo: typing.Optional[typing.Dict[UUID, Point]] = field(default_factory=dict)
    checkPointThree: typing.Optional[typing.Dict[UUID, Point]] = field(default_factory=dict)
    checkHeight: typing.Optional[typing.Dict[UUID, Point]] = field(default_factory=dict)


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
            fields = list(Pipette.__dataclass_fields__.keys())

            updated_data = {
                key: value for key, value in data.items() if key in fields}
            token = uuid4()
            pipette_dict[token] = Pipette(
                **updated_data,
                mount_axis=Axis.by_mount(mount),
                plunger_axis=Axis.of_plunger(mount),
                tiprack_id=None)
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
            max_vol = data.max_volume
            # Gross workaround for the p50 pipette to use a 300ul tiprack.
            vol = 300 if max_vol == 50 else max_vol
            load_name = LOAD_NAME.format(vol)
            if_labware = None
            if _uuid:
                if_labware = lw.get(_uuid)
            if _uuid and if_labware and if_labware.loadName == load_name:
                lw[_uuid].forPipettes.append(id)
                self._pipettes[id].tiprack_id = _uuid
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
                self._pipettes[id].tiprack_id = new_uuid
        return lw

    def _available_slot_options(self) -> str:
        if self._slot_options:
            return self._slot_options.pop(0)
        else:
            raise KeyError("No available slots remaining")

    def _convert_to_mount(self, mount: Axis) -> Mount:
        if mount == Axis.Z:
            return Mount.LEFT
        else:
            return Mount.RIGHT

    def _jog(self, pipette: UUID, vector: Point):
        """
        General function that can be used by all session types to jog around
        a specified pipette.
        """
        pip = self.get_pipette(pipette)
        self._hardware.move_rel(self._convert_to_mount(pip.mount_axis), vector)

    def _add_tip(self, pipette: UUID, tip_length: float):
        self._pipettes[pipette].hasTip = True
        self._pipettes[pipette].tip_length = tip_length

    def _remove_tip(self, pipette: UUID):
        self._pipettes[pipette].hasTip = False
        self._pipettes[pipette].tip_length = 0.0

    def _has_tip(self, pipette: UUID) -> bool:
        return self._pipettes[pipette].hasTip

    def _pick_up_tip(self, pipette: UUID, tiprack: UUID):
        pip = self.get_pipette(pipette)
        mount = self._convert_to_mount(pip.mount_axis)
        lw_info = self.get_tiprack(tiprack)
        tip_length = self._deck[lw_info.slot].tip_length
        self._hardware.pick_up_tip(mount, tip_length)
        self._add_tip(pipette, tip_length)

    def _return_tip(self, pipette: UUID):
        pip = self.get_pipette(pipette)
        self._hardware.drop_tip(pip.mount_axis)
        self._remove_tip

    async def cache_instruments(self):
        await self.hardware.cache_instruments()
        new_dict = self._key_by_uuid(self.hardware.get_attached_instruments())
        self._pipettes.clear()
        self._pipettes.update(new_dict)

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    def get_pipette(self, uuid: UUID) -> Pipette:
        return self._pipettes[uuid]

    def get_tiprack(self, uuid: UUID):
        return self._labware_info[uuid]

    @property
    def pipettes(self) -> typing.Dict:
        return self._pipettes

    @property
    def pipette_status(self) -> typing.Dict:
        fields = list(PipetteStatus.__dataclass_fields__.keys())
        to_dict = {}
        for name, value in self.pipettes.items():
            data = asdict(value)
            to_dict[name] = {
                key: value for key, value in data.items() if key in fields}
        return to_dict

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
        self.session_type = 'check'
        self._moves = Moves()
        self._load_labware_objects()

    def _load_labware_objects(self):
        """
        A function that takes tiprack information and loads them onto the deck.
        """
        # curr_state = self.state_machine.current_state.name
        # assert curr_state == 'loadLabware',\
        #     f'You cannot build a labware object during {curr_state} state.'
        for name, data in self._labware_info.items():
            parent = self._deck.position_for(data.slot)
            self._deck[data.slot] = labware.Labware(data.definition, parent)
            self._moves.moveToTipRack[data.id] = Point(0, 0, 0)
        # self.state_machine.update_state()

    def _update_tiprack_offset(self, pipette: UUID) -> UUID:
        pip = self.get_pipette(pipette)
        tiprack_id = pip.tiprack_id
        mount = self._convert_to_mount(pip.mount_axis)
        old_offset = self._moves.moveToTipRack[tiprack_id]
        self._moves.moveToTipRack[tiprack_id] =\
            self._hardware.gantry_position(mount) + old_offset
        return tiprack_id

    async def delete_session(self):
        for name, data in self.pipettes.items():
            state1 = self.state_machine.get_state('moveToTipRack')
            self.state_machine.update_state(state1)
            position = {
                "location": Point(0, 0, 0), "locationId": data.tiprack_id}
            self.move(name, position)
            state2 = self.state_machine.get_state('dropTip')
            self.state_machine.update_state(state2)
            self.return_tip(name)
        await current_session.hardware.home()

    def pick_up_tip(self, pipette: UUID):
        tiprack_id = self._update_tiprack_offset(pipette)
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'pickUpTip',\
            f'You cannot pick up tip during {curr_state} state'
        self._pick_up_tip(pipette, tiprack_id)
        self.state_machine.update_state()

    def invalidate_tip(self, pipette: UUID):
        self.state_machine.update_state(self.state_machine.get_state('invalidateTip'))
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'invalidateTip',\
            f'You cannot remove a tip during {curr_state} state'
        self._remove_tip(pipette)

    def return_tip(self, pipette: UUID):
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'dropTip',\
            f'You cannot drop a tip during {curr_state} state'
        self._return_tip(pipette)
        self.state_machine.update_state()

    def move(self, pipette: UUID,
             position: typing.Dict[str, typing.Union[UUID, typing.List]]):
        curr_state = self.state_machine.current_state.name
        print(curr_state)
        get_position = getattr(self._moves, curr_state)
        print(get_position)
        print(type(get_position))
        offset = get_position[position["locationId"]]
        pt = Point(*position["location"]) + offset
        self.hardware.move(pipette, pt)
        self.state_machine.update_state()

    def jog(self, pipette: UUID, vector: typing.List):
        self._jog(pipette, Point(*vector))
        self.state_machine.update_state()
