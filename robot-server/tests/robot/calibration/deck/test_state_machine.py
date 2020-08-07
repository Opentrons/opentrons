import pytest
from typing import List, Tuple

from robot_server.service.session.models import (
    CalibrationCommand as CalCommand,
    DeckCalibrationCommand as DeckCommand)
from robot_server.robot.calibration.deck.state_machine import \
    DeckCalibrationStateMachine

valid_commands: List[Tuple[str, str, str]] = [
    (CalCommand.load_labware, 'sessionStarted', 'labwareLoaded'),
    (DeckCommand.move_to_tip_rack, 'labwareLoaded', 'preparingPipette'),
    (DeckCommand.move_to_tip_rack, 'preparingPipette', 'preparingPipette'),
    (CalCommand.jog, 'preparingPipette', 'preparingPipette'),
    (CalCommand.pick_up_tip, 'preparingPipette', 'preparingPipette'),
    (CalCommand.invalidate_tip, 'preparingPipette', 'preparingPipette'),
    (DeckCommand.move_to_deck, 'preparingPipette', 'joggingToDeck'),
    (CalCommand.jog, 'joggingToDeck', 'joggingToDeck'),
    (CalCommand.save_offset, 'joggingToDeck', 'joggingToDeck'),
    (DeckCommand.move_to_point_one, 'joggingToDeck', 'savingPointOne'),
    (CalCommand.jog, 'savingPointOne', 'savingPointOne'),
    (CalCommand.save_offset, 'savingPointOne', 'savingPointOne'),
    (DeckCommand.move_to_point_two, 'savingPointOne', 'savingPointTwo'),
    (CalCommand.jog, 'savingPointTwo', 'savingPointTwo'),
    (CalCommand.save_offset, 'savingPointTwo', 'savingPointTwo'),
    (DeckCommand.move_to_point_three, 'savingPointTwo', 'savingPointThree'),
    (CalCommand.jog, 'savingPointThree', 'savingPointThree'),
    (CalCommand.save_offset, 'savingPointThree', 'savingPointThree'),
    (DeckCommand.move_to_tip_rack, 'savingPointThree', 'calibrationComplete'),
    (CalCommand.exit, 'calibrationComplete', 'sessionExited'),
    (CalCommand.exit, 'sessionStarted', 'sessionExited'),
    (CalCommand.exit, 'labwareLoaded', 'sessionExited'),
    (CalCommand.exit, 'preparingPipette', 'sessionExited'),
    (CalCommand.exit, 'savingPointOne', 'sessionExited'),
    (CalCommand.exit, 'savingPointTwo', 'sessionExited'),
    (CalCommand.exit, 'savingPointThree', 'sessionExited'),
]


@pytest.fixture
def state_machine():
    return DeckCalibrationStateMachine()


@pytest.mark.parametrize('command,from_state,to_state', valid_commands)
async def test_valid_commands(command, from_state, to_state, state_machine):
    next_state = state_machine.get_next_state(from_state, command)
    assert next_state == to_state
