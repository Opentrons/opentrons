from __future__ import annotations

import logging
from typing import (
    Any, Awaitable, Callable, Dict, List, Optional, Tuple,
    Union, TYPE_CHECKING)

from opentrons.calibration_storage import get
from opentrons.calibration_storage.types import TipLengthCalNotFound
from opentrons.calibration_storage import helpers
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import robot_calibration as robot_cal
from opentrons.hardware_control import ThreadManager, CriticalPoint
from opentrons.hardware_control.pipette import Pipette
from opentrons.protocol_api import labware
from opentrons.protocols.geometry import deck
from opentrons.types import Mount, Point, Location

from robot_server.robot.calibration.constants import \
    TIP_RACK_LOOKUP_BY_MAX_VOL
from robot_server.service.errors import RobotServerError
from opentrons.util import linal

from robot_server.service.session.models import (
    CalibrationCommand, DeckCalibrationCommand)
from robot_server.robot.calibration.constants import (
    SHORT_TRASH_DECK, STANDARD_DECK, MOVE_TO_DECK_SAFETY_BUFFER,
    MOVE_TO_TIP_RACK_SAFETY_BUFFER, POINT_ONE_ID, POINT_TWO_ID,
    POINT_THREE_ID)
import robot_server.robot.calibration.util as uf
from .constants import (
    DeckCalibrationState as State,
    JOG_TO_DECK_SLOT,
    TIP_RACK_SLOT,
    MOVE_POINT_STATE_MAP,
    SAVE_POINT_STATE_MAP)
from .state_machine import DeckCalibrationStateMachine
from ..errors import CalibrationError
from ..helper_classes import (
    RequiredLabware,
    AttachedPipette)

if TYPE_CHECKING:
    from .dev_types import SavedPoints, ExpectedPoints


MODULE_LOG = logging.getLogger(__name__)

