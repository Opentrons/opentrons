import typing
from uuid import uuid4, UUID
from enum import Enum
from dataclasses import dataclass, asdict, field, fields

from opentrons.protocol_api.labware import Well
from opentrons.types import Mount, Point, Location
from opentrons.hardware_control.pipette import Pipette
from opentrons.hardware_control.types import Axis

from .constants import LOOKUP_LABWARE, TipAttachError
from .util import StateMachine, WILDCARD
from .models import AttachedPipette
from opentrons.hardware_control import ThreadManager
from opentrons.protocol_api import labware, geometry

"""
A set of endpoints that can be used to create a session for any robot
calibration tasks such as checking your calibration data, performing mount
offset or a robot deck transform.
"""


class SessionManager:
    """Small wrapper to keep track of robot calibration sessions created."""
    def __init__(self):
        self._sessions = {}

    @property
    def sessions(self):
        return self._sessions


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
    def list_fields(cls):
        return [obj.name for obj in fields(cls)]


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
class CheckMove:
    position: Point = Point(0, 0, 0)
    locationId: UUID = uuid4()


@dataclass
class PreparingPipetteMoveOffset:
    offset: Point
    well: Well


PreparingPipetteMove = typing.Dict[
    UUID, typing.Dict[UUID, PreparingPipetteMoveOffset]
]


@dataclass
class Moves:
    """This class is meant to encapsulate the different moves"""
    preparingPipette: PreparingPipetteMove = field(default_factory=dict)
    checkingPointOne: CheckMove = CheckMove()
    checkingPointTwo: CheckMove = CheckMove()
    checkingPointThree: CheckMove = CheckMove()
    checkingHeight: CheckMove = CheckMove()


class CalibrationSession:
    """Class that controls state of the current robot calibration session"""
    def __init__(self, hardware: ThreadManager):
        self._hardware = hardware
        self._relate_mount = self._key_by_uuid(
            hardware.get_attached_instruments()
        )
        self._deck = geometry.Deck()
        self._slot_options = ['8', '6']
        self._labware_info = self._determine_required_labware()
        self._moves = self._build_deck_moves()

    @classmethod
    async def build(cls, hardware: ThreadManager):
        await hardware.cache_instruments()
        await hardware.set_lights(rails=True)
        await hardware.home()

    @staticmethod
    def _key_by_uuid(new_pipettes: typing.Dict) -> typing.Dict:
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
        return Moves(checkingPointOne=self._build_cross_dict('1BLC'),
                     checkingPointTwo=self._build_cross_dict('3BRC'),
                     checkingPointThree=self._build_cross_dict('7TLC'),
                     checkingHeight=self._build_height_dict('5'))

    def _build_cross_dict(self, pos_id: str) -> CheckMove:
        cross_coords = self._deck.get_calibration_position(pos_id).position
        return CheckMove(position=Point(*cross_coords), locationId=uuid4())

    def _build_height_dict(self, slot: str) -> CheckMove:
        pos = Point(*self._deck.get_slot_center(slot))
        updated_pos = pos - Point(20, 0, pos.z)
        return CheckMove(position=updated_pos, locationId=uuid4())

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

class CalibrationCheckState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingPipette = "preparingPipette"
    inspectingTip = "inspectingTip"
    checkingPointOne = "checkingPointOne"
    checkingPointTwo = "checkingPointTwo"
    checkingPointThree = "checkingPointThree"
    checkingHeight = "checkingHeight"
    returningTip = "returningTip"
    sessionExited = "sessionExited"
    badCalibrationData = "badCalibrationData"
    noPipettesAttached = "noPipettesAttached"


class CalibrationCheckTrigger(str, Enum):
    load_labware = "load_labware"
    prepare_pipette = "prepare_pipette"
    jog = "jog"
    pick_up_tip = "pick_up_tip"
    confirm_tip_attached = "confirm_tip_attached"
    invalidate_tip = "invalidate_tip"
    confirm_step = "confirm_step"
    exit = "exit"
    reject_calibration = "reject_calibration"
    no_pipettes = "no_pipettes"


CHECK_TRANSITIONS = [
    {
        "trigger": CalibrationCheckTrigger.load_labware,
        "from_state": CalibrationCheckState.sessionStarted,
        "to_state": CalibrationCheckState.labwareLoaded,
        "before": "_load_labware_objects"
    },
    {
        "trigger": CalibrationCheckTrigger.prepare_pipette,
        "from_state": CalibrationCheckState.labwareLoaded,
        "to_state": CalibrationCheckState.preparingPipette,
        "before": "_prepare_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.preparingPipette,
        "to_state": CalibrationCheckState.preparingPipette,
        "before": "_jog_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.pick_up_tip,
        "from_state": CalibrationCheckState.preparingPipette,
        "to_state": CalibrationCheckState.inspectingTip,
        "before": "_pick_up_pipette_tip"
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_tip_attached,
        "from_state": CalibrationCheckState.inspectingTip,
        "to_state": CalibrationCheckState.checkingPointOne,
        "before": "_check_point_one"
    },
    {
        "trigger": CalibrationCheckTrigger.invalidate_tip,
        "from_state": CalibrationCheckState.inspectingTip,
        "to_state": CalibrationCheckState.preparingPipette,
        "before": "_invalidate_tip"
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.checkingPointOne,
        "to_state": CalibrationCheckState.checkingPointOne,
        "before": "_jog_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_step,
        "from_state": CalibrationCheckState.checkingPointOne,
        "to_state": CalibrationCheckState.checkingPointTwo,
        "before": "_check_point_two",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.checkingPointTwo,
        "to_state": CalibrationCheckState.checkingPointTwo,
        "before": "_jog_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_step,
        "from_state": CalibrationCheckState.checkingPointTwo,
        "to_state": CalibrationCheckState.checkingPointThree,
        "before": "_check_point_three",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.checkingPointThree,
        "to_state": CalibrationCheckState.checkingPointThree,
        "before": "_jog_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_step,
        "from_state": CalibrationCheckState.checkingPointThree,
        "to_state": CalibrationCheckState.checkingHeight,
        "before": "_check_height"
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.checkingHeight,
        "to_state": CalibrationCheckState.checkingHeight,
        "before": "_jog_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_step,
        "from_state": CalibrationCheckState.checkingHeight,
        "to_state": CalibrationCheckState.returningTip,
        "after": "_return_tip_for_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.exit,
        "from_state": WILDCARD,
        "to_state": CalibrationCheckState.sessionExited
    },
    {
        "trigger": CalibrationCheckTrigger.reject_calibration,
        "from_state": WILDCARD,
        "to_state": CalibrationCheckState.badCalibrationData
    },
    {
        "trigger": CalibrationCheckTrigger.no_pipettes,
        "from_state": WILDCARD,
        "to_state": CalibrationCheckState.noPipettesAttached
    }
]


