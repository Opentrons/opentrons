import pytest
from typing import List, Tuple

from robot_server.service.session.models import CommonCommand
from robot_server.robot.calibration.tip_length.state_machine import \
    TipCalibrationStateMachine

valid_commands: List[Tuple[str, str, str]] = [
  (CommonCommand.load_labware, 'sessionStarted', 'labwareLoaded'),
  (CommonCommand.move_to_reference_point, 'labwareLoaded',
   'measuringNozzleOffset'),
  (CommonCommand.jog, 'measuringNozzleOffset',
   'measuringNozzleOffset'),
  (CommonCommand.save_offset, 'measuringNozzleOffset', 'preparingPipette'),
  (CommonCommand.jog, 'preparingPipette', 'preparingPipette'),
  (CommonCommand.pick_up_tip, 'preparingPipette', 'preparingPipette'),
  (CommonCommand.invalidate_tip, 'preparingPipette', 'preparingPipette'),
  (CommonCommand.move_to_reference_point, 'preparingPipette',
   'measuringTipOffset'),
  (CommonCommand.jog, 'measuringTipOffset', 'measuringTipOffset'),
  (CommonCommand.save_offset, 'measuringTipOffset', 'calibrationComplete'),
  (CommonCommand.exit, 'calibrationComplete', 'sessionExited'),
  (CommonCommand.exit, 'sessionStarted', 'sessionExited'),
  (CommonCommand.exit, 'labwareLoaded', 'sessionExited'),
  (CommonCommand.exit, 'measuringNozzleOffset', 'sessionExited'),
  (CommonCommand.exit, 'preparingPipette', 'sessionExited'),
  (CommonCommand.exit, 'measuringTipOffset', 'sessionExited'),
]


@pytest.fixture
def state_machine():
    return TipCalibrationStateMachine()


@pytest.mark.parametrize('command,from_state,to_state', valid_commands)
async def test_valid_commands(command, from_state, to_state, state_machine):
    next_state = state_machine.get_next_state(from_state, command)
    assert next_state == to_state
