import typing
from uuid import uuid4, UUID
from dataclasses import dataclass, asdict, field, fields

from opentrons.types import Mount, Point, Location
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

_KT = typing.TypeVar('_KT')
_VT = typing.TypeVar('_VT')
MoveType = typing.Optional[typing.Dict[_KT, _VT]]
PositionType =\
    typing.Dict[str, typing.Union[typing.Optional[UUID], typing.List]]


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
    fallback_tip_length: typing.Optional[float]
    mount_axis: Axis
    plunger_axis: typing.Optional[Axis]
    pipette_id: typing.Optional[str]
    has_tip: bool
    max_volume: int
    channels: int
    tip_overlap: typing.Dict[str, int]
    return_tip_height: int
    tiprack_id: typing.Optional[UUID] = field(default_factory=UUID)

    @classmethod
    def list_fields(self):
        return [obj.name for obj in fields(self)]


@dataclass
class PipetteStatus:
    model: str
    name: str
    tip_length: float
    mount_axis: Axis
    plunger_axis: Axis
    pipette_uuid: Axis
    has_tip: bool
    tiprack_id: UUID

    @classmethod
    def list_fields(self):
        return [obj.name for obj in fields(self)]


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
    moveToTipRack: MoveType = field(default_factory=dict)
    checkPointOne: MoveType = field(default_factory=dict)
    checkPointTwo: MoveType = field(default_factory=dict)
    checkPointThree: MoveType = field(default_factory=dict)
    checkHeight: MoveType = field(default_factory=dict)


