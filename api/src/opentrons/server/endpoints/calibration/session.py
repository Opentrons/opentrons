import typing
from uuid import uuid4, UUID
from enum import Enum
from dataclasses import dataclass, asdict, fields

from opentrons.protocol_api.labware import Well
from opentrons.types import Mount, Point, Location
from opentrons.hardware_control.pipette import Pipette
from opentrons.hardware_control.types import Axis, CriticalPoint

from .constants import LOOKUP_LABWARE, TipAttachError
from .util import StateMachine, WILDCARD
from .models import AttachedPipette, ComparisonStatus
from opentrons.hardware_control import ThreadManager
from opentrons.protocol_api import labware, geometry

"""
A set of endpoints that can be used to create a session for any robot
calibration tasks such as joggingTo your calibration data, performing mount
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

    :note: The UUID class is utilized here instead of UUID4 for type joggingTo
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
class Moves:
    """A mapping of calibration check state to gantry move parameters"""
    preparingFirstPipette: CheckMove = CheckMove()
    preparingSecondPipette: CheckMove = CheckMove()
    joggingFirstPipetteToHeight: CheckMove = CheckMove()
    joggingFirstPipetteToPointOne: CheckMove = CheckMove()
    joggingFirstPipetteToPointTwo: CheckMove = CheckMove()
    joggingFirstPipetteToPointThree: CheckMove = CheckMove()
    joggingSecondPipetteToHeight: CheckMove = CheckMove()
    joggingSecondPipetteToPointOne: CheckMove = CheckMove()


TRASH_TIP_OFFSET = Point(10, 10, 0)  # vector from front bottom left of slot 12


class CalibrationSession:
    """Class that controls state of the current robot calibration session"""
    def __init__(self, hardware: ThreadManager):
        self._hardware = hardware
        self._pip_info_by_id = self._key_by_uuid(
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
            if data:
                pipette_id = uuid4()
                pipette_dict[pipette_id] = {'mount': mount, 'tiprack_id': None}
        return pipette_dict

    def _determine_required_labware(self) -> typing.Dict[UUID, LabwareInfo]:
        """
        A function that inserts tiprack information into two dataclasses
        :py:class:`.LabwareInfo` and :py:class:`.LabwareDefinition` based
        on the current pipettes attached.
        """
        lw: typing.Dict[UUID, LabwareInfo] = {}
        _uuid: typing.Optional[UUID] = None

        for pipette_id in self._pip_info_by_id.keys():
            mount = self._get_mount(pipette_id)
            pip_vol = self.get_pipette(mount)['max_volume']

            _lookup = LOOKUP_LABWARE[str(pip_vol)]
            load_name: str = _lookup.load_name
            lw_def = labware.get_labware_definition(load_name)
            new_uuid: UUID = uuid4()
            _uuid = new_uuid
            slot = self._available_slot_options()
            lw[new_uuid] = LabwareInfo(
                alternatives=list(_lookup.alternatives),
                forPipettes=[pipette_id],
                loadName=load_name,
                slot=slot,
                namespace=lw_def['namespace'],
                version=lw_def['version'],
                id=new_uuid,
                definition=lw_def)
            self._pip_info_by_id[pipette_id]['tiprack_id'] = new_uuid
        return lw

    def _build_deck_moves(self) -> Moves:
        return Moves(
                joggingFirstPipetteToHeight=self._build_height_dict('5'),
                joggingFirstPipetteToPointOne=self._build_cross_dict('1BLC'),
                joggingFirstPipetteToPointTwo=self._build_cross_dict('3BRC'),
                joggingFirstPipetteToPointThree=self._build_cross_dict('7TLC'),
                joggingSecondPipetteToHeight=self._build_height_dict('5'),
                joggingSecondPipetteToPointOne=self._build_cross_dict('1BLC'))

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

    def _get_mount(self, pipette_id: UUID) -> Mount:
        return self._pip_info_by_id[pipette_id]['mount']

    async def _jog(self, mount: Mount, vector: Point):
        """
        General function that can be used by all session types to jog around
        a specified pipette.
        """
        await self.hardware.move_rel(mount, vector)

    def _has_tip(self, pipette_id: UUID) -> bool:
        pip = self.get_pipette(self._get_mount(pipette_id))
        return bool(pip['has_tip'])

    async def _pick_up_tip(self, mount: Mount):
        tiprack_id = next(pip_info['tiprack_id'] for id, pip_info in
                          self._pip_info_by_id.items() if
                          pip_info['mount'] == mount)
        if tiprack_id:
            lw_info = self.get_tiprack(tiprack_id)
            # Note: ABC DeckItem cannot have tiplength b/c of
            # mod geometry contexts. Ignore type joggingTo error here.
            tip_length = self._deck[lw_info.slot].tip_length  # type: ignore
        else:
            tip_length = self.get_pipette(mount)['fallback_tip_length']
        await self.hardware.pick_up_tip(mount, tip_length)

    async def _trash_tip(self, mount: Mount):
        fixed_trash = self._deck.position_for('12')
        await self.hardware.retract(mount)
        high_point = await self.hardware.current_position(mount)
        drop_point = fixed_trash.point._replace(
                x=fixed_trash.point.x + 20,
                y=fixed_trash.point.y + 20,
                z=high_point[Axis.by_mount(mount)] - 20)
        await self.hardware.move_to(mount, drop_point + TRASH_TIP_OFFSET)
        await self.hardware.drop_tip(mount)

    async def cache_instruments(self):
        await self.hardware.cache_instruments()
        new_dict = self._key_by_uuid(self.hardware.get_attached_instruments())
        self._pip_info_by_id.clear()
        self._pip_info_by_id.update(new_dict)

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    def get_pipette(self, mount: Mount) -> Pipette.DictType:
        return self.pipettes[mount]

    async def get_pipette_point(self, pip_id: UUID) -> Point:
        pos = await self._hardware.current_position(self._get_mount(
                                                    pip_id))
        return Point(*pos)

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
        for id, data in self._pip_info_by_id.items():
            pip = self.get_pipette(data['mount'])
            tip_id = data['tiprack_id']
            temp_dict = {
                key: value for key, value in pip.items() if key in fields
            }
            if tip_id:
                temp_dict['tiprack_id'] = str(tip_id)
            to_dict[str(id)] = AttachedPipette(**temp_dict)
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
            to_dict[str(name)] = temp_dict
        return to_dict


# TODO: BC: move the check specific stuff to the check sub dir

class CalibrationCheckState(str, Enum):
    sessionStarted = "sessionStarted"
    labwareLoaded = "labwareLoaded"
    preparingFirstPipette = "preparingFirstPipette"
    inspectingFirstTip = "inspectingFirstTip"
    joggingFirstPipetteToHeight = "joggingFirstPipetteToHeight"
    comparingFirstPipetteHeight = "comparingFirstPipetteHeight"
    joggingFirstPipetteToPointOne = "joggingFirstPipetteToPointOne"
    comparingFirstPipettePointOne = "comparingFirstPipettePointOne"
    joggingFirstPipetteToPointTwo = "joggingFirstPipetteToPointTwo"
    comparingFirstPipettePointTwo = "comparingFirstPipettePointTwo"
    joggingFirstPipetteToPointThree = "joggingFirstPipetteToPointThree"
    comparingFirstPipettePointThree = "comparingFirstPipettePointThree"
    preparingSecondPipette = "preparingSecondPipette"
    inspectingSecondTip = "inspectingSecondTip"
    joggingSecondPipetteToHeight = "joggingSecondPipetteToHeight"
    comparingSecondPipetteHeight = "comparingSecondPipetteHeight"
    joggingSecondPipetteToPointOne = "joggingSecondPipetteToPointOne"
    comparingSecondPipettePointOne = "comparingSecondPipettePointOne"
    returningTip = "returningTip"
    sessionExited = "sessionExited"
    badCalibrationData = "badCalibrationData"
    noPipettesAttached = "noPipettesAttached"
    checkComplete = "checkComplete"


class CalibrationCheckTrigger(str, Enum):
    load_labware = "load_labware"
    prepare_pipette = "prepare_pipette"
    jog = "jog"
    pick_up_tip = "pick_up_tip"
    confirm_tip_attached = "confirm_tip_attached"
    invalidate_tip = "invalidate_tip"
    compare_point = "compare_point"
    go_to_next_check = "go_to_next_check"
    exit = "exit"
    reject_calibration = "reject_calibration"
    no_pipettes = "no_pipettes"


CHECK_TRANSITIONS = [
    {
        "trigger": CalibrationCheckTrigger.load_labware,
        "from_state": CalibrationCheckState.sessionStarted,
        "to_state": CalibrationCheckState.labwareLoaded,
        "before": "_load_tip_rack_objects"
    },
    {
        "trigger": CalibrationCheckTrigger.prepare_pipette,
        "from_state": CalibrationCheckState.labwareLoaded,
        "to_state": CalibrationCheckState.preparingFirstPipette,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.preparingFirstPipette,
        "to_state": CalibrationCheckState.preparingFirstPipette,
        "before": "_jog_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.pick_up_tip,
        "from_state": CalibrationCheckState.preparingFirstPipette,
        "to_state": CalibrationCheckState.badCalibrationData,
        "condition": "_is_tip_pick_up_dangerous"
    },
    {
        "trigger": CalibrationCheckTrigger.pick_up_tip,
        "from_state": CalibrationCheckState.preparingFirstPipette,
        "to_state": CalibrationCheckState.inspectingFirstTip,
        "before": "_pick_up_pipette_tip"
    },
    {
        "trigger": CalibrationCheckTrigger.invalidate_tip,
        "from_state": CalibrationCheckState.inspectingFirstTip,
        "to_state": CalibrationCheckState.preparingFirstPipette,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_tip_attached,
        "from_state": CalibrationCheckState.inspectingFirstTip,
        "to_state": CalibrationCheckState.joggingFirstPipetteToHeight,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingFirstPipetteToHeight,
        "to_state": CalibrationCheckState.joggingFirstPipetteToHeight,
        "before": "_jog_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingFirstPipetteToHeight,
        "to_state": CalibrationCheckState.comparingFirstPipetteHeight,
        "after": "_register_point_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipetteHeight,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointOne,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointOne,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointOne,
        "before": "_jog_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointOne,
        "to_state": CalibrationCheckState.comparingFirstPipettePointOne,
        "after": "_register_point_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipettePointOne,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointTwo,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointTwo,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointTwo,
        "before": "_jog_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointTwo,
        "to_state": CalibrationCheckState.comparingFirstPipettePointTwo,
        "after": "_register_point_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipettePointTwo,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointThree,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointThree,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointThree,
        "before": "_jog_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointThree,
        "to_state": CalibrationCheckState.comparingFirstPipettePointThree,
        "after": "_register_point_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipettePointThree,
        "to_state": CalibrationCheckState.preparingSecondPipette,
        "condition": "_is_checking_both_mounts",
        "before": "_trash_first_pipette_tip",
        "after": "_move_second_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipettePointThree,
        "to_state": CalibrationCheckState.checkComplete,
        "before": "_trash_first_pipette_tip",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.preparingSecondPipette,
        "to_state": CalibrationCheckState.preparingSecondPipette,
        "before": "_jog_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.pick_up_tip,
        "from_state": CalibrationCheckState.preparingSecondPipette,
        "to_state": CalibrationCheckState.badCalibrationData,
        "condition": "_is_tip_pick_up_dangerous"
    },
    {
        "trigger": CalibrationCheckTrigger.pick_up_tip,
        "from_state": CalibrationCheckState.preparingSecondPipette,
        "to_state": CalibrationCheckState.inspectingSecondTip,
        "before": "_pick_up_pipette_tip"
    },
    {
        "trigger": CalibrationCheckTrigger.invalidate_tip,
        "from_state": CalibrationCheckState.inspectingSecondTip,
        "to_state": CalibrationCheckState.preparingSecondPipette,
        "after": "_move_second_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_tip_attached,
        "from_state": CalibrationCheckState.inspectingSecondTip,
        "to_state": CalibrationCheckState.joggingSecondPipetteToHeight,
        "after": "_move_second_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingSecondPipetteToHeight,
        "to_state": CalibrationCheckState.joggingSecondPipetteToHeight,
        "before": "_jog_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingSecondPipetteToHeight,
        "to_state": CalibrationCheckState.comparingSecondPipetteHeight,
        "after": "_register_point_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingSecondPipetteHeight,
        "to_state": CalibrationCheckState.joggingSecondPipetteToPointOne,
        "after": "_move_second_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingSecondPipetteToPointOne,
        "to_state": CalibrationCheckState.joggingSecondPipetteToPointOne,
        "before": "_jog_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingSecondPipetteToPointOne,
        "to_state": CalibrationCheckState.comparingSecondPipettePointOne,
        "after": "_register_point_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingSecondPipettePointOne,
        "to_state": CalibrationCheckState.checkComplete,
        "before": "_trash_second_pipette_tip",
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

MOVE_TO_TIP_RACK_SAFETY_BUFFER = Point(0, 0, 10)
DEFAULT_OK_TIP_PICK_UP_VECTOR = Point(5, 5, 5)
P1000_OK_TIP_PICK_UP_VECTOR = Point(10, 10, 10)
OK_HEIGHT_VECTOR = Point(5, 5, 5)
OK_XY_VECTOR = Point(5, 5, 5)


@dataclass
class ComparisonParams:
    reference_state: CalibrationCheckState
    threshold_vector: Point


COMPARISON_STATE_MAP: typing.Dict[CalibrationCheckState, ComparisonParams] = {
    CalibrationCheckState.comparingFirstPipetteHeight: ComparisonParams(
        reference_state=CalibrationCheckState.joggingFirstPipetteToHeight,
        threshold_vector=OK_HEIGHT_VECTOR,
    ),
    CalibrationCheckState.comparingFirstPipettePointOne: ComparisonParams(
        reference_state=CalibrationCheckState.joggingFirstPipetteToPointOne,
        threshold_vector=OK_XY_VECTOR,
    ),
    CalibrationCheckState.comparingFirstPipettePointTwo: ComparisonParams(
        reference_state=CalibrationCheckState.joggingFirstPipetteToPointTwo,
        threshold_vector=OK_XY_VECTOR,
    ),
    CalibrationCheckState.comparingFirstPipettePointThree: ComparisonParams(
        reference_state=CalibrationCheckState.joggingFirstPipetteToPointThree,
        threshold_vector=OK_XY_VECTOR,
    ),
    CalibrationCheckState.comparingSecondPipetteHeight: ComparisonParams(
        reference_state=CalibrationCheckState.joggingSecondPipetteToHeight,
        threshold_vector=OK_HEIGHT_VECTOR,
    ),
    CalibrationCheckState.comparingSecondPipettePointOne: ComparisonParams(
        reference_state=CalibrationCheckState.joggingSecondPipetteToPointOne,
        threshold_vector=OK_XY_VECTOR,
    ),
}


class CheckCalibrationSession(CalibrationSession, StateMachine):
    def __init__(self, hardware: 'ThreadManager'):
        CalibrationSession.__init__(self, hardware)
        StateMachine.__init__(self, states=[s for s in CalibrationCheckState],
                              transitions=CHECK_TRANSITIONS,
                              initial_state="sessionStarted")
        self.session_type = 'check'
        self._saved_points: typing.Dict[CalibrationCheckState, Point] = {}
        self._can_distinguish_instr_offset = True
        self._first_mount: typing.Optional[Mount] = None
        self._second_mount: typing.Optional[Mount] = None
        if len(self._pip_info_by_id) == 2:
            self._first_mount = Mount.RIGHT
            self._second_mount = Mount.LEFT
        else:
            only_id, only_info = next(iter(self._pip_info_by_id.items()))
            self._first_mount = only_info['mount']
            # if only checking cal with pipette on left mount we
            # can't be sure that diffs are due to instrument
            # offset or deck transform or both
            if self._first_mount == Mount.LEFT:
                self._can_distiguish_instr_offset = False

    async def _is_checking_both_mounts(self):
        return self._second_mount is not None

    async def _load_tip_rack_objects(self):
        """
        A function that takes tip rack information
        and loads them onto the deck.
        """
        for name, lw_data in self._labware_info.items():
            parent = self._deck.position_for(lw_data.slot)
            lw = labware.Labware(lw_data.definition, parent)
            self._deck[lw_data.slot] = lw

            for index, id in enumerate(lw_data.forPipettes):
                mount = self._get_mount(id)
                is_second_mount = mount == self._second_mount
                pips_share_rack = len(lw_data.forPipettes) == 2
                well_name = 'A1'
                if is_second_mount and pips_share_rack:
                    well_name = 'B1'
                well = lw.wells_by_name()[well_name]
                position = well.top().point + MOVE_TO_TIP_RACK_SAFETY_BUFFER
                move = CheckMove(position=position, locationId=uuid4())

                if is_second_mount:
                    self._moves.preparingSecondPipette = move
                else:
                    self._moves.preparingFirstPipette = move

    async def delete_session(self):
        for mount in self._pip_info_by_id.values():
            try:
                await self._trash_tip(mount['mount'])
            except (TipAttachError, AssertionError):
                pass
        await self.hardware.home()
        await self.hardware.set_lights(rails=False)

    async def _is_tip_pick_up_dangerous(self):
        """
        Function to determine whether jogged to pick up tip position is
        outside of the safe threshold for conducting the rest of the check.
        """
        if self.current_state_name == \
                CalibrationCheckState.preparingFirstPipette:
            mount = self._first_mount
        elif self.current_state_name == \
                CalibrationCheckState.preparingSecondPipette:
            mount = self._second_mount
        assert mount, f'cannot check if tip pick up dangerous from state:' \
                      f' {self.current_state_name}'

        current_pt = await self.hardware.gantry_position(mount)

        ref_pt = self._saved_points[getattr(CalibrationCheckState,
                                            self.current_state_name)]

        threshold_vector = DEFAULT_OK_TIP_PICK_UP_VECTOR
        if str(self.get_pipette(mount)['model']).startswith('p1000'):
            threshold_vector = P1000_OK_TIP_PICK_UP_VECTOR
        absolute_diff_vector = abs(current_pt - ref_pt)
        return absolute_diff_vector > threshold_vector

    async def _pick_up_pipette_tip(self):
        """
        Function to pick up tip. It will attempt to pick up a tip in
        the current location, and save any offset it might have from the
        original position.
        """
        if self.current_state_name == \
                CalibrationCheckState.preparingFirstPipette:
            mount = self._first_mount
        elif self.current_state_name == \
                CalibrationCheckState.preparingSecondPipette:
            mount = self._second_mount
        assert mount, f'cannot pick up tip from state:' \
                      f' {self.current_state_name}'

        await self._pick_up_tip(mount)

    async def _trash_first_pipette_tip(self):
        assert self._first_mount, \
                'cannot trash tip from first mount, pipette not present'
        await self._trash_tip(self._first_mount)

    async def _trash_second_pipette_tip(self):
        assert self._second_mount, \
                'cannot trash tip from first mount, pipette not present'
        await self._trash_tip(self._second_mount)

    @staticmethod
    def _create_tiprack_param(position: typing.Dict):
        new_dict = {}
        for loc, data in position.items():
            for loc_id, values in data.items():
                offset = list(values['offset'])
                pos_dict = {'offset': offset, 'locationId': str(loc)}
                new_dict[str(loc_id)] = {'pipetteId': str(loc_id),
                                         'location': pos_dict}
        return new_dict

    def format_params(self, next_state: str) -> typing.Dict:
        template_dict = {}
        if next_state == 'jog':
            template_dict['vector'] = [0, 0, 0]
        return template_dict

    def get_comparisons_by_step(
            self) -> typing.Dict[CalibrationCheckState, ComparisonStatus]:
        comparisons = {}
        for jogged_state, comp in COMPARISON_STATE_MAP.items():
            ref_pt = self._saved_points.get(getattr(CalibrationCheckState,
                                                    comp.reference_state),
                                            None)
            jogged_pt = self._saved_points.get(getattr(CalibrationCheckState,
                                                       jogged_state), None)
            if (ref_pt is not None and jogged_pt is not None):
                absolute_diff_vector = abs(ref_pt - jogged_pt)
                exceeds = absolute_diff_vector > comp.threshold_vector
                comparisons[getattr(CalibrationCheckState, jogged_state)] = \
                    ComparisonStatus(differenceVector=absolute_diff_vector,
                                     exceedsThreshold=exceeds)
        return comparisons

    async def _register_point_first_pipette(self):
        self._saved_points[getattr(CalibrationCheckState,
                                   self.current_state_name)] = \
            await self.hardware.gantry_position(self._first_mount)

    async def _register_point_second_pipette(self):
        self._saved_points[getattr(CalibrationCheckState,
                                   self.current_state_name)] = \
            await self.hardware.gantry_position(self._second_mount)

    async def _move_first_pipette(self):
        assert self._first_mount, \
                'cannot move pipette on first mount, pipette not present'
        await self._move(self._first_mount,
                         Location(getattr(self._moves,
                                          self.current_state_name).position,
                                  None))
        await self._register_point_first_pipette()

    async def _move_second_pipette(self):
        assert self._second_mount, \
                'cannot move pipette on second mount, pipette not present'
        await self._move(self._second_mount,
                         Location(getattr(self._moves,
                                          self.current_state_name).position,
                                  None))
        await self._register_point_second_pipette()

    async def _move(self,
                    mount: Mount,
                    to_loc: Location):
        from_pt = await self.hardware.gantry_position(mount)
        from_loc = Location(from_pt, None)
        cp = self._relate_mount[pipette_id]['critical_point']

        max_height = self.hardware.get_instrument_max_height(mount)
        moves = geometry.plan_moves(from_loc, to_loc,
                                    self._deck, max_height)
        for move in moves:
            await self.hardware.move_to(mount, move[0], move[1])

    async def _jog_first_pipette(self, vector: Point):
        assert self._first_mount, \
                'cannot jog pipette on first mount, pipette not present'
        await super(self.__class__, self)._jog(self._first_mount, vector)

    async def _jog_second_pipette(self, vector: Point):
        assert self._second_mount, \
                'cannot jog pipette on second mount, pipette not present'
        await super(self.__class__, self)._jog(self._second_mount, vector)
