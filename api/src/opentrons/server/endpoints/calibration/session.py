import typing
from uuid import uuid4, UUID
from dataclasses import dataclass, asdict, field, fields

from opentrons.types import Mount, Point, Location
from opentrons.hardware_control.pipette import Pipette
from opentrons.hardware_control.types import Axis

from .constants import LOOKUP_LABWARE, LabwareLoaded, TipAttachError
from .util import StateMachine
from .models import AttachedPipette
from opentrons.hardware_control import ThreadManager
from opentrons.protocol_api import labware, geometry

"""
A set of endpoints that can be used to create a session for any robot
calibration tasks such as checking your calibration data, performing mount
offset or a robot deck transform.
"""

_MoveKey = typing.TypeVar('_MoveKey')
_MoveValue = typing.TypeVar('_MoveValue')
MoveType = typing.Optional[typing.Dict[_MoveKey, _MoveValue]]
# Note, tried to restrict PositionType to
# typing.Dict[str, typing.Union[UUID, Point]], but mypy would not allow
# typing of individual keys at that point (after indexing)
PositionType = typing.Dict[str, typing.Any]


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
    preparingPipette: MoveType = field(default_factory=dict)
    checkingPointOne: MoveType = field(default_factory=dict)
    checkingPointTwo: MoveType = field(default_factory=dict)
    checkingPointThree: MoveType = field(default_factory=dict)
    checkingHeight: MoveType = field(default_factory=dict)