class CalibrationSession:
    """Class that controls state of the current deck calibration session"""
    def __init__(self, hardware: ThreadManager):
        self._hardware = hardware
        self._pipettes = self._key_by_uuid(hardware.get_attached_instruments())
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
            fields = Pipette.list_fields()

            updated_data = {
                key: value for key, value in data.items() if key in fields}
            token = uuid4()
            instr = self.hardware._attached_instruments[mount]
            pipette_dict[token] = Pipette(
                mount_axis=Axis.by_mount(mount),
                plunger_axis=Axis.of_plunger(mount),
                fallback_tip_length=instr._fallback_tip_length,
                tiprack_id=None,
                **updated_data)
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

    async def _jog(self, pipette: UUID, vector: Point):
        """
        General function that can be used by all session types to jog around
        a specified pipette.
        """
        pip = self.get_pipette(pipette)
        await self.hardware.move_rel(
            self._convert_to_mount(pip.mount_axis), vector)

    def _add_tip(self, pipette: UUID, tip_length: float):
        self._pipettes[pipette].has_tip = True
        self._pipettes[pipette].tip_length = tip_length

    def _remove_tip(self, pipette: UUID):
        self._pipettes[pipette].has_tip = False
        self._pipettes[pipette].tip_length = 0.0

    def _has_tip(self, pipette: UUID) -> bool:
        return self._pipettes[pipette].has_tip

    async def _pick_up_tip(self, pipette: UUID):
        pip = self.get_pipette(pipette)
        mount = self._convert_to_mount(pip.mount_axis)
        if pip.tiprack_id:
            lw_info = self.get_tiprack(pip.tiprack_id)
            # TODO: Figure out how to cleanly handle this scenario.
            # ABC DeckItem cannot have tiplength b/c of mod geometry contexts.
            tip_length = self._deck[lw_info.slot].tip_length  # type: ignore
        else:
            tip_length = pip.fallback_tip_length
        await self.hardware.pick_up_tip(mount, tip_length)
        self._add_tip(pipette, tip_length)

    async def _return_tip(self, pipette: UUID):
        pip = self.get_pipette(pipette)
        await self.hardware.drop_tip(self._convert_to_mount(pip.mount_axis))
        self._remove_tip(pipette)

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
        fields = PipetteStatus.list_fields()
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

    def load_labware_objects(self):
        """
        A function that takes tiprack information and loads them onto the deck.
        """
        full_dict = {}
        for name, data in self._labware_info.items():
            parent = self._deck.position_for(data.slot)
            lw = labware.Labware(data.definition, parent)
            self._deck[data.slot] = lw
            build_dict = {}
            for id in data.forPipettes:
                pip = self.get_pipette(id)
                if pip.channels == 8:
                    well = lw.wells_by_name()['H1']
                else:
                    well = lw.wells_by_name()['A1']
                build_dict[id] = {'offset': Point(0, 0, 10), 'well': well}
            full_dict[data.id] = build_dict
        self._moves.moveToTipRack = full_dict
        self.state_machine.update_state()

    def _update_tiprack_offset(
            self, pipette: UUID, old_pos: Point, new_pos: Point):
        pip = self.get_pipette(pipette)
        tiprack_id = pip.tiprack_id
        update_dict = getattr(self._moves, 'moveToTipRack')
        old_offset = update_dict[tiprack_id][pipette]['offset']
        updated_offset = (new_pos - old_pos) + old_offset
        update_dict[tiprack_id][pipette].update(offset=updated_offset)
        self._moves.moveToTipRack = {tiprack_id: update_dict}

    async def delete_session(self):
        for name, data in self.pipettes.items():
            if self._has_tip(name):
                await self.return_tip(name)
        await self.hardware.home()
        await self.hardware.set_lights(rails=False)

    async def pick_up_tip(self, pipette: UUID):
        """
        Function to pick up tip. It will attempt to pick up a tip in
        the current location, and save any offset it might have from the
        original position.
        """
        self.state_machine.update_state()
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'pickUpTip',\
            f'You cannot pick up tip during {curr_state} state'
        await self._pick_up_tip(pipette)

    def invalidate_tip(self, pipette: UUID):
        to_state = self.state_machine.get_state('invalidateTip')
        self.state_machine.update_state(to_state)
        curr_state = self.state_machine.current_state.name
        assert curr_state == 'invalidateTip',\
            f'You cannot remove a tip during {curr_state} state'
        self._remove_tip(pipette)

    async def _move_to_tiprack(self, pipette: UUID):
        pip = self.get_pipette(pipette)
        get_position = getattr(self._moves, 'moveToTipRack')
        offset_dict = get_position[pip.tiprack_id]
        if offset_dict:
            loc = offset_dict[pipette]['offset']
        else:
            loc = Point(0, 0, 0)
        state = self.state_machine.get_state('moveToTipRack')
        self.state_machine.update_state(state)
        await self.move(pipette, {"offset": loc, "locationId": pip.tiprack_id})

    async def return_tip(self, pipette: UUID):
        await self._move_to_tiprack(pipette)
        await self._return_tip(pipette)
        state = self.state_machine.get_state('dropTip')
        self.state_machine.update_state(state)

    def format_move_params(self, next_state: str) -> typing.Dict:
        get_position = getattr(self._moves, next_state)
        new_dict = {}
        for loc, data in get_position.items():
            for id, values in data.items():
                offset = list(values['offset'])
                new_dict[id.hex] = {"offset": offset, "locationId": loc.hex}
        return new_dict

    def _determine_move_location(
            self, pos: typing.Dict, pip: UUID, offset: Point) -> Location:
        loc_to_move = pos[pip].get('well')
        if loc_to_move:
            pt, well = pos[pip]['well'].top()
            updated_pt = pt + offset
            return Location(updated_pt, well)
        else:
            # TODO Placeholder until cross moves are added in.
            return Location(Point(0, 0, 0), None)

    async def move(self, pipette: UUID,
                   position: PositionType):

        check_state = self.state_machine.current_state
        if not self.state_machine.requires_move(check_state):
            self.state_machine.update_state()
        curr_state = self.state_machine.current_state.name
        get_position = getattr(self._moves, curr_state)
        loc_id = position['locationId']
        # You have to unpack a list into a NamedTuple, but mypy does not
        # recognize this.
        offset = Point(*position['offset'])  # type: ignore
        to_loc = self._determine_move_location(
            get_position[loc_id], pipette, offset)

        # determine current location
        mount = self._convert_to_mount(self.get_pipette(pipette).mount_axis)
        from_pt = await self.hardware.gantry_position(mount)
        from_loc = Location(from_pt, None)

        max_height = self.hardware.get_instrument_max_height(mount)
        moves = geometry.plan_moves(from_loc, to_loc, self._deck, max_height)
        for move in moves:
            await self.hardware.move_to(mount, move[0], move[1])

    async def jog(self, pipette: UUID, vector: typing.List):
        mount = self._convert_to_mount(self.get_pipette(pipette).mount_axis)
        old_pos = await self.hardware.gantry_position(mount)
        await self._jog(pipette, Point(*vector))
        new_pos = await self.hardware.gantry_position(mount)
        self._update_tiprack_offset(pipette, old_pos, new_pos)
