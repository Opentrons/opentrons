import logging
from typing import Any, Awaitable, Callable, Dict, List, Optional

from opentrons.calibration_storage import get, modify, helpers
from opentrons.calibration_storage.types import TipLengthCalNotFound
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import ThreadManager, CriticalPoint
from opentrons.protocol_api import labware
from opentrons.protocols.geometry import deck
from opentrons.types import Mount, Point, Location
from robot_server.service.errors import RobotServerError
from robot_server.service.session.models import CalibrationCommand
from robot_server.robot.calibration import util
from ..errors import CalibrationError
from ..helper_classes import (RequiredLabware, AttachedPipette)
from ..constants import TIP_RACK_LOOKUP_BY_MAX_VOL, SHORT_TRASH_DECK, \
    STANDARD_DECK, POINT_ONE_ID, MOVE_TO_DECK_SAFETY_BUFFER, \
    MOVE_TO_TIP_RACK_SAFETY_BUFFER, CAL_BLOCK_SETUP_BY_MOUNT
from .constants import (PipetteOffsetCalibrationState as State,
                        TIP_RACK_SLOT, JOG_TO_DECK_SLOT)
from .state_machine import PipetteOffsetCalibrationStateMachine


MODULE_LOG = logging.getLogger(__name__)

"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the position of a specific physical
pipette attached to the gantry, in relation to the deck
"""

# TODO: BC 2020-07-08: type all command logic here with actual Model type
COMMAND_HANDLER = Callable[..., Awaitable]

COMMAND_MAP = Dict[str, COMMAND_HANDLER]


class PipetteOffsetCalibrationUserFlow:
    def __init__(self, hardware: ThreadManager, mount: Mount = Mount.RIGHT):
        self._hardware = hardware
        self._mount = mount
        self._has_calibration_block: Optional[bool] = None
        self._hw_pipette = self._hardware._attached_instruments[mount]
        if not self._hw_pipette:
            raise RobotServerError(
                definition=CalibrationError.NO_PIPETTE_ON_MOUNT,
                mount=mount)

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = deck.Deck(load_name=deck_load_name)

        self._saved_offset_this_session = False
        self._current_state = State.sessionStarted
        self._state_machine = PipetteOffsetCalibrationStateMachine()

        self._tip_origin_pt: Optional[Point] = None
        self._nozzle_height_at_reference: Optional[float] = None
        self._has_calibrated_tip_length: bool =\
            self._get_stored_tip_length_cal() is not None

        self._command_map: COMMAND_MAP = {
            CalibrationCommand.load_labware: self.load_labware,
            CalibrationCommand.set_has_calibration_block:
                self.set_has_calibration_block,
            CalibrationCommand.move_to_reference_point: self.move_to_reference_point,  # noqa: E501
            CalibrationCommand.jog: self.jog,
            CalibrationCommand.pick_up_tip: self.pick_up_tip,
            CalibrationCommand.invalidate_tip: self.invalidate_tip,
            CalibrationCommand.save_offset: self.save_offset,
            CalibrationCommand.move_to_tip_rack: self.move_to_tip_rack,
            CalibrationCommand.move_to_deck: self.move_to_deck,
            CalibrationCommand.move_to_point_one: self.move_to_point_one,
            CalibrationCommand.exit: self.exit_session,
        }

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    @property
    def current_state(self) -> State:
        return self._current_state

    @property
    def has_calibrated_tip_length(self) -> State:
        return self._has_calibrated_tip_length

    def get_pipette(self) -> AttachedPipette:
        return AttachedPipette(
            model=self._hw_pipette.model,
            name=self._hw_pipette.name,
            tip_length=self._hw_pipette.config.tip_length,
            mount=str(self._mount),
            serial=self._hw_pipette.pipette_id)

    def get_required_labware(self) -> List[RequiredLabware]:
        return [RequiredLabware.from_lw(self._tip_rack)]

    def _set_current_state(self, to_state: State):
        self._current_state = to_state

    def _get_tip_rack_lw(self) -> labware.Labware:
        pip_vol = self._hw_pipette.config.max_volume
        lw_load_name = TIP_RACK_LOOKUP_BY_MAX_VOL[str(pip_vol)].load_name
        return labware.load(lw_load_name,
                            self._deck.position_for(TIP_RACK_SLOT))

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
            f'PipetteOffsetCalUserFlow handled command {name}, transitioned'
            f'from {self._current_state} to {next_state}')

    def _get_critical_point_override(self) -> Optional[CriticalPoint]:
        return (CriticalPoint.FRONT_NOZZLE if
                self._hw_pipette.config.channels == 8 else None)

    async def _get_current_point(
            self,
            critical_point: Optional[CriticalPoint]) -> Point:
        return await self._hardware.gantry_position(self._mount,
                                                    critical_point)

    async def load_labware(self):
        self._initialize_deck()

    async def set_has_calibration_block(self, has_calibration_block: bool):
        self._has_calibration_block = has_calibration_block

    async def jog(self, vector):
        await self._hardware.move_rel(mount=self._mount,
                                      delta=Point(*vector))

    async def move_to_tip_rack(self):
        if self._current_state == State.labwareLoaded and \
                not self._has_calibrated_tip_length:
            self._flag_unmet_transition_req(
                command_handler="move_to_tip_rack",
                unmet_condition="tip length calibration data exists")
        point = self._tip_rack.wells()[0].top().point + \
            MOVE_TO_TIP_RACK_SAFETY_BUFFER
        to_loc = Location(point, None)
        await self._move(to_loc)

    def _get_stored_tip_length_cal(self) -> Optional[float]:
        try:
            return get.load_tip_length_calibration(
                self._hw_pipette.pipette_id,
                self._tip_rack._definition,
                '')['tipLength']
        except TipLengthCalNotFound:
            return None

    def _get_tip_length(self) -> float:
        stored_tip_length_cal = self._get_stored_tip_length_cal()
        if stored_tip_length_cal is None:
            tip_overlap = self._hw_pipette.config.tip_overlap.get(
                self._tip_rack.uri,
                self._hw_pipette.config.tip_overlap['default'])
            tip_length = self._tip_rack.tip_length
            self._has_calibrated_tip_length = False
            return tip_length - tip_overlap
        else:
            self._has_calibrated_tip_length = True
            return stored_tip_length_cal

    def _initialize_deck(self):
        self._tip_rack = self._get_tip_rack_lw()
        self._deck[TIP_RACK_SLOT] = self._tip_rack

        if not self._has_calibrated_tip_length and self._has_calibration_block:
            cb_setup = CAL_BLOCK_SETUP_BY_MOUNT[self._mount]
            self._deck[cb_setup['slot']] = labware.load(
                cb_setup['load_name'],
                self._deck.position_for(cb_setup['slot']))

    def _flag_unmet_transition_req(self, command_handler: str,
                                   unmet_condition: str):
        raise RobotServerError(
            definition=CalibrationError.UNMET_STATE_TRANSITION_REQ,
            handler=command_handler,
            state=self._current_state,
            condition=unmet_condition)

    async def move_to_deck(self):
        if not self._has_calibrated_tip_length and \
                self._current_state == State.inspectingTip:
            self._flag_unmet_transition_req(
                command_handler="move_to_deck",
                unmet_condition="tip length calibration data exists")
        if self._current_state == State.calibrationComplete and \
                self._saved_offset_this_session:
            self._flag_unmet_transition_req(
                command_handler="move_to_deck",
                unmet_condition="offset not saved this session")
        deck_pt = self._deck.get_slot_center(JOG_TO_DECK_SLOT)
        ydim = self._deck.get_slot_definition(
            JOG_TO_DECK_SLOT)['boundingBox']['yDimension']
        new_pt = deck_pt + Point(0, -1 * ydim/2, 0) + \
            MOVE_TO_DECK_SAFETY_BUFFER
        to_loc = Location(new_pt, None)
        await self._move(to_loc)

    async def move_to_point_one(self):
        assert self._z_height_reference is not None, \
            "saveOffset has not been called yet"
        coords = self._deck.get_calibration_position(POINT_ONE_ID).position
        point_loc = Location(Point(*coords), None)
        await self._move(
            point_loc.move(point=Point(0, 0, self._z_height_reference)))

    async def save_offset(self):
        cur_pt = await self._get_current_point(critical_point=None)
        if self.current_state == State.joggingToDeck:
            self._z_height_reference = cur_pt.z
        elif self._current_state == State.savingPointOne:
            tiprack_hash = helpers.hash_labware_def(
                self._tip_rack._definition)
            modify.save_pipette_calibration(
                offset=cur_pt,
                mount=self._mount,
                pip_id=self._hw_pipette.pipette_id,
                tiprack_hash=tiprack_hash,
                tiprack_uri=self._tip_rack.uri)
            self._saved_offset_this_session = True
        elif self._current_state == State.measuringNozzleOffset:
            self._nozzle_height_at_reference = cur_pt.z
        elif self._current_state == State.measuringTipOffset:
            assert self._hw_pipette.has_tip
            util.save_tip_length_calibration(
                pipette_id=self._hw_pipette.pipette_id,
                tip_length_offset=cur_pt.z - self._nozzle_height_at_reference,
                tip_rack=self._tip_rack)

    async def move_to_reference_point(self):
        if self._has_calibrated_tip_length and \
                self._current_state in (State.labwareLoaded,
                                        State.inspectingTip):
            self._flag_unmet_transition_req(
                command_handler="move_to_reference_point",
                unmet_condition="missing tip length calibration")
        ref_loc = util.get_reference_location(
            mount=self._mount,
            deck=self._deck,
            has_calibration_block=self._has_calibration_block)
        await self._move(ref_loc)

    async def pick_up_tip(self):
        await util.pick_up_tip(self, tip_length=self._get_tip_length())

    async def invalidate_tip(self):
        await util.invalidate_tip(self)

    async def _return_tip(self):
        await util.return_tip(self, tip_length=self._get_tip_length())

    async def _move(self, to_loc: Location):
        await util.move(self, to_loc)

    async def exit_session(self):
        await self.move_to_tip_rack()
        await self._return_tip()