"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the orientations of the robot's deck
and gantry system.
"""

# TODO: BC 2020-07-08: type all command logic here with actual Model type
COMMAND_HANDLER = Callable[..., Awaitable]

COMMAND_MAP = Dict[str, COMMAND_HANDLER]


def tuplefy_cal_point_dicts(
        pt_dicts: Union[ExpectedPoints, SavedPoints]) -> linal.SolvePoints:
    return (
        tuple(pt_dicts[POINT_ONE_ID]),  # type: ignore
        tuple(pt_dicts[POINT_TWO_ID]),
        tuple(pt_dicts[POINT_THREE_ID])
        )


class DeckCalibrationUserFlow:
    def __init__(self,
                 hardware: ThreadManager):
        self._hardware = hardware
        self._hw_pipette, self._mount = self._select_target_pipette()

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = deck.Deck(load_name=deck_load_name)
        self._tip_rack = self._get_tip_rack_lw()
        self._deck[TIP_RACK_SLOT] = self._tip_rack

        self._current_state = State.sessionStarted
        self._state_machine = DeckCalibrationStateMachine()

        self._tip_origin_pt: Optional[Point] = None
        self._z_height_reference: Optional[float] = None
        self._expected_points = self._build_expected_points_dict()
        self._saved_points: SavedPoints = {}

        self._command_map: COMMAND_MAP = {
            CalibrationCommand.load_labware: self.load_labware,
            CalibrationCommand.jog: self.jog,
            CalibrationCommand.pick_up_tip: self.pick_up_tip,
            CalibrationCommand.invalidate_tip: self.invalidate_tip,
            CalibrationCommand.save_offset: self.save_offset,
            CalibrationCommand.move_to_tip_rack: self.move_to_tip_rack,
            CalibrationCommand.move_to_deck: self.move_to_deck,
            CalibrationCommand.move_to_point_one: self.move_to_point_one,
            DeckCalibrationCommand.move_to_point_two: self.move_to_point_two,
            DeckCalibrationCommand.move_to_point_three: self.move_to_point_three,  # noqa: E501
            CalibrationCommand.exit: self.exit_session,
        }

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    @property
    def current_state(self) -> State:
        return self._current_state

    def get_pipette(self) -> Optional[AttachedPipette]:
        return AttachedPipette(
            model=self._hw_pipette.model,
            name=self._hw_pipette.name,
            tip_length=self._hw_pipette.config.tip_length,
            mount=str(self._mount),
            serial=self._hw_pipette.pipette_id)

    def get_required_labware(self) -> List[RequiredLabware]:
        lw = self._get_tip_rack_lw()
        return [RequiredLabware.from_lw(lw)]

    def _set_current_state(self, to_state: State):
        self._current_state = to_state

    def _select_target_pipette(self) -> Tuple[Pipette, Mount]:
        """
        Select pipette for calibration based on:
        1: smaller max volume
        2: single-channel over multi
        3: right mount over left
        """
        if not any(self._hardware._attached_instruments.values()):
            raise RobotServerError(
                definition=CalibrationError.NO_PIPETTE_ATTACHED,
                flow='Deck Calibration')
        pips = {m: p for m, p in self._hardware._attached_instruments.items()
                if p}
        if len(pips) == 1:
            for mount, pip in pips.items():
                return pip, mount

        right_pip = pips[Mount.RIGHT]
        left_pip = pips[Mount.LEFT]
        if right_pip.config.max_volume > left_pip.config.max_volume or \
                right_pip.config.channels > left_pip.config.channels:
            return left_pip, Mount.LEFT
        else:
            return right_pip, Mount.RIGHT

    def _get_tip_rack_lw(self) -> labware.Labware:
        pip_vol = self._hw_pipette.config.max_volume
        lw_load_name = TIP_RACK_LOOKUP_BY_MAX_VOL[str(pip_vol)].load_name
        return labware.load(
            lw_load_name, self._deck.position_for(TIP_RACK_SLOT))

    def _initialize_deck(self):
        tip_rack_lw = self._get_tip_rack_lw()
        self._deck[TIP_RACK_SLOT] = tip_rack_lw

    def _build_expected_points_dict(self) -> ExpectedPoints:
        pos_1 = self._deck.get_calibration_position(POINT_ONE_ID).position
        pos_2 = self._deck.get_calibration_position(POINT_TWO_ID).position
        pos_3 = self._deck.get_calibration_position(POINT_THREE_ID).position
        exp_pt: ExpectedPoints = {
            POINT_ONE_ID: Point(*pos_1)._replace(z=1.0),
            POINT_TWO_ID: Point(*pos_2)._replace(z=1.0),
            POINT_THREE_ID: Point(*pos_3)._replace(z=1.0)
        }
        return exp_pt

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
            f'DeckCalUserFlow handled command {name}, transitioned'
            f'from {self._current_state} to {next_state}')

    def _get_critical_point_override(self) -> Optional[CriticalPoint]:
        return (CriticalPoint.FRONT_NOZZLE if
                self._hw_pipette.config.channels == 8 else None)

    async def _get_current_point(
            self,
            critical_point: CriticalPoint = None) -> Point:
        return await uf.get_current_point(self, critical_point)

    async def load_labware(self):
        pass

    async def jog(self, vector):
        await self._hardware.move_rel(mount=self._mount,
                                      delta=Point(*vector))

    async def move_to_tip_rack(self):
        point = self._deck[TIP_RACK_SLOT].wells()[0].top().point + \
                MOVE_TO_TIP_RACK_SAFETY_BUFFER
        to_loc = Location(point, None)
        await self._move(to_loc)

    async def move_to_deck(self):
        deck_pt = self._deck.get_slot_center(JOG_TO_DECK_SLOT)
        ydim = self._deck.get_slot_definition(
            JOG_TO_DECK_SLOT)['boundingBox']['yDimension']
        new_pt = deck_pt - Point(0, (ydim/2), deck_pt.z) + \
            MOVE_TO_DECK_SAFETY_BUFFER
        to_loc = Location(new_pt, None)
        await self._move(to_loc)

    def _get_move_to_point_loc_by_state(self) -> Location:
        assert self._z_height_reference
        pt_id = MOVE_POINT_STATE_MAP[self._current_state]
        coords = self._deck.get_calibration_position(pt_id).position
        loc = Location(Point(*coords), None)
        return loc.move(point=Point(0, 0, self._z_height_reference))

    async def move_to_point_one(self):
        await self._move(self._get_move_to_point_loc_by_state())

    async def move_to_point_two(self):
        await self._move(self._get_move_to_point_loc_by_state())

    async def move_to_point_three(self):
        await self._move(self._get_move_to_point_loc_by_state())

    async def save_offset(self):
        cur_pt = await self._get_current_point(critical_point=None)
        if self.current_state == State.joggingToDeck:
            self._z_height_reference = cur_pt.z
        else:
            pt_id = SAVE_POINT_STATE_MAP[self._current_state]
            self._saved_points[pt_id] = cur_pt

            if self._current_state == State.savingPointThree:
                self._save_attitude_matrix()

    def _save_attitude_matrix(self):
        e = tuplefy_cal_point_dicts(self._expected_points)
        a = tuplefy_cal_point_dicts(self._saved_points)
        tiprack_hash = helpers.hash_labware_def(
            self._deck[TIP_RACK_SLOT]._definition) + ''
        robot_cal.save_attitude_matrix(
            expected=e,
            actual=a,
            pipette_id=self._hw_pipette.pipette_id,
            tiprack_hash=tiprack_hash)

    def _get_tip_length(self) -> float:
        try:
            return get.load_tip_length_calibration(
                self._hw_pipette.pipette_id,  # type: ignore
                self._tip_rack._definition,
                '')['tipLength']
        except TipLengthCalNotFound:
            tip_overlap = self._hw_pipette.config.tip_overlap.get(
                self._tip_rack.uri,
                self._hw_pipette.config.tip_overlap['default'])
            tip_length = self._tip_rack.tip_length
            return tip_length - tip_overlap

    async def pick_up_tip(self):
        await uf.pick_up_tip(self, tip_length=self._get_tip_length())

    async def invalidate_tip(self):
        await uf.invalidate_tip(self)

    async def _return_tip(self):
        await uf.return_tip(self, tip_length=self._get_tip_length())

    async def _move(self, to_loc: Location):
        await uf.move(self, to_loc)

    async def exit_session(self):
        await self.move_to_tip_rack()
        await self._return_tip()
