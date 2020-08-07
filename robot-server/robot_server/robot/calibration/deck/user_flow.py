import logging
from typing import Any, Awaitable, Callable, Dict, Tuple

from opentrons.config import feature_flags as ff
from opentrons.hardware_control import ThreadManager, CriticalPoint
from opentrons.hardware_control.pipette import Pipette
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
        self._hw_pipette, self._mount = self._select_target_pipette()

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = geometry.Deck(load_name=deck_load_name)
        self._initialize_deck()

        self._current_state = State.sessionStarted
        self._state_machine = DeckCalibrationStateMachine()

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

    def _set_current_state(self, to_state: State):
        self._current_state = to_state

    def _select_target_pipette(self) -> Tuple[Pipette, Mount]:
        # TODO: select pipette for deck calibration
        # return pipette and mount
        return self._hardware._attached_instruments[Mount.RIGHT], Mount.RIGHT

    def _get_tip_rack_lw(self) -> labware.Labware:
        # TODO: select tiprack based on chosen pipette model
        return labware.load(
            "opentrons_96_tiprack_10ul",
            self._deck.position_for(TIP_RACK_SLOT))

    def _initialize_deck(self):
        tip_rack_lw = self._get_tip_rack_lw()
        self._deck[TIP_RACK_SLOT] = tip_rack_lw

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
        return CriticalPoint.FRONT_NOZZLE
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

    async def pick_up_tip(self):
        pass

    async def invalidate_tip(self):
        await self._return_tip()
        await self.move_to_tip_rack()

    async def _return_tip(self):
        pass

    async def _move(self, *args):
        pass

    async def exit_session(self):
        await self._return_tip()
