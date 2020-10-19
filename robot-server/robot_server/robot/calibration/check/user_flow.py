import logging
from typing import (
    List, Optional, Tuple, Awaitable,
    Callable, Dict, Any, TYPE_CHECKING)

from opentrons.protocols.implementations.labware import LabwareImplementation

from robot_server.robot.calibration.session import CalibrationSession, \
    HEIGHT_SAFETY_BUFFER
from opentrons.calibration_storage import get
from opentrons.calibration_storage.types import TipLengthCalNotFound
from opentrons.types import Mount, Point, Location
from opentrons.hardware_control import ThreadManager, CriticalPoint, Pipette
from opentrons.protocol_api import labware
from opentrons.config import feature_flags as ff
from opentrons.protocols.geometry import deck

from robot_server.robot.calibration.constants import (
    SHORT_TRASH_DECK, STANDARD_DECK, MOVE_TO_DECK_SAFETY_BUFFER,
    MOVE_TO_TIP_RACK_SAFETY_BUFFER, JOG_TO_DECK_SLOT,
    TIP_RACK_LOOKUP_BY_MAX_VOL)
import robot_server.robot.calibration.util as uf
from robot_server.robot.calibration.helper_classes import (
    DeckCalibrationError, PipetteRank, PipetteInfo,
    RequiredLabware)

from robot_server.service.session.models.command import (
    CalibrationCommand, CheckCalibrationCommand, DeckCalibrationCommand)
from robot_server.service.errors import RobotServerError

from .util import (
    PointTypes, ReferencePoints,
    ComparisonMap, ComparisonStatePerPipette)
from .models import ComparisonStatus, CheckAttachedPipette
from .state_machine import CalibrationCheckStateMachine

from .constants import (PIPETTE_TOLERANCES,
                        P1000_OK_TIP_PICK_UP_VECTOR,
                        DEFAULT_OK_TIP_PICK_UP_VECTOR,
                        MOVE_POINT_STATE_MAP,
                        CalibrationCheckState as State,
                        TIPRACK_SLOT)
from ..errors import CalibrationError

if TYPE_CHECKING:
    from opentrons_shared_data.labware import LabwareDefinition

MODULE_LOG = logging.getLogger(__name__)

"""
A collection of functions that allow a consumer to determine the health
of the current calibration saved on a robot.
"""

# TODO: BC 2020-07-08: type all command logic here with actual Model type
COMMAND_HANDLER = Callable[..., Awaitable]

COMMAND_MAP = Dict[str, COMMAND_HANDLER]


