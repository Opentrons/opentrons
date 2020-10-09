import logging
from typing import (
    Any, Awaitable, Callable, Dict,
    List, Optional, Union, TYPE_CHECKING)

from opentrons.calibration_storage import get, modify, helpers
from opentrons.calibration_storage.types import TipLengthCalNotFound
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import ThreadManager, CriticalPoint
from opentrons.protocol_api import labware
from opentrons.protocols.geometry import deck
from opentrons.types import Mount, Point, Location
from robot_server.service.errors import RobotServerError
from robot_server.service.session.models.command import \
    CalibrationCommand
from robot_server.robot.calibration import util
from robot_server.robot.calibration.constants import (
    TIP_RACK_LOOKUP_BY_MAX_VOL,
    SHORT_TRASH_DECK,
    STANDARD_DECK,
    POINT_ONE_ID,
    MOVE_TO_DECK_SAFETY_BUFFER,
    MOVE_TO_TIP_RACK_SAFETY_BUFFER,
    CAL_BLOCK_SETUP_BY_MOUNT)
from ..errors import CalibrationError
from ..helper_classes import (RequiredLabware, AttachedPipette)
from .constants import (
    PipetteOffsetCalibrationState as POCState,
    PipetteOffsetWithTipLengthCalibrationState as POWTState,
    GenericState, TIP_RACK_SLOT, JOG_TO_DECK_SLOT)
from .state_machine import (
    PipetteOffsetCalibrationStateMachine,
    PipetteOffsetWithTipLengthStateMachine)

if TYPE_CHECKING:
    from opentrons_shared_data.labware import LabwareDefinition


MODULE_LOG = logging.getLogger(__name__)

