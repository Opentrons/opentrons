import pytest
from typing import List, Tuple

from opentrons.calibration.tip_length import state_machine


valid_transitions: List[Tuple[str, str, str]] = [
  ('loadLabware', 'sessionStarted', 'labwareLoaded'),
  ('moveToMeasureNozzleOffset', 'labwareLoaded', 'measuringNozzleOffset'),
  ('jog', 'measuringNozzleOffset', 'measuringNozzleOffset'),
  ('saveNozzlePosition', 'measuringNozzleOffset', 'preparingPipette'),
  ('jog', 'preparingPipette', 'preparingPipette'),
  ('pickUpTip', 'preparingPipette', 'inspectingTip'),
  ('invalidateTip', 'inspectingTip', 'preparingPipette'),
  ('confirmTip', 'inspectingTip', 'measuringTipOffset'),
  ('jog', 'measuringTipOffset', 'measuringTipOffset'),
  ('saveTipPosition', 'measuringTipOffset', 'calibrationComplete'),
  ('exitSession', 'calibrationComplete', 'sessionExited'),
  ('exitSession', 'sessionStarted', 'sessionExited'),
  ('exitSession', 'labwareLoaded', 'sessionExited'),
  ('exitSession', 'measuringNozzleOffset', 'sessionExited'),
  ('exitSession', 'preparingPipette', 'sessionExited'),
  ('exitSession', 'inspectingTip', 'sessionExited'),
  ('exitSession', 'measuringTipOffset', 'sessionExited'),
]


@pytest.mark.parametrize('trigger,from_state,to_state', valid_transitions)
async def test_valid_transitions(trigger, from_state, to_state):
    sm = state_machine.TipCalibrationStateMachine(initial_state=from_state)
    await sm.trigger_transition(trigger)
    assert sm.current_state_name == to_state
