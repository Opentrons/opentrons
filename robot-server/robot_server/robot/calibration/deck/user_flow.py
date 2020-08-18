import logging
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

from opentrons.calibration_storage import get
from opentrons.calibration_storage.types import TipLengthCalNotFound
from opentrons.config import feature_flags as ff
from opentrons.hardware_control import ThreadManager, CriticalPoint
from opentrons.hardware_control.pipette import Pipette
from opentrons.hardware_control.util import plan_arc
from opentrons.protocol_api import geometry, labware
from opentrons.types import Mount, Point, Location
from robot_server.service.session.models import (
    CalibrationCommand, DeckCalibrationCommand)
from robot_server.robot.calibration.constants import (
    SHORT_TRASH_DECK, STANDARD_DECK)
from .constants import (
    DeckCalibrationState as State,
    TIP_RACK_SLOT,
    MOVE_TO_TIP_RACK_SAFETY_BUFFER)
from .state_machine import DeckCalibrationStateMachine
# TODO: uncomment the following to raise deck cal errors
# from .util import (
#     DeckCalibrationException as ErrorExc,
#     DeckCalibrationError as Error)
from ..helper_classes import (
    RequiredLabware,
    AttachedPipette)


MODULE_LOG = logging.getLogger(__name__)

"""
A collection of functions that allow a consumer to prepare and update
calibration data associated with the orientations of the robot's deck
and gantry system.
"""

# TODO: BC 2020-07-08: type all command logic here with actual Model type
COMMAND_HANDLER = Callable[..., Awaitable]

COMMAND_MAP = Dict[str, COMMAND_HANDLER]


class DeckCalibrationUserFlow:
    def __init__(self,
                 hardware: ThreadManager):
        self._hardware = hardware
        # TODO: uncomment the following to raise the no pipette error
        # if not any(self._hardware._attached_instruments.values()):
        #     raise ErrorExc(Error.NO_PIPETTE)
        self._hw_pipette, self._mount = self._select_target_pipette()

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = geometry.Deck(load_name=deck_load_name)
        self._tip_rack = self._get_tip_rack_lw()
        self._deck[TIP_RACK_SLOT] = self._tip_rack

        self._current_state = State.sessionStarted
        self._state_machine = DeckCalibrationStateMachine()

        self._tip_origin_pt: Optional[Point] = None

        self._command_map: COMMAND_MAP = {
            CalibrationCommand.load_labware: self.load_labware,
            CalibrationCommand.jog: self.jog,
            CalibrationCommand.pick_up_tip: self.pick_up_tip,
            CalibrationCommand.invalidate_tip: self.invalidate_tip,
            CalibrationCommand.save_offset: self.save_offset,
            DeckCalibrationCommand.move_to_tip_rack: self.move_to_tip_rack,
            DeckCalibrationCommand.move_to_deck: self.move_to_deck,
            DeckCalibrationCommand.move_to_point_one: self.move_to_point_one,
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
        # TODO: always return AttachedPipette
        if self._hw_pipette is None:
            return None
        else:
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
        # TODO: select pipette for deck calibration
        # return pipette and mount
        return self._hardware._attached_instruments[Mount.LEFT], Mount.LEFT

    def _get_tip_rack_lw(self) -> labware.Labware:
        # TODO: select tiprack based on chosen pipette model
        return labware.load(
            "opentrons_96_tiprack_10ul",
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
            f'DeckCalUserFlow handled command {name}, transitioned'
            f'from {self._current_state} to {next_state}')

    def _get_critical_point(self) -> CriticalPoint:
        return CriticalPoint.NOZZLE
        # TODO: uncomment the following after _select_target_pipette
        # is complette:
        # return (CriticalPoint.FRONT_NOZZLE if
        #         self._hw_pipette.config.channels == 8 else
        #         self._hw_pipette.critical_point)

    async def _get_current_point(self) -> Point:
        cp = self._get_critical_point()
        return await self._hardware.gantry_position(self._mount,
                                                    critical_point=cp)

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
        pass

    async def move_to_point_one(self):
        pass

    async def move_to_point_two(self):
        pass

    async def move_to_point_three(self):
        pass

    async def save_offset(self):
        pass

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
        saved_default = None
        if self._hw_pipette.config.channels > 1:
            # reduce pick up current for multichannel pipette picking up 1 tip
            saved_default = self._hw_pipette.config.pick_up_current
            self._hw_pipette.update_config_item('pick_up_current', 0.1)

        # grab position of active nozzle for ref when returning tip later
        self._tip_origin_pt = await self._hardware.gantry_position(
            self._mount, critical_point=self._get_critical_point())

        tip_length = self._get_tip_length()
        await self._hardware.pick_up_tip(self._mount, tip_length)

        if saved_default:
            self._hw_pipette.update_config_item('pick_up_current',
                                                saved_default)

    async def invalidate_tip(self):
        await self._return_tip()
        await self.move_to_tip_rack()

    async def _return_tip(self):
        if self._tip_origin_pt and self._hw_pipette.has_tip:
            tip_length = self._get_tip_length()
            coeff = self._hw_pipette.config.return_tip_height
            to_pt = self._tip_origin_pt - Point(0, 0, tip_length * coeff)
            cp = self._get_critical_point()
            await self._hardware.move_to(mount=self._mount,
                                         abs_position=to_pt,
                                         critical_point=cp)
            await self._hardware.drop_tip(self._mount)
            self._tip_origin_pt = None

    async def _move(self, to_loc: Location):
        from_pt = await self._get_current_point()
        from_loc = Location(from_pt, None)
        cp = self._get_critical_point()

        max_height = self._hardware.get_instrument_max_height(self._mount)

        safe = geometry.safe_height(
            from_loc, to_loc, self._deck, max_height)
        moves = plan_arc(from_pt, to_loc.point, safe,
                         origin_cp=None,
                         dest_cp=cp)
        for move in moves:
            await self._hardware.move_to(mount=self._mount,
                                         abs_position=move[0],
                                         critical_point=move[1])

    async def exit_session(self):
        await self._return_tip()
