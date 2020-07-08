import pytest
from typing import List, Tuple

from robot_server.service.session.models import CommandName
from robot_server.robot.calibration.tip_length.state_machine import \
    TipCalibrationStateMachine

valid_commands: List[Tuple[str, str, str]] = [
  (CommandName.load_labware, 'sessionStarted', 'labwareLoaded'),
  (CommandName.move_to_reference_point, 'labwareLoaded',
   'measuringNozzleOffset'),
  (CommandName.jog, 'measuringNozzleOffset',
   'measuringNozzleOffset'),
  (CommandName.save_offset, 'measuringNozzleOffset', 'preparingPipette'),
  (CommandName.jog, 'preparingPipette', 'preparingPipette'),
  (CommandName.pick_up_tip, 'preparingPipette', 'preparingPipette'),
  (CommandName.invalidate_tip, 'preparingPipette', 'preparingPipette'),
  (CommandName.move_to_reference_point, 'preparingPipette',
   'measuringTipOffset'),
  (CommandName.jog, 'measuringTipOffset', 'measuringTipOffset'),
  (CommandName.save_offset, 'measuringTipOffset', 'calibrationComplete'),
  (CommandName.exit, 'calibrationComplete', 'sessionExited'),
  (CommandName.exit, 'sessionStarted', 'sessionExited'),
  (CommandName.exit, 'labwareLoaded', 'sessionExited'),
  (CommandName.exit, 'measuringNozzleOffset', 'sessionExited'),
  (CommandName.exit, 'preparingPipette', 'sessionExited'),
  (CommandName.exit, 'measuringTipOffset', 'sessionExited'),
]


@pytest.fixture
def state_machine():
    return TipCalibrationStateMachine()


@pytest.mark.parametrize('command,from_state,to_state', valid_commands)
async def test_valid_commands(command, from_state, to_state, state_machine):
    next_state = state_machine.get_next_state(from_state, command)
    assert next_state == to_state