class CalibrationSession:
    """Class that controls state of the current robot calibration session"""
    def __init__(self, hardware: ThreadManager):
        self._hardware = hardware
        self._relate_mount =\
            self._key_by_uuid(hardware.get_attached_instruments())
        self._deck = geometry.Deck()
        self._slot_options = ['8', '6']
        self._labware_info = self._determine_required_labware()
        self._moves = self._build_deck_moves()

    @classmethod
    async def build(self, hardware: ThreadManager):
        await hardware.cache_instruments()
        await hardware.set_lights(rails=True)
        await hardware.home()

    def _key_by_uuid(self, new_pipettes: typing.Dict) -> typing.Dict:
        pipette_dict = {}
        for mount, data in new_pipettes.items():
            # TODO: Adding in error state is out of scope for this PR.
            # This is to ensure during testing that two pipettes are
            # attached -- for now.
            assert data, "Please attach pipettes before proceeding"

            token = uuid4()
            pipette_dict[token] = {'mount': mount, 'tiprack_id': None}
        return pipette_dict

    def _determine_required_labware(self) -> typing.Dict[UUID, LabwareInfo]:
        """
        A function that inserts tiprack information into two dataclasses
        :py:class:`.LabwareInfo` and :py:class:`.LabwareDefinition` based
        on the current pipettes attached.
        """
        lw: typing.Dict[UUID, LabwareInfo] = {}
        _uuid: typing.Optional[UUID] = None

        for id in self._relate_mount.keys():
            mount = self._get_mount(id)
            pip_vol = self.get_pipette(mount)['max_volume']

            _lookup = LOOKUP_LABWARE[str(pip_vol)]
            load_name: str = _lookup.load_name

            if_labware = None
            if _uuid:
                if_labware = lw.get(_uuid)
            if _uuid and if_labware and if_labware.loadName == load_name:
                lw[_uuid].forPipettes.append(id)
                self._relate_mount[id]['tiprack_id'] = _uuid
            else:
                lw_def = labware.get_labware_definition(load_name)
                new_uuid: UUID = uuid4()
                _uuid = new_uuid
                slot = self._available_slot_options()
                lw[new_uuid] = LabwareInfo(
                    alternatives=list(_lookup.alternatives),
                    forPipettes=[id],
                    loadName=load_name,
                    slot=slot,
                    namespace=lw_def['namespace'],
                    version=lw_def['version'],
                    id=new_uuid,
                    definition=lw_def)
                self._relate_mount[id]['tiprack_id'] = new_uuid
        return lw

    def _build_deck_moves(self) -> Moves:
        checkone = self._build_cross_dict('1BLC')
        checktwo = self._build_cross_dict('3BRC')
        checkthree = self._build_cross_dict('7TLC')
        height = self._build_height_dict('5')
        return Moves(checkingPointOne=self._build_cross_dict('1BLC'),
                     checkingPointTwo=self._build_cross_dict('3BRC'),
                     checkingPointThree=self._build_cross_dict('7TLC'),
                     checkingHeight=self._build_height_dict('5'))

    def _build_cross_dict(self, pos_id: str) -> typing.Dict:
        cross_coords = self._deck.get_calibration_position(pos_id).position
        return {'position': Point(*cross_coords), 'locationId': uuid4()}

    def _build_height_dict(self, slot: str) -> typing.Dict:
        pos = Point(*self._deck.get_slot_center(slot))
        updated_pos = pos - Point(20, 0, pos.z)
        return {'position': updated_pos, 'locationId': uuid4()}

    def _available_slot_options(self) -> str:
        if self._slot_options:
            return self._slot_options.pop(0)
        else:
            raise KeyError("No available slots remaining")

    def _get_mount(self, pipette: UUID) -> Mount:
        return self._relate_mount[pipette]['mount']

    async def _jog(self, mount: Mount, vector: Point):
        """
        General function that can be used by all session types to jog around
        a specified pipette.
        """
        await self.hardware.move_rel(mount, vector)

    def _has_tip(self, pipette: UUID) -> bool:
        pip = self.get_pipette(self._get_mount(pipette))
        return bool(pip['has_tip'])

    async def _pick_up_tip(self, mount: Mount, tiprack_id: UUID):
        pip = self.get_pipette(mount)
        if tiprack_id:
            lw_info = self.get_tiprack(tiprack_id)
            # Note: ABC DeckItem cannot have tiplength b/c of
            # mod geometry contexts. Ignore type checking error here.
            tip_length = self._deck[lw_info.slot].tip_length  # type: ignore
        else:
            tip_length = pip['fallback_tip_length']
        await self.hardware.pick_up_tip(mount, tip_length)

    async def _return_tip(self, mount: Mount):
        await self.hardware.drop_tip(mount)

    async def cache_instruments(self):
        await self.hardware.cache_instruments()
        new_dict = self._key_by_uuid(self.hardware.get_attached_instruments())
        self._relate_mount.clear()
        self._relate_mount.update(new_dict)

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    def get_pipette(self, mount: Mount) -> Pipette.DictType:
        return self.pipettes[mount]

    def get_tiprack(self, uuid: UUID) -> LabwareInfo:
        return self._labware_info[uuid]

    @property
    def pipettes(self) -> typing.Dict[Mount, Pipette.DictType]:
        return self.hardware.attached_instruments

    @property
    def pipette_status(self) -> typing.Dict[str, AttachedPipette]:
        """
        Public property to help format the current labware status of a given
        session for the client.

        Note:
        Pydantic restricts dictionary keys that can be evaluated. Since
        the session pipettes dictionary has a UUID as a key, we must first
        convert the UUID to a hex string.
        """
        # pydantic restricts dictionary keys that can be evaluated. Since
        # the session pipettes dictionary has a UUID as a key, we must first
        # convert the UUID to a hex string.
        fields = PipetteStatus.list_fields()
        to_dict = {}
        for id, data in self._relate_mount.items():
            pip = self.get_pipette(data['mount'])
            tip_id = data['tiprack_id']
            temp_dict = {
                key: value for key, value in pip.items() if key in fields}
            if tip_id:
                temp_dict['tiprack_id'] = tip_id.hex
            to_dict[id.hex] = AttachedPipette(**temp_dict)
        return to_dict

    @property
    def labware_status(self) -> typing.Dict:
        """
        Public property to help format the current labware status of a given
        session for the client.

        Note:
        Pydantic restricts dictionary keys that can be evaluated. Since
        the session labware dictionary has a UUID as a key, we must first
        convert the UUID to a hex string.
        """

        to_dict = {}
        for name, value in self._labware_info.items():
            temp_dict = asdict(value)
            del temp_dict['definition']
            to_dict[name.hex] = temp_dict
        return to_dict

# TODO: BC: move the check specific stuff to the check sub dir
CHECK_STATES = [
    'sessionStarted',
    'labwareLoaded',
    'preparingPipette',
    'inspectingTip',
    'checkingPointOne',
    'checkingPointTwo',
    'checkingPointThree',
    'checkingHeight',
    'returningTip',
    'sessionExited',
    'badCalibrationData',
    'noPipettesAttached'
]

