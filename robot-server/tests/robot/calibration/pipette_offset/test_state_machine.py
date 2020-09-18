import pytest
from typing import List, Tuple

from robot_server.service.session.models.command import\
  CalibrationCommand
from robot_server.robot.calibration.pipette_offset.state_machine import \
    PipetteOffsetCalibrationStateMachine

valid_commands: List[Tuple[str, str, str]] = [
  (CalibrationCommand.load_labware, 'sessionStarted', 'labwareLoaded'),
  (CalibrationCommand.move_to_tip_rack, 'labwareLoaded', 'preparingPipette'),
  (CalibrationCommand.jog, 'preparingPipette', 'preparingPipette'),
  (CalibrationCommand.pick_up_tip, 'preparingPipette', 'inspectingTip'),
  (CalibrationCommand.invalidate_tip, 'inspectingTip', 'preparingPipette'),
  (CalibrationCommand.move_to_deck, 'inspectingTip', 'joggingToDeck'),
  (CalibrationCommand.jog, 'joggingToDeck', 'joggingToDeck'),
  (CalibrationCommand.save_offset, 'joggingToDeck', 'joggingToDeck'),
  (CalibrationCommand.move_to_point_one, 'joggingToDeck', 'savingPointOne'),
  (CalibrationCommand.jog, 'savingPointOne', 'savingPointOne'),
  (CalibrationCommand.save_offset, 'savingPointOne', 'calibrationComplete'),
  (CalibrationCommand.exit, 'calibrationComplete', 'sessionExited'),
  (CalibrationCommand.exit, 'sessionStarted', 'sessionExited'),
  (CalibrationCommand.exit, 'labwareLoaded', 'sessionExited'),
  (CalibrationCommand.exit, 'joggingToDeck', 'sessionExited'),
  (CalibrationCommand.exit, 'savingPointOne', 'sessionExited'),
  (CalibrationCommand.exit, 'inspectingTip', 'sessionExited'),
  (CalibrationCommand.exit, 'preparingPipette', 'sessionExited'),
]


@pytest.fixture
def state_machine():
    return PipetteOffsetCalibrationStateMachine()


@pytest.mark.parametrize('command,from_state,to_state', valid_commands)
async def test_valid_commands(command, from_state, to_state, state_machine):
    next_state = state_machine.get_next_state(from_state, command)
    assert next_state == to_state