class CheckCalibrationUserFlow:
    def __init__(
            self, hardware: 'ThreadManager',
            tip_rack_defs: Optional[List['LabwareDefinition']] = None):
        self._hardware = hardware
        self._state_machine = CalibrationCheckStateMachine()
        self._current_state = State.sessionStarted
        self._reference_points = ReferencePoints(
            tip=PointTypes(),
            height=PointTypes(),
            one=PointTypes(),
            two=PointTypes(),
            three=PointTypes()
        )
        self._comparison_map = ComparisonStatePerPipette(
            first=ComparisonMap(),
            second=ComparisonMap()
        )

        self._active_pipette, self._pip_info = self._select_starting_pipette()
        self._mount = self._active_pipette.mount
        self._tip_origin_pt: Optional[Point] = None
        self._z_height_reference: Optional[float] = None

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = deck.Deck(load_name=deck_load_name)
        self._tip_racks: Optional[List['LabwareDefinition']] = tip_rack_defs
        self._active_tiprack = self._load_active_tiprack()

        self._command_map: COMMAND_MAP = {
            CalibrationCommand.load_labware: self.load_labware,
            CalibrationCommand.jog: self.jog,
            CalibrationCommand.pick_up_tip: self.pick_up_tip,
            CalibrationCommand.invalidate_tip: self.invalidate_tip,
            CheckCalibrationCommand.compare_point: self.update_comparison_map,
            CalibrationCommand.move_to_tip_rack: self.move_to_tip_rack,
            CalibrationCommand.move_to_deck: self.move_to_deck,
            CalibrationCommand.move_to_point_one: self.move_to_point_one,
            DeckCalibrationCommand.move_to_point_two: self.move_to_point_two,
            DeckCalibrationCommand.move_to_point_three: self.move_to_point_three,  # noqa: E501
            CheckCalibrationCommand.switch_pipette: self.change_active_pipette,
            CheckCalibrationCommand.return_tip: self._return_tip,
            CheckCalibrationCommand.transition: self.load_labware,
            CalibrationCommand.exit: self.exit_session,
        }

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    @property
    def current_state(self) -> State:
        return self._current_state

    @property
    def mount(self) -> Mount:
        return self.active_pipette.mount

    @property
    def active_pipette(self) -> PipetteInfo:
        return self._active_pipette

    @property
    def comparison_map(self) -> ComparisonStatePerPipette:
        return self._comparison_map

    @property
    def active_tiprack(self) -> labware.Labware:
        return self._active_tiprack

    @property
    def _hw_pipette(self) -> Pipette:
        return self._get_hw_pipettes()[0]

    async def load_labware(self):
        pass

    async def change_active_pipette(self):
        second_pip =\
            self._get_pipette_by_rank(PipetteRank.second)
        if not second_pip:
            raise RobotServerError(
                definition=CalibrationError.UNMET_STATE_TRANSITION_REQ,
                state=self._current_state,
                handler="change_active_pipette",
                condition="second pipette")
        self._active_pipette = second_pip
        del self._deck[TIPRACK_SLOT]
        self._active_tiprack = self._load_active_tiprack()

    def _set_current_state(self, to_state: State):
        self._current_state = to_state

    def _get_critical_point_override(self) -> Optional[CriticalPoint]:
        return (CriticalPoint.FRONT_NOZZLE if
                self.active_pipette.channels == 8 else None)

    async def handle_command(self,
                             name: Any,
                             data: Dict[Any, Any]):
        """
        Handle a client command

        :param name: Name of the command
        :param data: Data supplied in command
        :return: None
        """
        next_state = self._state_machine.get_next_state(self._current_state,
                                                        name)

        handler = self._command_map.get(name)
        if handler is not None:
            await handler(**data)
        self._set_current_state(next_state)
        MODULE_LOG.debug(
            f'CalibrationCheckUserFlow handled command {name}, transitioned'
            f'from {self._current_state} to {next_state}')

    def get_required_labware(self) -> List[RequiredLabware]:
        slots = self._deck.get_non_fixture_slots()
        lw_by_slot = {s: self._deck[s] for s in slots if self._deck[s]}
        return [
            RequiredLabware.from_lw(lw, s)  # type: ignore
            for s, lw in lw_by_slot.items()]

    def get_active_tiprack(self) -> RequiredLabware:
        return RequiredLabware.from_lw(self.active_tiprack)

    def _select_starting_pipette(
            self) -> Tuple[PipetteInfo, List[PipetteInfo]]:
        """
        Select pipette for calibration based on:
        1: larger max volume
        2: single-channel over multi
        3: right mount over left
        """
        if not any(self._hardware._attached_instruments.values()):
            raise RobotServerError(
                definition=CalibrationError.NO_PIPETTE_ATTACHED,
                flow='Calibration Health Check')
        pips = {m: p for m, p in self._hardware._attached_instruments.items()
                if p}
        if len(pips) == 1:
            for mount, pip in pips.items():
                info = PipetteInfo(
                    channels=pip.channels,
                    rank=PipetteRank.first,
                    max_volume=pip.max_volume,
                    mount=mount)
                return info, [info]

        right_pip = pips[Mount.RIGHT]
        left_pip = pips[Mount.LEFT]

        r_info = PipetteInfo(
            channels=right_pip.config.channels,
            max_volume=right_pip.config.max_volume,
            rank=PipetteRank.first,
            mount=Mount.RIGHT)
        l_info = PipetteInfo(
            channels=left_pip.config.channels,
            max_volume=left_pip.config.max_volume,
            rank=PipetteRank.first,
            mount=Mount.LEFT)
        if left_pip.config.max_volume > right_pip.config.max_volume or \
                right_pip.config.channels > left_pip.config.channels:
            r_info.rank = PipetteRank.second
            return l_info, [l_info, r_info]
        else:
            l_info.rank = PipetteRank.second
            return r_info, [r_info, l_info]

    async def _get_current_point(
            self,
            critical_point: CriticalPoint = None) -> Point:
        return await self._hardware.gantry_position(self.mount,
                                                    critical_point)

    def _get_pipette_by_rank(self, rank: PipetteRank) -> \
            Optional[PipetteInfo]:
        try:
            return next(p for p in self._pip_info
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

    def _is_checking_both_mounts(self):
        return len(self._pip_info) == 2

    def _get_volume_from_tiprack_def(
            self, tip_rack_def: 'LabwareDefinition') -> float:
        first_well = tip_rack_def['wells']['A1']
        return float(first_well['totalLiquidVolume'])

    def _load_active_tiprack(self) -> labware.Labware:
        """
        load onto the deck the default opentrons tip rack labware for this
        pipette and return the tip rack labware. If tip_rack_def is supplied,
        load specific tip rack from def onto the deck and return the labware.
        """
        active_max_vol = self.active_pipette.max_volume
        if self._tip_racks:
            for tip_rack_def in self._tip_racks:
                tiprack_vol = self._get_volume_from_tiprack_def(tip_rack_def)
                if active_max_vol == tiprack_vol:
                    tr_lw = labware.load_from_definition(
                        tip_rack_def,
                        self._deck.position_for(TIPRACK_SLOT))
        else:
            tr_load_name =\
                TIP_RACK_LOOKUP_BY_MAX_VOL[str(active_max_vol)].load_name
            tr_lw = labware.load(tr_load_name,
                                 self._deck.position_for(TIPRACK_SLOT))
        self._deck[TIPRACK_SLOT] = tr_lw
        return tr_lw

    def _get_hw_pipettes(self) -> List[Pipette]:
        # Return a list of instruments, ordered with the active pipette first
        active_mount = self.active_pipette.mount
        hw_instruments = self._hardware._attached_instruments
        if active_mount == Mount.RIGHT:
            other_mount = Mount.LEFT
        else:
            other_mount = Mount.RIGHT
        if self._is_checking_both_mounts():
            return [hw_instruments[active_mount], hw_instruments[other_mount]]
        else:
            return [hw_instruments[active_mount]]

    def _get_ordered_info_pipettes(self) -> List[PipetteInfo]:
        active_rank = self.active_pipette.rank
        if active_rank == PipetteRank.first:
            other_rank = PipetteRank.second
        else:
            other_rank = PipetteRank.first
        pip1 = self._get_pipette_by_rank(active_rank)
        assert pip1
        if self._is_checking_both_mounts():
            pip2 = self._get_pipette_by_rank(other_rank)
            assert pip2
            return [pip1, pip2]
        else:
            return [pip1]

    def get_instruments(self) -> List[CheckAttachedPipette]:
        """
        Public property to help format the current pipettes
        being used for a given session for the client.
        """
        hw_pips = self._get_hw_pipettes()
        info_pips = self._get_ordered_info_pipettes()
        return [
            CheckAttachedPipette(  # type: ignore[call-arg]
                model=hw_pip.model,
                name=hw_pip.name,
                tip_length=hw_pip.config.tip_length,
                rank=str(info_pip.rank),
                mount=str(self.mount),
                serial=hw_pip.pipette_id)  # type: ignore[arg-type]
            for hw_pip, info_pip in zip(hw_pips, info_pips)]

    def get_active_pipette(self) -> CheckAttachedPipette:
        # TODO(mc, 2020-09-17): s/tip_length/tipLength
        # TODO(mc, 2020-09-17): type of pipette_id does not match expected
        # type of AttachedPipette.serial
        assert self._hw_pipette
        assert self.active_pipette
        return CheckAttachedPipette(  # type: ignore[call-arg]
            model=self._hw_pipette.model,
            name=self._hw_pipette.name,
            tip_length=self._hw_pipette.config.tip_length,
            rank=str(self.active_pipette.rank),
            mount=str(self.mount),
            serial=self._hw_pipette.pipette_id)  # type: ignore[arg-type]

    async def _is_tip_pick_up_dangerous(self):
        """
        Function to determine whether jogged to pick up tip position is
        outside of the safe threshold for conducting the rest of the check.
        """
        ref_pt, jogged_pt = self._get_reference_points_by_state()

        ref_pt_no_safety = ref_pt - MOVE_TO_TIP_RACK_SAFETY_BUFFER
        threshold_vector = DEFAULT_OK_TIP_PICK_UP_VECTOR
        pip_model = self._get_hw_pipettes()[0].model
        if str(pip_model).startswith('p1000'):
            threshold_vector = P1000_OK_TIP_PICK_UP_VECTOR
        xyThresholdMag = Point(0, 0, 0).magnitude_to(
                threshold_vector._replace(z=0))
        zThresholdMag = Point(0, 0, 0).magnitude_to(
                threshold_vector._replace(x=0, y=0))
        xyDiffMag = ref_pt_no_safety._replace(z=0).magnitude_to(
                jogged_pt._replace(z=0))
        zDiffMag = ref_pt_no_safety._replace(x=0, y=0).magnitude_to(
                jogged_pt._replace(x=0, y=0))
        return xyDiffMag > xyThresholdMag or zDiffMag > zThresholdMag

    async def check_tip_threshold(self):
        dangerous = await self._is_tip_pick_up_dangerous()
        if dangerous:
            self._set_current_state(State.badCalibrationData)
        else:
            self._set_current_state(State.inspectingTip)

    def _determine_threshold(self) -> Point:
        """
        Helper function used to determine the threshold for comparison
        based on the state currently being compared and the pipette.
        """
        active_pipette = self.active_pipette

        pipette_type = ''
        if active_pipette and active_pipette.mount:
            pipette_type = str(self._get_hw_pipettes()[0].name)

        is_p1000 = pipette_type in ['p1000_single_gen2', 'p1000_single']
        is_p20 = pipette_type in \
            ['p20_single_gen2', 'p10_single', 'p20_multi_gen2', 'p10_multi']
        cross_states = [
            State.comparingPointOne,
            State.comparingPointTwo,
            State.comparingPointThree]
        if is_p1000 and self.current_state in cross_states:
            return PIPETTE_TOLERANCES['p1000_crosses']
        elif is_p1000 and self.current_state == State.comparingHeight:
            return PIPETTE_TOLERANCES['p1000_height']
        elif is_p20 and self.current_state in cross_states:
            return PIPETTE_TOLERANCES['p20_crosses']
        elif self.current_state in cross_states:
            return PIPETTE_TOLERANCES['p300_crosses']
        else:
            return PIPETTE_TOLERANCES['other_height']

    def _get_error_source(
            self,
            comparisons: ComparisonStatePerPipette
            ) -> DeckCalibrationError:
        is_second_pip = self.active_pipette.rank is PipetteRank.second
        compare_states = [
            State.comparingHeight,
            State.comparingPointOne,
            State.comparingPointTwo,
            State.comparingPointThree,
        ]
        compared_first =\
            all(hasattr(comparisons.first, k.name) for k in compare_states)
        first_pip_steps_passed = compared_first
        for key in compare_states:
            c = getattr(comparisons.first, key.name)
            if c and c.exceedsThreshold:
                first_pip_steps_passed = False
                break
        if is_second_pip and first_pip_steps_passed:
            return DeckCalibrationError.BAD_INSTRUMENT_OFFSET
        elif self.can_distinguish_instr_offset() and not is_second_pip:
            return DeckCalibrationError.BAD_DECK_TRANSFORM
        else:
            return DeckCalibrationError.UNKNOWN

    def _update_compare_status_by_rank(
            self, rank: PipetteRank,
            status: ComparisonStatus) -> ComparisonMap:
        intermediate_map = getattr(self._comparison_map, rank.name)
        intermediate_map.set_value(self.current_state.name, status)
        return intermediate_map

    async def update_comparison_map(self):
        ref_pt, jogged_pt = self._get_reference_points_by_state()
        rank = self.active_pipette.rank
        threshold_vector = self._determine_threshold()
        if (ref_pt is not None and jogged_pt is not None):
            diff_magnitude = None
            if threshold_vector.z == 0.0:
                diff_magnitude = ref_pt._replace(z=0.0).magnitude_to(
                        jogged_pt._replace(z=0.0))
            elif threshold_vector.x == 0.0 and \
                    threshold_vector.y == 0.0:
                diff_magnitude = ref_pt._replace(
                        x=0.0, y=0.0).magnitude_to(jogged_pt._replace(
                                                    x=0.0, y=0.0))
            assert diff_magnitude is not None, \
                'step comparisons must check z or (x and y) magnitude'

            threshold_mag = Point(0, 0, 0).magnitude_to(
                    threshold_vector)
            exceeds = diff_magnitude > threshold_mag
            tform_type = DeckCalibrationError.UNKNOWN

            if exceeds:
                tform_type = self._get_error_source(self._comparison_map)

            status = ComparisonStatus(differenceVector=(jogged_pt - ref_pt),
                                      thresholdVector=threshold_vector,
                                      exceedsThreshold=exceeds,
                                      transformType=str(tform_type))
            intermediate_map =\
                self._update_compare_status_by_rank(rank, status)
            self._comparison_map.set_value(rank.name, intermediate_map)

    def _get_reference_points_by_state(self):
        saved_points = self._reference_points
        if self.current_state == State.preparingPipette:
            return saved_points.tip.initial_point,\
                saved_points.tip.final_point
        elif self.current_state == State.comparingHeight:
            return saved_points.height.initial_point,\
                saved_points.height.final_point
        elif self.current_state == State.comparingPointOne:
            return saved_points.one.initial_point,\
                saved_points.one.final_point
        elif self.current_state == State.comparingPointTwo:
            return saved_points.two.initial_point,\
                saved_points.two.final_point
        elif self.current_state == State.comparingPointThree:
            return saved_points.three.initial_point,\
                saved_points.three.final_point

    async def register_initial_point(self):
        critical_point = self._get_critical_point_override()
        current_point = \
            await self._get_current_point(critical_point)
        buffer = Point(0, 0, 0)
        if self.current_state == State.labwareLoaded:
            self._reference_points.tip.initial_point = \
                current_point + buffer
        elif self.current_state == State.inspectingTip:
            self._reference_points.height.initial_point = \
                current_point + buffer
        elif self.current_state == State.comparingHeight:
            buffer = MOVE_TO_DECK_SAFETY_BUFFER
            self._reference_points.one.initial_point = \
                current_point + buffer
        elif self.current_state == State.comparingPointOne:
            self._reference_points.two.initial_point = \
                current_point + buffer
        elif self.current_state == State.comparingPointTwo:
            self._reference_points.three.initial_point = \
                current_point + buffer

    async def register_final_point(self):
        critical_point = self._get_critical_point_override()
        current_point = \
            await self._get_current_point(critical_point)
        buffer = Point(0, 0, 0)
        if self.current_state == State.preparingPipette:
            self._reference_points.tip.final_point = \
                current_point + buffer
        elif self.current_state == State.comparingHeight:
            buffer = MOVE_TO_DECK_SAFETY_BUFFER
            self._reference_points.height.final_point = \
                current_point + buffer
            self._z_height_reference = current_point.z
        elif self.current_state == State.comparingPointOne:
            self._reference_points.one.final_point = \
                current_point + buffer
        elif self.current_state == State.comparingPointTwo:
            self._reference_points.two.final_point = \
                current_point + buffer
        elif self.current_state == State.comparingPointThree:
            self._reference_points.three.final_point = \
                current_point + buffer

    def _get_tip_length(self) -> float:
        pip_id = self._hw_pipette.pipette_id
        assert pip_id
        assert self.active_tiprack
        try:
            return get.load_tip_length_calibration(
                pip_id, self.active_tiprack._definition,
                '')['tipLength']
        except TipLengthCalNotFound:
            tip_overlap = self._hw_pipette.config.tip_overlap.get(
                self.active_tiprack.uri,
                self._hw_pipette.config.tip_overlap['default'])
            tip_length = self.active_tiprack.tip_length
            return tip_length - tip_overlap

    async def move_to_tip_rack(self):
        if not self.active_tiprack:
            raise RobotServerError(
                definition=CalibrationError.UNMET_STATE_TRANSITION_REQ,
                state=self._current_state,
                handler="move_to_tip_rack",
                condition="active tiprack")
        point = self.active_tiprack.wells()[0].top().point + \
                MOVE_TO_TIP_RACK_SAFETY_BUFFER
        to_loc = Location(point, None)
        await self._move(to_loc)
        await self.register_initial_point()

    async def move_to_deck(self):
        deck_pt = self._deck.get_slot_center(JOG_TO_DECK_SLOT)
        ydim = self._deck.get_slot_definition(
            JOG_TO_DECK_SLOT)['boundingBox']['yDimension']
        new_pt = deck_pt - Point(0, (ydim/2), deck_pt.z) + \
            MOVE_TO_DECK_SAFETY_BUFFER
        to_loc = Location(new_pt, None)
        await self._move(to_loc)
        await self.register_initial_point()

    def _get_move_to_point_loc_by_state(self) -> Location:
        assert self._z_height_reference is not None, \
            "comparePoint has not been called yet"
        pt_id = MOVE_POINT_STATE_MAP[self._current_state]
        coords = self._deck.get_calibration_position(pt_id).position
        loc = Location(Point(*coords), None)
        return loc.move(point=Point(0, 0, self._z_height_reference))

    async def move_to_point_one(self):
        await self._move(self._get_move_to_point_loc_by_state())
        await self.register_initial_point()

    async def move_to_point_two(self):
        await self._move(self._get_move_to_point_loc_by_state())
        await self.register_initial_point()

    async def move_to_point_three(self):
        await self._move(self._get_move_to_point_loc_by_state())
        await self.register_initial_point()

    async def jog(self, vector):
        await self._hardware.move_rel(mount=self.mount,
                                      delta=Point(*vector))
        await self.register_final_point()

    async def pick_up_tip(self):
        await uf.pick_up_tip(self, tip_length=self._get_tip_length())
        await self.check_tip_threshold()

    async def invalidate_tip(self):
        await uf.invalidate_tip(self)

    async def _return_tip(self):
        await uf.return_tip(self, tip_length=self._get_tip_length())

    async def _move(self, to_loc: Location):
        await uf.move(self, to_loc)

    async def exit_session(self):
        MODULE_LOG.info("exit session was initiated")
        if self._hw_pipette.has_tip:
            await self.move_to_tip_rack()
            await self._return_tip()
        await self._hardware.home()