CHECK_TRANSITIONS= [
    {
        "trigger": "load_labware",
        "from_state": "sessionStarted",
        "to_state": "labwareLoaded",
        "before": "_load_labware_objects"
    },
    {
        "trigger": "prepare_pipette",
        "from_state": "labwareLoaded",
        "to_state": "preparingPipette",
        "before": "_move"
    },
    {
        "trigger": "jog",
        "from_state": "preparingPipette",
        "to_state": "preparingPipette",
        "before": "_jog"
    },
    {
        "trigger": "pick_up_tip",
        "from_state": "preparingPipette",
        "to_state": "inspectingTip",
        "before": "_pick_up_tip"
    },
    {
        "trigger": "confirm_tip_attached",
        "from_state": "inspectingTip",
        "to_state": "checkingPointOne",
        "before": "_move"
    },
    {
        "trigger": "invalidate_tip",
        "from_state": "inspectingTip",
        "to_state": "preparingPipette",
        "before": "_invalidate_tip"
    },
    {
        "trigger": "jog",
        "from_state": "checkingPointOne",
        "to_state": "checkingPointOne",
        "before": "_jog"
    },
    {
        "trigger": "confirm_step",
        "from_state": "checkingPointOne",
        "to_state": "checkingPointTwo",
        "before": "_move",
    },
    {
        "trigger": "jog",
        "from_state": "checkingPointTwo",
        "to_state": "checkingPointTwo",
        "before": "_jog"
    },
    {
        "trigger": "confirm_step",
        "from_state": "checkingPointTwo",
        "to_state": "checkingPointThree",
        "before": "_move",
    },
    {
        "trigger": "jog",
        "from_state": "checkingPointThree",
        "to_state": "checkingPointThree",
        "before": "_jog"
    },
    {
        "trigger": "confirm_step",
        "from_state": "checkingPointThree",
        "to_state": "checkingHeight",
        "before": "_move"
    },
    {
        "trigger": "jog",
        "from_state": "checkingHeight",
        "to_state": "checkingHeight",
        "before": "_jog"
    },
    {
        "trigger": "confirm_step",
        "from_state": "checkingHeight",
        "to_state": "returningTip",
        "after": "_return_tip_for_pipette"
    },
    {
        "trigger": "exit",
        "from_state": "*",
        "to_state": "sessionExited"
    },
    {
        "trigger": "reject_calibration",
        "from_state": "*",
        "to_state": "badCalibrationData"
    },
    {
        "trigger": "no_pipettes",
        "from_state": "*",
        "to_state": "noPipettesAttached"
    }
]