class CheckCalibrationSession(CalibrationSession, StateMachine):
    def __init__(self, hardware: 'ThreadManager'):
        CalibrationSession.__init__(self, hardware)
        StateMachine.__init__(self, states=[s for s in CalibrationCheckState],
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
                well_name = 'H1' if pip['channels'] == 8 else 'A1'
                well = lw.wells_by_name()[well_name]
                build_dict[id] = PreparingPipetteMoveOffset(
                    offset=Point(0, 0, 10), well=well
                )
            full_dict[data.id] = build_dict
        self._moves.preparingPipette = full_dict

    def _update_tiprack_offset(self, pipette: UUID, old_pos: Point,
                               new_pos: Point):
        id = self._relate_mount[pipette]['tiprack_id']

        if self._moves.preparingPipette:
            old_offset = self._moves.preparingPipette[id][pipette].offset
            updated_offset = (new_pos - old_pos) + old_offset
            self._moves.preparingPipette[id][pipette].offset = updated_offset

    async def delete_session(self):
        for mount_id in self._relate_mount.keys():
            try:
                await self._return_tip(mount_id)
            except TipAttachError:
                pass
        await self.hardware.home()
        await self.hardware.set_lights(rails=False)

    async def _pick_up_pipette_tip(self, pipette: UUID, **kwargs):
        """
        Function to pick up tip. It will attempt to pick up a tip in
        the current location, and save any offset it might have from the
        original position.
        """
        if self._has_tip(pipette):
            raise TipAttachError()
        tiprack_id = self._relate_mount[pipette]['tiprack_id']
        mount = self._get_mount(pipette)
        await self._pick_up_tip(mount, tiprack_id)

    async def _invalidate_tip(self, pipette: UUID, **kwargs):
        if not self._has_tip(pipette):
            raise TipAttachError()
        await self.hardware.remove_tip(self._get_mount(pipette))

    async def _return_tip_for_pipette(self, pipette_id: UUID, **kwargs):
        if not self._has_tip(pipette_id):
            raise TipAttachError()
        await self._prepare_pipette(pipette_id=pipette_id)
        await self._return_tip(self._get_mount(pipette_id))

    @staticmethod
    def _create_tiprack_param(position: typing.Dict):
        new_dict = {}
        for loc, data in position.items():
            for loc_id, values in data.items():
                offset = list(values['offset'])
                pos_dict = {'offset': offset, 'locationId': loc.hex}
                new_dict[loc_id.hex] = {'pipetteId': loc_id.hex,
                                        'location': pos_dict}
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

    async def _prepare_pipette(self, pipette_id: UUID):
        tiprack_id = self._relate_mount[pipette_id]['tiprack_id']
        moves_for_step = self._moves.preparingPipette
        single_location = moves_for_step[tiprack_id]
        offset = single_location[pipette_id].offset
        loc_to_move = single_location[pipette_id].well
        pt, well = loc_to_move.top()
        updated_pt = pt + offset
        await self._move(pipette_id, Location(updated_pt, well))

    async def _check_point_one(self, pipette_id: UUID):
        await self._move(pipette_id,
                         Location(self._moves.checkingPointOne.position,
                                  None))

    async def _check_point_two(self, pipette_id: UUID):
        await self._move(pipette_id,
                         Location(self._moves.checkingPointTwo.position,
                                  None))

    async def _check_point_three(self, pipette_id: UUID):
        await self._move(pipette_id,
                         Location(self._moves.checkingPointThree.position,
                                  None))

    async def _check_height(self, pipette_id: UUID):
        await self._move(pipette_id,
                         Location(self._moves.checkingHeight.position,
                                  None))

    async def _move(self,
                    pipette_id: UUID,
                    request_position: Location):

        # determine current location
        mount = self._get_mount(pipette_id)
        from_pt = await self.hardware.gantry_position(mount)
        from_loc = Location(from_pt, None)

        max_height = self.hardware.get_instrument_max_height(mount)
        moves = geometry.plan_moves(from_loc, request_position,
                                    self._deck, max_height)
        for move in moves:
            await self.hardware.move_to(mount, move[0], move[1])

    async def _jog_pipette(self, pipette: UUID, vector: Point, **kwargs):
        mount = self._get_mount(pipette)
        old_pos = await self.hardware.gantry_position(mount)
        await super(self.__class__, self)._jog(mount, vector)
        new_pos = await self.hardware.gantry_position(mount)
        self._update_tiprack_offset(pipette, old_pos, new_pos)
