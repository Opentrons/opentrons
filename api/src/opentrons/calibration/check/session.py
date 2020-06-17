import typing
import logging
from uuid import uuid4
from enum import Enum
from dataclasses import dataclass

from opentrons.calibration.session import CalibrationSession, \
    CalibrationException, HEIGHT_SAFETY_BUFFER
from opentrons.types import Mount, Point, Location

from opentrons.calibration.util import StateMachine, WILDCARD
from opentrons.calibration.check.models import ComparisonStatus, OffsetVector
from opentrons.calibration.helper_classes import (
    CheckMove, DeckCalibrationError, PipetteRank, PipetteInfo, PipetteStatus
)
from opentrons.hardware_control import ThreadManager
from opentrons.protocol_api import labware

from .constants import (PIPETTE_TOLERANCES,
                        P1000_OK_TIP_PICK_UP_VECTOR,
                        DEFAULT_OK_TIP_PICK_UP_VECTOR,
                        MOVE_TO_TIP_RACK_SAFETY_BUFFER)

MODULE_LOG = logging.getLogger(__name__)

"""
A set of endpoints that can be used to create a session for any robot
calibration tasks such as checking your calibration data, performing mount
offset or a robot deck transform.
"""


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


CHECK_TRANSITIONS: typing.List[typing.Dict[str, typing.Any]] = [
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
        "after": "_move_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.preparingFirstPipette,
        "to_state": CalibrationCheckState.preparingFirstPipette,
        "before": "_jog_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.pick_up_tip,
        "from_state": CalibrationCheckState.preparingFirstPipette,
        "to_state": CalibrationCheckState.inspectingFirstTip,
        "after": [
            "_register_point_first_pipette",
            "_pick_up_tip_first_pipette"]
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
        "to_state": CalibrationCheckState.badCalibrationData,
        "condition": "_is_tip_pick_up_dangerous",
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
        "before": "_jog_second_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.pick_up_tip,
        "from_state": CalibrationCheckState.preparingSecondPipette,
        "to_state": CalibrationCheckState.inspectingSecondTip,
        "after": [
            "_register_point_second_pipette",
            "_pick_up_tip_second_pipette"]
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
        "to_state": CalibrationCheckState.badCalibrationData,
        "condition": "_is_tip_pick_up_dangerous",
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


@dataclass
class ComparisonParams:
    reference_state: CalibrationCheckState


COMPARISON_STATE_MAP: typing.Dict[CalibrationCheckState, ComparisonParams] = {
    CalibrationCheckState.comparingFirstPipetteHeight: ComparisonParams(
        reference_state=CalibrationCheckState.joggingFirstPipetteToHeight,
    ),
    CalibrationCheckState.comparingFirstPipettePointOne: ComparisonParams(
        reference_state=CalibrationCheckState.joggingFirstPipetteToPointOne,
    ),
    CalibrationCheckState.comparingFirstPipettePointTwo: ComparisonParams(
        reference_state=CalibrationCheckState.joggingFirstPipetteToPointTwo,
    ),
    CalibrationCheckState.comparingFirstPipettePointThree: ComparisonParams(
        reference_state=CalibrationCheckState.joggingFirstPipetteToPointThree,
    ),
    CalibrationCheckState.comparingSecondPipetteHeight: ComparisonParams(
        reference_state=CalibrationCheckState.joggingSecondPipetteToHeight,
    ),
    CalibrationCheckState.comparingSecondPipettePointOne: ComparisonParams(
        reference_state=CalibrationCheckState.joggingSecondPipetteToPointOne,
    ),
}


class CheckCalibrationSession(CalibrationSession, StateMachine):
    def __init__(self, hardware: 'ThreadManager',
                 lights_on_before: bool = False):
        CalibrationSession.__init__(self, hardware, lights_on_before)
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

    @property
    def _initial_z_offset(self):
        return Point(0, 0, 0.3)

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
                serial=str(hw_pip['pipette_id']),
            )
            to_dict[mount] = p
        return to_dict

    async def delete_session(self):
        for mount in self._pip_info_by_mount.keys():
            if self.pipettes[mount]['has_tip']:
                try:
                    await self._trash_tip(mount)
                except (CalibrationException, AssertionError):
                    pass
        await self.hardware.home()
        if not self._lights_on_before:
            await self.hardware.set_lights(rails=False)

    def _get_preparing_state_mount(self) -> typing.Optional[Mount]:
        pip = None
        if self.current_state_name == \
                CalibrationCheckState.inspectingFirstTip:
            pip = self._get_pipette_by_rank(PipetteRank.first)
        elif self.current_state_name == \
                CalibrationCheckState.inspectingSecondTip:
            pip = self._get_pipette_by_rank(PipetteRank.second)
        assert pip, f'cannot check prepare pipette from state:' \
                    f' {self.current_state_name}'
        return pip.mount

    def _look_up_state(self) -> CalibrationCheckState:
        """
        We want to check whether a tip pick up was dangerous during the
        tip inspection state, but the reference points are actually saved
        during the preparing pipette state, so we should reference those
        states when looking up the reference point.

        :return: The calibration check state that the reference point
        was saved under for tip pick up.
        """
        if self.current_state_name == CalibrationCheckState.inspectingFirstTip:
            return CalibrationCheckState.preparingFirstPipette
        elif self.current_state_name == \
                CalibrationCheckState.inspectingSecondTip:
            return CalibrationCheckState.preparingSecondPipette
        else:
            raise CalibrationException(
                f"No transition available for state {self.current_state_name}")

    async def _is_tip_pick_up_dangerous(self):
        """
        Function to determine whether jogged to pick up tip position is
        outside of the safe threshold for conducting the rest of the check.
        """
        mount = self._get_preparing_state_mount()
        assert mount, 'cannot attempt tip pick up, no mount specified'

        ref_state = self._look_up_state()
        jogged_pt = self._saved_points[getattr(CalibrationCheckState,
                                               self.current_state_name)]

        ref_pt = self._saved_points[getattr(CalibrationCheckState,
                                            ref_state)]

        ref_pt_no_safety = ref_pt - MOVE_TO_TIP_RACK_SAFETY_BUFFER
        threshold_vector = DEFAULT_OK_TIP_PICK_UP_VECTOR
        pip_model = self.pipettes[mount]['model']
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

    async def _pick_up_tip_first_pipette(self):
        """
        Function to pick up tip. It will attempt to pick up a tip in
        the current location, and save any offset it might have from the
        original position.
        """
        pip = self._get_pipette_by_rank(PipetteRank.first)
        assert pip, 'No pipette attached on first mount'

        mount = pip.mount

        assert mount, 'cannot attempt tip pick up, no mount specified'
        assert self.pipettes[mount]['has_tip'] is False, \
            f"Tip is already attached to {mount} pipette, " \
            "cannot pick up another"

        await self._pick_up_tip(mount)

    async def _pick_up_tip_second_pipette(self):
        """
        Function to pick up tip. It will attempt to pick up a tip in
        the current location, and save any offset it might have from the
        original position.
        """
        pip = self._get_pipette_by_rank(PipetteRank.second)
        assert pip, 'No pipette attached on second mount'

        mount = pip.mount

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

    def _determine_threshold(self, state: CalibrationCheckState) -> Point:
        """
        Helper function used to determine the threshold for comparison
        based on the state currently being compared and the pipette.
        """
        first_pipette = [
            CalibrationCheckState.comparingFirstPipetteHeight,
            CalibrationCheckState.comparingFirstPipettePointOne,
            CalibrationCheckState.comparingFirstPipettePointTwo,
            CalibrationCheckState.comparingFirstPipettePointThree,
        ]
        if state in first_pipette:
            pip = self._get_pipette_by_rank(PipetteRank.first)
        else:
            pip = self._get_pipette_by_rank(PipetteRank.second)

        pipette_type = ''
        if pip and pip.mount:
            pipette_type = str(self.pipettes[pip.mount]['name'])

        is_p1000 = pipette_type in ['p1000_single_gen2', 'p1000_single']
        is_p20 = pipette_type in \
            ['p20_single_gen2', 'p10_single', 'p20_multi_gen2', 'p10_multi']
        height_states = [
            CalibrationCheckState.comparingFirstPipetteHeight,
            CalibrationCheckState.comparingSecondPipetteHeight]
        cross_states = [
            CalibrationCheckState.comparingFirstPipettePointOne,
            CalibrationCheckState.comparingFirstPipettePointTwo,
            CalibrationCheckState.comparingFirstPipettePointThree,
            CalibrationCheckState.comparingSecondPipettePointOne
        ]
        if is_p1000 and state in cross_states:
            return PIPETTE_TOLERANCES['p1000_crosses']
        elif is_p1000 and state in height_states:
            return PIPETTE_TOLERANCES['p1000_height']
        elif is_p20 and state in cross_states:
            return PIPETTE_TOLERANCES['p20_crosses']
        elif state in cross_states:
            return PIPETTE_TOLERANCES['p300_crosses']
        else:
            return PIPETTE_TOLERANCES['other_height']

    def _get_error_source(
            self,
            comparisons: typing.Dict[CalibrationCheckState, ComparisonStatus],
            jogged_state: CalibrationCheckState) -> DeckCalibrationError:
        is_second_pip = jogged_state in [
            CalibrationCheckState.joggingSecondPipetteToHeight,
            CalibrationCheckState.joggingSecondPipetteToPointOne,
        ]
        first_pip_keys = [
            CalibrationCheckState.joggingFirstPipetteToHeight,
            CalibrationCheckState.joggingFirstPipetteToPointOne,
            CalibrationCheckState.joggingFirstPipetteToPointTwo,
            CalibrationCheckState.joggingFirstPipetteToPointThree,
        ]
        compared_first = all((k in comparisons) for k in first_pip_keys)
        first_pip_steps_passed = compared_first
        for key in first_pip_keys:
            c = comparisons.get(key, None)
            if c and c.exceedsThreshold:
                first_pip_steps_passed = False
                break
        if is_second_pip and first_pip_steps_passed:
            return DeckCalibrationError.BAD_INSTRUMENT_OFFSET
        elif self.can_distinguish_instr_offset() and not is_second_pip:
            return DeckCalibrationError.BAD_DECK_TRANSFORM
        else:
            return DeckCalibrationError.UNKNOWN

    def get_comparisons_by_step(
            self) -> typing.Dict[CalibrationCheckState, ComparisonStatus]:
        comparisons: typing.Dict[CalibrationCheckState, ComparisonStatus] = {}
        for jogged_state, comp in COMPARISON_STATE_MAP.items():
            ref_pt = self._saved_points.get(getattr(CalibrationCheckState,
                                                    comp.reference_state),
                                            None)

            jogged_pt = self._saved_points.get(getattr(CalibrationCheckState,
                                                       jogged_state), None)

            threshold_vector = self._determine_threshold(jogged_state)
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
                    tform_type = self._get_error_source(comparisons,
                                                        jogged_state)
                comparisons[getattr(CalibrationCheckState, jogged_state)] = \
                    ComparisonStatus(differenceVector=(jogged_pt - ref_pt),
                                     thresholdVector=threshold_vector,
                                     exceedsThreshold=exceeds,
                                     transformType=str(tform_type))
        return comparisons

    async def _register_point_first_pipette(self):
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        assert first_pip, 'cannot register point for missing first pipette'
        buffer = Point(0, 0, 0)
        if self.current_state_name ==\
                CalibrationCheckState.comparingFirstPipetteHeight:
            buffer = HEIGHT_SAFETY_BUFFER
        current_point = self.hardware.gantry_position(
            first_pip.mount, critical_point=first_pip.critical_point)
        self._saved_points[getattr(CalibrationCheckState,
                                   self.current_state_name)] = \
            await current_point + buffer

    async def _register_point_second_pipette(self):
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        assert second_pip, 'cannot register point for missing second pipette'
        buffer = Point(0, 0, 0)
        if self.current_state_name ==\
                CalibrationCheckState.comparingSecondPipetteHeight:
            buffer = HEIGHT_SAFETY_BUFFER
        current_point = self.hardware.gantry_position(
            second_pip.mount, critical_point=second_pip.critical_point
        )
        self._saved_points[getattr(CalibrationCheckState,
                                   self.current_state_name)] = \
            await current_point + buffer

    async def _move_first_pipette(self):
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        assert first_pip, \
            'cannot move pipette on first mount, pipette not present'
        loc_to_move = Location(getattr(self._moves,
                                       self.current_state_name).position,
                               None)

        saved_z_allowlist = \
            [CalibrationCheckState.joggingFirstPipetteToPointOne,
             CalibrationCheckState.joggingFirstPipetteToPointTwo,
             CalibrationCheckState.joggingFirstPipetteToPointThree]
        if self.current_state_name in saved_z_allowlist:
            saved_height =\
                self._saved_points[getattr(CalibrationCheckState,
                                           'comparingFirstPipetteHeight')]
            z_point = \
                saved_height + self._initial_z_offset - HEIGHT_SAFETY_BUFFER
            updated_point = loc_to_move.point + z_point._replace(x=0.0, y=0.0)
            loc_to_move = Location(updated_point, None)
        await self._move(first_pip.mount, loc_to_move)
        await self._register_point_first_pipette()

    async def _move_second_pipette(self):
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        assert second_pip, \
            'cannot move pipette on second mount, pipette not present'
        loc_to_move = Location(getattr(self._moves,
                                       self.current_state_name).position,
                               None)
        if self.current_state_name ==\
                CalibrationCheckState.joggingSecondPipetteToPointOne:
            saved_height =\
                self._saved_points[getattr(CalibrationCheckState,
                                           'comparingSecondPipetteHeight')]
            z_point = \
                saved_height + self._initial_z_offset - HEIGHT_SAFETY_BUFFER
            updated_point = loc_to_move.point + z_point._replace(x=0.0, y=0.0)
            loc_to_move = Location(updated_point, None)
        await self._move(second_pip.mount, loc_to_move)
        await self._register_point_second_pipette()

    async def _jog_first_pipette(self, vector: OffsetVector):
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        assert first_pip, \
            'cannot jog pipette on first mount, pipette not present'
        await super(self.__class__, self)._jog(first_pip.mount, Point(*vector))

    async def _jog_second_pipette(self, vector: OffsetVector):
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        assert second_pip, \
            'cannot jog pipette on second mount, pipette not present'
        await super(self.__class__, self)._jog(second_pip.mount,
                                               Point(*vector))

    async def _return_first_tip(self):
        first_pip = self._get_pipette_by_rank(PipetteRank.first)
        assert first_pip, \
            'cannot drop tip on first mount, pipette not present'
        mount = first_pip.mount
        z_value = float(self.pipettes[mount]['tip_length']) * 0.5
        state_name = CalibrationCheckState.inspectingFirstTip

        return_pt = self._saved_points[getattr(CalibrationCheckState,
                                       state_name)]
        account_for_tip = return_pt - Point(0, 0, z_value)
        loc = Location(account_for_tip, None)
        await self._move(first_pip.mount, loc)
        await self._drop_tip(first_pip.mount)

    async def _return_second_tip(self):
        second_pip = self._get_pipette_by_rank(PipetteRank.second)
        assert second_pip, \
            'cannot drop tip on second mount, pipette not present'
        mount = second_pip.mount
        z_value = float(self.pipettes[mount]['tip_length']) * 0.5
        state_name = CalibrationCheckState.inspectingSecondTip
        return_pt = self._saved_points[getattr(CalibrationCheckState,
                                       state_name)]
        account_for_tip = return_pt - Point(0, 0, z_value)
        loc = Location(account_for_tip, None)
        await self._move(second_pip.mount, loc)
        await self._drop_tip(second_pip.mount)