class CheckCalibrationSession(CalibrationSession, StateMachine):
    def __init__(self, hardware: 'ThreadManager'):
        CalibrationSession.__init__(self, hardware)
        StateMachine.__init__(self, states=CHECK_STATES,
                              transitions=CHECK_TRANSITIONS,
                              initial_state="sessionStarted")
        self.session_type = 'check'

    async def _load_labware_objects(self, **kwargs):
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
                mount = self._get_mount(id)
                pip = self.get_pipette(mount)
                if pip['channels'] == 8:
                    well = lw.wells_by_name()['H1']
                else:
                    well = lw.wells_by_name()['A1']
                build_dict[id] = {'offset': Point(0, 0, 10), 'well': well}
            full_dict[data.id] = build_dict
        self._moves.preparingPipette = full_dict

    def _update_tiprack_offset(self, pipette: UUID, old_pos: Point, new_pos: Point):
        id = self._relate_mount[pipette]['tiprack_id']

        if self._moves.preparingPipette:
            old_offset = self._moves.preparingPipette[id][pipette]['offset']
            updated_offset = (new_pos - old_pos) + old_offset
            self._moves.preparingPipette[id][pipette].update(offset=updated_offset)  # NOQA(E501)

    async def delete_session(self):
        for id in self._relate_mount.keys():
            try:
                await self.return_tip(id)
            except TipAttachError:
                pass
        await self.hardware.home()
        await self.hardware.set_lights(rails=False)

    async def _pick_up_tip(self, pipette: UUID, **kwargs):
        """
        Function to pick up tip. It will attempt to pick up a tip in
        the current location, and save any offset it might have from the
        original position.
        """
        if self._has_tip(pipette):
            raise TipAttachError()
        id = self._relate_mount[pipette]['tiprack_id']
        mount = self._get_mount(pipette)
        await self._pick_up_tip(mount, id)

    async def _invalidate_tip(self, pipette: UUID, **kwargs):
        if not self._has_tip(pipette):
            raise TipAttachError()
        await self.hardware.remove_tip(self._get_mount(pipette))

    async def _move_to_tiprack_for_pipette(self, pipette_id: UUID):
        print(f'FROM move to tiprack for pip {pipette_id}')
        # id = self._relate_mount[pipette_id]['tiprack_id']
        # offset_dict = self._moves.moveToTipRack[id]
        # loc = offset_dict[pipette_id]['offset']
        # await self._move(pipette_id=pipette_id),
        #                  request_location={"offset": loc, "locationId": id})

    async def _return_tip_for_pipette(self, pipette: UUID, **kwargs):
        if not self._has_tip(pipette):
            raise TipAttachError()
        await self._move_to_tiprack_for_pipette(pipette)
        await self._return_tip(self._get_mount(pipette))

    def _create_tiprack_param(self, position: typing.Dict):
        new_dict = {}
        for loc, data in position.items():
            for id, values in data.items():
                offset = list(values['offset'])
                pos_dict = {'offset': offset, 'locationId': loc.hex}
                new_dict[id.hex] = {'pipetteId': id.hex, 'location': pos_dict}
        return new_dict

    def _format_move_params(
            self, position: typing.Dict, next_state: str) -> typing.Dict:
        if next_state == 'moveToTipRack':
            new_dict = self._create_tiprack_param(position)
        else:
            new_dict = {}
            for id in self._relate_mount.keys():
                pos_dict = {'position': list(position['position']),
                            'locationId': position['locationId'].hex}
                new_dict[id.hex] = {'location': pos_dict, 'pipetteId': id.hex}
        return new_dict

    def _format_other_params(self, template: typing.Dict) -> typing.Dict:
        new_dict = {}
        for id in self._relate_mount.keys():
            blank = template.copy()
            blank.update(pipetteId=id.hex)
            new_dict[id.hex] = blank
        return new_dict

    def format_params(self, next_state: str) -> typing.Dict:
        if hasattr(self._moves, next_state):
            move_dict = getattr(self._moves, next_state)
            new_dict = self._format_move_params(move_dict, next_state)
        else:
            if next_state == 'jog':
                template_dict = dict(pipetteId=None, vector=[0, 0, 0])
            else:
                template_dict = dict(pipetteId=None)
            new_dict = self._format_other_params(template_dict)
        return new_dict

    def _determine_move_location(
            self,
            pos: typing.Dict,
            input: PositionType,
            pip_id: UUID) -> Location:
        loc_id = input['locationId']
        if input.get('offset'):
            single_location = pos[loc_id]
            loc_to_move = single_location[pip_id].get('well')
            pt, well = loc_to_move.top()
            offset = input['offset']
            updated_pt = pt + offset
            return Location(updated_pt, well)
        elif input.get('position'):
            loc_to_move = input['position']
            return Location(loc_to_move, None)
        else:
            return Location(pos, None)

    async def _move(self,
                    pipette_id: UUID,
                    to_state: str,
                    request_location: PositionType = None,
                    **kwargs):
        print(f'FROM _MOVE pip id {pipette_id}')
        print(f'FROM _MOVE {getattr(self._moves, to_state)}')
        tiprack_id = self._relate_mount[pipette_id]['tiprack_id']
        to_loc= getattr(self._moves, to_state)[tiprack_id][pipette_id]
        print(f'FROM _MOVE loc === {to_loc}')

        # determine current location
        mount = self._get_mount(pipette_id)
        from_pt = await self.hardware.gantry_position(mount)
        from_loc = Location(from_pt, None)

        max_height = self.hardware.get_instrument_max_height(mount)
        moves = geometry.plan_moves(from_loc, to_loc, self._deck, max_height)
        for move in moves:
            await self.hardware.move_to(mount, move[0], move[1])

    async def _jog(self, pipette: UUID, vector: Point, **kwargs):
        mount = self._get_mount(pipette)
        old_pos = await self.hardware.gantry_position(mount)
        await self._jog(mount, vector)
        new_pos = await self.hardware.gantry_position(mount)
        self._update_tiprack_offset(pipette, old_pos, new_pos)
