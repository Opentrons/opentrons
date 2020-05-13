import typing
import logging
from uuid import uuid4, UUID
from enum import Enum
from dataclasses import dataclass

from opentrons.types import Mount, Point, Location
from opentrons.hardware_control.pipette import Pipette
from opentrons.hardware_control.types import CriticalPoint, Axis

from .constants import LOOKUP_LABWARE
from .util import StateMachine, WILDCARD
from .models import ComparisonStatus
from .helper_classes import (LabwareInfo, CheckMove, Moves,
                             DeckCalibrationError, PipetteRank,
                             PipetteInfo, PipetteStatus)
from opentrons.hardware_control import ThreadManager
from opentrons.protocol_api import labware, geometry

MODULE_LOG = logging.getLogger(__name__)

"""
A set of endpoints that can be used to create a session for any robot
calibration tasks such as checking your calibration data, performing mount
offset or a robot deck transform.
"""


class CalibrationException(Exception):
    pass


class NoPipetteException(CalibrationException):
    pass


class SessionManager:
    """Small wrapper to keep track of robot calibration sessions created."""
    def __init__(self):
        self._sessions = {}

    @property
    def sessions(self):
        return self._sessions


# vector from front bottom left of slot 12
TRASH_TIP_OFFSET = Point(20, 20, -20)


class CalibrationSession:
    """Class that controls state of the current robot calibration session"""
    def __init__(self, hardware: ThreadManager):
        self._hardware = hardware
        self._deck = geometry.Deck()
        self._pip_info_by_mount = self._get_pip_info_by_mount(
                hardware.get_attached_instruments())
        self._labware_info = self._determine_required_labware()
        self._moves = self._build_deck_moves()

    @classmethod
    async def build(cls, hardware: ThreadManager):
        await hardware.cache_instruments()
        await hardware.set_lights(rails=True)
        await hardware.home()
        return cls(hardware=hardware)

    @staticmethod
    def _get_pip_info_by_mount(
            new_pipettes: typing.Dict[Mount, Pipette.DictType]) \
            -> typing.Dict[Mount, PipetteInfo]:
        pip_info_by_mount = {}
        attached_pips = {m: p for m, p in new_pipettes.items() if p}
        num_pips = len(attached_pips)
        if num_pips > 0:
            for mount, data in attached_pips.items():
                if data:
                    rank = PipetteRank.first
                    if num_pips == 2 and mount == Mount.LEFT:
                        rank = PipetteRank.second
                    cp = None
                    if data['channels'] == 8:
                        cp = CriticalPoint.FRONT_NOZZLE
                    pip_info_by_mount[mount] = PipetteInfo(tiprack_id=None,
                                                           critical_point=cp,
                                                           rank=rank,
                                                           mount=mount)
            return pip_info_by_mount
        else:
            raise NoPipetteException("Cannot start calibration check "
                                     "with fewer than one pipette.")

    def _determine_required_labware(self) -> typing.Dict[UUID, LabwareInfo]:
        """
        A function that inserts tiprack information into two dataclasses
        :py:class:`.LabwareInfo` and :py:class:`.LabwareDefinition` based
        on the current pipettes attached.
        """
        lw: typing.Dict[UUID, LabwareInfo] = {}
        _prev_lw_uuid: typing.Optional[UUID] = None

        for mount, pip_info in self._pip_info_by_mount.items():
            load_name: str = self._load_name_for_mount(mount)
            prev_lw = lw.get(_prev_lw_uuid, None) if _prev_lw_uuid else None
            if _prev_lw_uuid and prev_lw and prev_lw.loadName == load_name:
                #  pipette uses same tiprack as previous, use existing
                lw[_prev_lw_uuid].forMounts.append(mount)
                self._pip_info_by_mount[mount].tiprack_id = _prev_lw_uuid
            else:
                lw_def = labware.get_labware_definition(load_name)
                new_uuid: UUID = uuid4()
                _prev_lw_uuid = new_uuid
                slot = self._get_tip_rack_slot_for_mount(mount)
                lw[new_uuid] = LabwareInfo(
                    alternatives=self._alt_load_names_for_mount(mount),
                    forMounts=[mount],
                    loadName=load_name,
                    slot=slot,
                    namespace=lw_def['namespace'],
                    version=lw_def['version'],
                    id=new_uuid,
                    definition=lw_def)
                self._pip_info_by_mount[mount].tiprack_id = new_uuid
        return lw

    def _alt_load_names_for_mount(self, mount: Mount) -> typing.List[str]:
        pip_vol = self.pipettes[mount]['max_volume']
        return list(LOOKUP_LABWARE[str(pip_vol)].alternatives)

    def _load_name_for_mount(self, mount: Mount) -> str:
        pip_vol = self.pipettes[mount]['max_volume']
        return LOOKUP_LABWARE[str(pip_vol)].load_name

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

    def _get_tip_rack_slot_for_mount(self, mount) -> str:
        if len(self._pip_info_by_mount) == 2:
            shared_tiprack = self._load_name_for_mount(Mount.LEFT) == \
                    self._load_name_for_mount(Mount.RIGHT)
            if mount == Mount.LEFT and not shared_tiprack:
                return '6'
            else:
                return '8'
        else:
            return '8'

    async def _jog(self, mount: Mount, vector: Point):
        """
        General function that can be used by all session types to jog around
        a specified pipette.
        """
        await self.hardware.move_rel(mount, vector)

    async def _pick_up_tip(self, mount: Mount):
        pip_info = self._pip_info_by_mount[mount]
        if pip_info.tiprack_id:
            lw_info = self.get_tiprack(pip_info.tiprack_id)
            # Note: ABC DeckItem cannot have tiplength b/c of
            # mod geometry contexts. Ignore type checking error here.
            tip_length = self._deck[lw_info.slot].tip_length  # type: ignore
        else:
            tip_length = self.pipettes[mount]['fallback_tip_length']
        await self.hardware.pick_up_tip(mount, tip_length)

    async def _trash_tip(self, mount: Mount):
        fixed_trash = self._deck.position_for('12')
        await self.hardware.retract(mount)
        high_point = await self.hardware.current_position(mount)
        drop_point = fixed_trash.point._replace(
                x=fixed_trash.point.x,
                y=fixed_trash.point.y,
                z=high_point[Axis.by_mount(mount)])
        await self.hardware.move_to(mount, drop_point + TRASH_TIP_OFFSET)
        await self._drop_tip(mount)

    async def _drop_tip(self, mount: Mount):
        await self.hardware.drop_tip(mount)

    async def cache_instruments(self):
        await self.hardware.cache_instruments()
        new_dict = self._get_pip_info_by_mount(
                self.hardware.get_attached_instruments())
        self._pip_info_by_mount.clear()
        self._pip_info_by_mount.update(new_dict)

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    def get_tiprack(self, uuid: UUID) -> LabwareInfo:
        return self._labware_info[uuid]

    @property
    def pipettes(self) -> typing.Dict[Mount, Pipette.DictType]:
        return self.hardware.attached_instruments

    @property
    def labware_status(self) -> typing.Dict[UUID, LabwareInfo]:
        """
        Public property to help format the current labware status of a given
        session for the client.
        """
        return self._labware_info


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
    checkComplete = "checkComplete"


