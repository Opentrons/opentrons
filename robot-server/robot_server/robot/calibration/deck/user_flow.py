import logging
from typing import Awaitable, Callable, Dict

from opentrons.config import feature_flags as ff
from opentrons.hardware_control import ThreadManager
from opentrons.protocol_api import geometry
from robot_server.robot.calibration.constants import (
    SHORT_TRASH_DECK,
    STANDARD_DECK
)
from .constants import DeckCalibrationState as State
from .state_machine import DeckCalibrationStateMachine


MODULE_LOG = logging.getLogger(__name__)

# TODO: BC 2020-07-08: type all command logic here with actual Model type
COMMAND_HANDLER = Callable[..., Awaitable]

COMMAND_MAP = Dict[str, COMMAND_HANDLER]


class DeckCalibrationUserFlow():
    def __init__(self,
                 hardware: ThreadManager):
        self._hardware = hardware

        deck_load_name = SHORT_TRASH_DECK if ff.short_fixed_trash() \
            else STANDARD_DECK
        self._deck = geometry.Deck(load_name=deck_load_name)
        self._initialize_deck()

        self._current_state = State.sessionStarted
        self._state_machine = DeckCalibrationStateMachine()

    @property
    def hardware(self) -> ThreadManager:
        return self._hardware

    @property
    def current_state(self) -> State:
        return self._current_state

    def _initialize_deck(self):
        pass