"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the position of a specific physical
pipette attached to the gantry, in relation to the deck
"""

# TODO: BC 2020-07-08: type all command logic here with actual Model type
COMMAND_HANDLER = Callable[..., Awaitable]

COMMAND_MAP = Dict[str, COMMAND_HANDLER]
PipetteOffsetStateMachine = Union[
    PipetteOffsetCalibrationStateMachine,
    PipetteOffsetWithTipLengthStateMachine]


class PipetteOffsetCalibrationUserFlow:
    def __init__(self,
                 hardware: ThreadManager,
                 mount: Mount = Mount.RIGHT,
                 perform_tip_length: bool = False,
                 has_calibration_block: bool = False,
                 tip_rack_def: Optional['LabwareDefinition'] = None):

        self._hardware = hardware
        self._mount = mount
        self._has_calibration_block = has_calibration_block
        self._hw_pipette = self._hardware._attached_instruments[mount]
        if not self._hw_pipette:
            raise RobotServerError(
                definition=CalibrationError.NO_PIPETTE_ON_MOUNT,
                mount=mount)

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = deck.Deck(load_name=deck_load_name)

        self._saved_offset_this_session = False

        point_one_pos = \
            self._deck.get_calibration_position(POINT_ONE_ID).position
        self._cal_ref_point = Point(*point_one_pos)

        self._tip_origin_pt: Optional[Point] = None
        self._nozzle_height_at_reference: Optional[float] = None

        self._using_default_tiprack = False
        self._load_tiprack(tip_rack_def)
        self._initialize_deck()
        self._has_calibrated_tip_length: bool =\
            (self._get_stored_tip_length_cal() is not None
             or self._using_default_tiprack)

        if perform_tip_length:
            self._state_machine: PipetteOffsetStateMachine =\
                PipetteOffsetWithTipLengthStateMachine()
            self._state: GenericState = POWTState  # type: ignore
        else:
            self._state_machine =\
                PipetteOffsetCalibrationStateMachine()
            self._state = POCState  # type: ignore
        self._current_state = self._state.sessionStarted
        self._should_perform_tip_length = perform_tip_length

        self._command_map: COMMAND_MAP = {
            CalibrationCommand.load_labware: self.load_labware,
            CalibrationCommand.move_to_reference_point:
                self.move_to_reference_point,
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
    def current_state(self) -> GenericState:
        # Currently, mypy can't interpret enum
        # values being saved as variables. Although
        # using python's built-in typing methods
        # correctly reveals that this is an enum,
        # mypy believes it is a string.
        return self._current_state

    @property
    def has_calibrated_tip_length(self) -> bool:
        return self._has_calibrated_tip_length

    @property
    def should_perform_tip_length(self) -> bool:
        return self._should_perform_tip_length

    def get_pipette(self) -> AttachedPipette:
        # TODO(mc, 2020-09-17): s/tip_length/tipLength
        return AttachedPipette(  # type: ignore[call-arg]
            model=self._hw_pipette.model,
            name=self._hw_pipette.name,
            tip_length=self._hw_pipette.config.tip_length,
            mount=str(self._mount),
            serial=self._hw_pipette.pipette_id)

    def get_required_labware(self) -> List[RequiredLabware]:
        slots = self._deck.get_non_fixture_slots()
        lw_by_slot = {s: self._deck[s] for s in slots if self._deck[s]}
        return [
            RequiredLabware.from_lw(lw, s)  # type: ignore
            for s, lw in lw_by_slot.items()]

    def _set_current_state(self, to_state: GenericState):
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
        pass

    async def set_has_calibration_block(self, has_calibration_block: bool):
        self._has_calibration_block = has_calibration_block
        if self._has_calibration_block:
            self._load_calibration_block()
        else:
            slot = CAL_BLOCK_SETUP_BY_MOUNT[self._mount].slot
            self._deck[slot] = None  # type: ignore

    async def jog(self, vector):
        await self._hardware.move_rel(mount=self._mount,
                                      delta=Point(*vector))

    async def move_to_tip_rack(self):
        if self._current_state == self._state.labwareLoaded and \
                not self.has_calibrated_tip_length and\
                not self.should_perform_tip_length:
            self._flag_unmet_transition_req(
                command_handler="move_to_tip_rack",
                unmet_condition="tip length calibration data does not exist")
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
            return tip_length - tip_overlap
        else:
            return stored_tip_length_cal

    def _load_tiprack(self,
                      tip_rack_def: Optional['LabwareDefinition'] = None):
        """
        load onto the deck the default opentrons tip rack labware for this
        pipette and return the tip rack labware. If tip_rack_def is supplied,
        load specific tip rack from def onto the deck and return the labware.
        """
        if tip_rack_def:
            tr_lw = labware.load_from_definition(
                tip_rack_def,
                self._deck.position_for(TIP_RACK_SLOT))
        else:
            pip_vol = self._hw_pipette.config.max_volume
            tr_load_name = TIP_RACK_LOOKUP_BY_MAX_VOL[str(pip_vol)].load_name
            tr_lw = labware.load(tr_load_name,
                                 self._deck.position_for(TIP_RACK_SLOT))
            self._using_default_tiprack = True
        self._tip_rack = tr_lw

    def _load_calibration_block(self):
        cb_setup = CAL_BLOCK_SETUP_BY_MOUNT[self._mount]
        self._deck[cb_setup.slot] = labware.load(
            cb_setup.load_name,
            self._deck.position_for(cb_setup.slot))

    def _flag_unmet_transition_req(self, command_handler: str,
                                   unmet_condition: str):
        raise RobotServerError(
            definition=CalibrationError.UNMET_STATE_TRANSITION_REQ,
            handler=command_handler,
            state=self._current_state,
            condition=unmet_condition)

    async def move_to_deck(self):
        if not self.has_calibrated_tip_length and \
                self._current_state == self._state.inspectingTip:
            self._flag_unmet_transition_req(
                command_handler="move_to_deck",
                unmet_condition="tip length calibration data does not exist")
        if self._current_state == self._state.calibrationComplete:
            # recache tip length cal which has just been saved
            self._has_calibrated_tip_length =\
                (self._get_stored_tip_length_cal() is not None)
            if self._saved_offset_this_session:
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
        target_loc = Location(self._cal_ref_point, None)
        target = target_loc.move(
                point=Point(0, 0, self._z_height_reference))
        await self._move(target)

    async def save_offset(self):
        cur_pt = await self._get_current_point(critical_point=None)
        if self.current_state == self._state.joggingToDeck:
            self._z_height_reference = cur_pt.z
        elif self._current_state == self._state.savingPointOne:
            if self._hw_pipette.config.channels > 1:
                cur_pt = await self._get_current_point(
                    critical_point=CriticalPoint.FRONT_NOZZLE)
            tiprack_hash = helpers.hash_labware_def(
                self._tip_rack._definition)
            offset = self._cal_ref_point - cur_pt
            modify.save_pipette_calibration(
                offset=offset,
                mount=self._mount,
                pip_id=self._hw_pipette.pipette_id,
                tiprack_hash=tiprack_hash,
                tiprack_uri=self._tip_rack.uri)
            self._saved_offset_this_session = True
        elif isinstance(self._current_state, POWTState)\
                and self._current_state == self._state.measuringNozzleOffset:
            self._nozzle_height_at_reference = cur_pt.z
        elif isinstance(self._current_state, POWTState)\
                and self._current_state == self._state.measuringTipOffset:
            assert self._hw_pipette.has_tip
            assert self._nozzle_height_at_reference is not None
            # set critical point explicitly to nozzle
            noz_pt = await self._get_current_point(
                critical_point=CriticalPoint.NOZZLE)
            util.save_tip_length_calibration(
                pipette_id=self._hw_pipette.pipette_id,
                tip_length_offset=noz_pt.z - self._nozzle_height_at_reference,
                tip_rack=self._tip_rack)
            self._has_calibrated_tip_length =\
                (self._get_stored_tip_length_cal() is not None)
            self._should_perform_tip_length = False

    async def move_to_reference_point(self):
        if not self.should_perform_tip_length and \
                self._current_state in (self._state.labwareLoaded,
                                        self._state.inspectingTip):
            self._flag_unmet_transition_req(
                command_handler="move_to_reference_point",
                unmet_condition="incorrect state machine loaded")
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

    def _initialize_deck(self):
        self._deck[TIP_RACK_SLOT] = self._tip_rack

        if self._has_calibration_block:
            cb_setup = CAL_BLOCK_SETUP_BY_MOUNT[self._mount]
            self._deck[cb_setup.slot] = labware.load(
                cb_setup.load_name,
                self._deck.position_for(cb_setup.slot))

    async def exit_session(self):
        await self.move_to_tip_rack()
        await self._return_tip()
        # reload new pipette offset data by resetting instrument
        self._hardware.reset_instrument(self._mount)