class CalibrationCheckTrigger(str, Enum):
    load_labware = "loadLabware"
    prepare_pipette = "preparePipette"
    jog = "jog"
    pick_up_tip = "pickUpTip"
    confirm_tip_attached = "confirmTip"
    invalidate_tip = "invalidateTip"
    compare_point = "comparePoint"
    go_to_next_check = "goToNextCheck"
    exit = "exitSession"
    reject_calibration = "rejectCalibration"


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
        "before": "_return_first_tip",
        "after": "_move_first_pipette"
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
        "before": "_return_second_tip",
        "after": "_move_second_pipette"
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
    }
]

MOVE_TO_TIP_RACK_SAFETY_BUFFER = Point(0, 0, 10)

DEFAULT_OK_TIP_PICK_UP_VECTOR = Point(15, 15, 15)
P1000_OK_TIP_PICK_UP_VECTOR = Point(10, 10, 10)
OK_HEIGHT_VECTOR = Point(0.0, 0.0, 5.0)
OK_XY_VECTOR = Point(5.0, 5.0, 0.0)


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

    def _get_pipette_by_rank(self, rank: PipetteRank) -> \
            typing.Optional[PipetteInfo]:
        try:
            return next(p for p in self._pip_info_by_mount.values()
                        if p.rank == rank)
        except StopIteration:
            return None

    def can_distinguish_instr_offset(self):
        """
         whether or not we can separate out
         calibration diffs that are due to instrument
         offset or deck transform or both
        """
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        return first_pip and first_pip.mount != Mount.LEFT

    async def _is_checking_both_mounts(self):
        return len(self._pip_info_by_mount) == 2

    async def _load_tip_rack_objects(self):
        """
        A function that takes tip rack information
        and loads them onto the deck.
        """
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        for name, lw_data in self._labware_info.items():
            parent = self._deck.position_for(lw_data.slot)
            lw = labware.Labware(lw_data.definition, parent)
            self._deck[lw_data.slot] = lw

            for mount in lw_data.forMounts:
                is_second_mount = second_pip and second_pip.mount == mount
                pips_share_rack = len(lw_data.forMounts) == 2
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

    def pipette_status(self) -> typing.Dict[Mount, PipetteStatus]:
        """
        Public property to help format the current labware status of a given
        session for the client.
        """
        to_dict = {}
        for mount, pip_info in self._pip_info_by_mount.items():
            hw_pip = self.pipettes[mount]
            p = PipetteStatus(
                model=str(hw_pip['model']),
                name=str(hw_pip['name']),
                mount=str(mount),
                tip_length=float(hw_pip['tip_length']),
                has_tip=bool(hw_pip['has_tip']),
                tiprack_id=pip_info.tiprack_id,
                rank=str(pip_info.rank),
            )
            to_dict[mount] = p
        return to_dict

    async def delete_session(self):
        for mount in self._pip_info_by_mount.keys():
            if self.get_pipettes[mount]['has_tip']:
                try:
                    await self._trash_tip(mount)
                except (CalibrationException, AssertionError):
                    pass
        await self.hardware.home()
        await self.hardware.set_lights(rails=False)

    def _get_preparing_state_mount(self) -> typing.Optional[Mount]:
        pip = None
        if self.current_state_name == \
                CalibrationCheckState.preparingFirstPipette:
            pip = self._get_pipette_by_rank(PipetteRank.first)
        elif self.current_state_name == \
                CalibrationCheckState.preparingSecondPipette:
            pip = self._get_pipette_by_rank(PipetteRank.second)
        assert pip, f'cannot check prepare pipette from state:' \
                    f' {self.current_state_name}'
        return pip.mount

    async def _is_tip_pick_up_dangerous(self):
        """
        Function to determine whether jogged to pick up tip position is
        outside of the safe threshold for conducting the rest of the check.
        """
        mount = self._get_preparing_state_mount()
        assert mount, 'cannot attempt tip pick up, no mount specified'

        current_pt = await self.hardware.gantry_position(mount)

        ref_pt = self._saved_points[getattr(CalibrationCheckState,
                                            self.current_state_name)]

        threshold_vector = DEFAULT_OK_TIP_PICK_UP_VECTOR
        pip_model = self.pipettes[mount]['model']
        if str(pip_model).startswith('p1000'):
            threshold_vector = P1000_OK_TIP_PICK_UP_VECTOR
        xyThresholdMag = Point(0, 0, 0).magnitude_to(
                threshold_vector._replace(z=0))
        zThresholdMag = Point(0, 0, 0).magnitude_to(
                threshold_vector._replace(x=0, y=0))
        xyDiffMag = ref_pt._replace(z=0).magnitude_to(
                current_pt._replace(z=0))
        zDiffMag = ref_pt._replace(x=0, y=0).magnitude_to(
                current_pt._replace(x=0, y=0))
        return xyDiffMag > xyThresholdMag or zDiffMag > zThresholdMag

    async def _pick_up_pipette_tip(self):
        """
        Function to pick up tip. It will attempt to pick up a tip in
        the current location, and save any offset it might have from the
        original position.
        """
        mount = self._get_preparing_state_mount()
        assert mount, 'cannot attempt tip pick up, no mount specified'
        assert self.pipettes[mount]['has_tip'] is False, \
            f"Tip is already attached to {mount} pipette, " \
            "cannot pick up another"

        await self._pick_up_tip(mount)

    async def _trash_first_pipette_tip(self):
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        assert first_pip, \
            'cannot trash tip from first mount, pipette not present'
        await self._trash_tip(first_pip.mount)

    async def _trash_second_pipette_tip(self):
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        assert second_pip, \
            'cannot trash tip from first mount, pipette not present'
        await self._trash_tip(second_pip.mount)

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
                diff_magnitude = None
                if comp.threshold_vector.z == 0.0:
                    diff_magnitude = ref_pt._replace(z=0.0).magnitude_to(
                            jogged_pt._replace(z=0.0))
                elif comp.threshold_vector.x == 0.0 and \
                        comp.threshold_vector.y == 0.0:
                    diff_magnitude = ref_pt._replace(
                            x=0.0, y=0.0).magnitude_to(jogged_pt._replace(
                                                       x=0.0, y=0.0))
                assert diff_magnitude is not None, \
                    'step comparisons must check z or (x and y) magnitude'

                threshold_mag = Point(0, 0, 0).magnitude_to(
                        comp.threshold_vector)
                exceeds = diff_magnitude > threshold_mag
                tform_type = DeckCalibrationError.UNKNOWN

                if exceeds:
                    is_second_pip = jogged_state in [
                        CalibrationCheckState.joggingSecondPipetteToHeight,
                        CalibrationCheckState.joggingSecondPipetteToPointOne,
                    ]
                    if is_second_pip:
                        tform_type = DeckCalibrationError.BAD_INSTRUMENT_OFFSET
                    elif self.can_distinguish_instr_offset():
                        tform_type = DeckCalibrationError.BAD_DECK_TRANSFORM
                comparisons[getattr(CalibrationCheckState, jogged_state)] = \
                    ComparisonStatus(differenceVector=(jogged_pt - ref_pt),
                                     thresholdVector=comp.threshold_vector,
                                     exceedsThreshold=exceeds,
                                     transformType=tform_type)
        return comparisons

    async def _register_point_first_pipette(self):
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        assert first_pip, 'cannot register point for missing first pipette'
        self._saved_points[getattr(CalibrationCheckState,
                                   self.current_state_name)] = \
            await self.hardware.gantry_position(first_pip.mount)

    async def _register_point_second_pipette(self):
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        assert second_pip, 'cannot register point for missing second pipette'
        self._saved_points[getattr(CalibrationCheckState,
                                   self.current_state_name)] = \
            await self.hardware.gantry_position(second_pip.mount)

    async def _move_first_pipette(self):
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        assert first_pip, \
            'cannot move pipette on first mount, pipette not present'
        await self._move(first_pip.mount,
                         Location(getattr(self._moves,
                                          self.current_state_name).position,
                                  None))
        await self._register_point_first_pipette()

    async def _move_second_pipette(self):
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        assert second_pip, \
            'cannot move pipette on second mount, pipette not present'
        await self._move(second_pip.mount,
                         Location(getattr(self._moves,
                                          self.current_state_name).position,
                                  None))
        await self._register_point_second_pipette()

    async def _move(self,
                    mount: Mount,
                    to_loc: Location):
        from_pt = await self.hardware.gantry_position(mount)
        from_loc = Location(from_pt, None)

        cp = self._pip_info_by_mount[mount].critical_point

        max_height = self.hardware.get_instrument_max_height(mount)
        moves = geometry.plan_moves(from_loc, to_loc,
                                    self._deck, max_height)
        for move in moves:
            await self.hardware.move_to(
                mount, move[0], move[1], critical_point=cp)

    async def _jog_first_pipette(self, vector: Point):
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        assert first_pip, \
            'cannot jog pipette on first mount, pipette not present'
        await super(self.__class__, self)._jog(first_pip.mount, vector)

    async def _jog_second_pipette(self, vector: Point):
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        assert second_pip, \
            'cannot jog pipette on second mount, pipette not present'
        await super(self.__class__, self)._jog(second_pip.mount, vector)

    async def _return_first_tip(self):
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        assert first_pip, \
            'cannot drop tip on first mount, pipette not present'
        state_name = CalibrationCheckState.preparingFirstPipette
        loc = Location(getattr(self._moves, state_name).position, None)
        await self._move(first_pip.mount, loc)
        await self._drop_tip(first_pip.mount)

    async def _return_second_tip(self):
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        assert second_pip, \
            'cannot drop tip on second mount, pipette not present'
        state_name = CalibrationCheckState.preparingSecondPipette
        loc = Location(getattr(self._moves, state_name).position, None)
        await self._move(second_pip.mount, loc)
        await self._drop_tip(second_pip.mount)
