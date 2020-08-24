import pytest
from typing import List, Tuple

from robot_server.service.session.models import CalibrationCommand, \
    TipLengthCalibrationCommand
from robot_server.robot.calibration.tip_length.state_machine import \
    TipCalibrationStateMachine

valid_commands: List[Tuple[str, str, str]] = [
  (CalibrationCommand.load_labware, 'sessionStarted', 'labwareLoaded'),
  (TipLengthCalibrationCommand.move_to_reference_point, 'labwareLoaded',
   'measuringNozzleOffset'),
  (CalibrationCommand.jog, 'measuringNozzleOffset',
   'measuringNozzleOffset'),
  (CalibrationCommand.save_offset, 'measuringNozzleOffset',
   'measuringNozzleOffset'),
  (CalibrationCommand.move_to_tip_rack, 'measuringNozzleOffset',
   'preparingPipette'),
  (CalibrationCommand.jog, 'preparingPipette', 'preparingPipette'),
  (CalibrationCommand.pick_up_tip, 'preparingPipette', 'inspectingTip'),
  (CalibrationCommand.invalidate_tip, 'inspectingTip', 'preparingPipette'),
  (TipLengthCalibrationCommand.move_to_reference_point, 'inspectingTip',
   'measuringTipOffset'),
  (CalibrationCommand.jog, 'measuringTipOffset', 'measuringTipOffset'),
  (CalibrationCommand.save_offset, 'measuringTipOffset',
   'measuringTipOffset'),
  (CalibrationCommand.move_to_tip_rack, 'measuringTipOffset',
   'calibrationComplete'),
  (CalibrationCommand.exit, 'calibrationComplete', 'sessionExited'),
  (CalibrationCommand.exit, 'sessionStarted', 'sessionExited'),
  (CalibrationCommand.exit, 'labwareLoaded', 'sessionExited'),
  (CalibrationCommand.exit, 'measuringNozzleOffset', 'sessionExited'),
  (CalibrationCommand.exit, 'preparingPipette', 'sessionExited'),
  (CalibrationCommand.exit, 'measuringTipOffset', 'sessionExited'),
]


@pytest.fixture
def state_machine():
    return TipCalibrationStateMachine()


@pytest.mark.parametrize('command,from_state,to_state', valid_commands)
async def test_valid_commands(command, from_state, to_state, state_machine):
    next_state = state_machine.get_next_state(from_state, command)
    assert next_state == to_state
