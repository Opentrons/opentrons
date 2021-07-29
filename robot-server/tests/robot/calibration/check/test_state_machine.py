import pytest
from typing import List, Tuple

from robot_server.service.session.models.command_definitions import (
    CalibrationCommand as CalCommand,
    DeckCalibrationCommand as DeckCommand,
    CheckCalibrationCommand as CheckCommand,
)
from robot_server.robot.calibration.check.state_machine import (
    CalibrationCheckStateMachine,
)

valid_commands: List[Tuple[str, str, str]] = [
    (CalCommand.load_labware, "sessionStarted", "labwareLoaded"),
    (CalCommand.move_to_reference_point, "labwareLoaded", "comparingNozzle"),
    (CalCommand.jog, "comparingNozzle", "comparingNozzle"),
    (CalCommand.move_to_tip_rack, "comparingNozzle", "preparingPipette"),
    (CalCommand.pick_up_tip, "preparingPipette", "inspectingTip"),
    (CalCommand.invalidate_tip, "inspectingTip", "preparingPipette"),
    (CalCommand.move_to_reference_point, "inspectingTip", "comparingTip"),
    (CheckCommand.compare_point, "comparingTip", "comparingTip"),
    (CalCommand.move_to_deck, "comparingTip", "comparingHeight"),
    (CalCommand.jog, "comparingHeight", "comparingHeight"),
    (CheckCommand.compare_point, "comparingHeight", "comparingHeight"),
    (CalCommand.move_to_point_one, "comparingHeight", "comparingPointOne"),
    (CalCommand.jog, "comparingPointOne", "comparingPointOne"),
    (CheckCommand.compare_point, "comparingPointOne", "comparingPointOne"),
    (DeckCommand.move_to_point_two, "comparingPointOne", "comparingPointTwo"),
    (CalCommand.jog, "comparingPointTwo", "comparingPointTwo"),
    (CheckCommand.compare_point, "comparingPointTwo", "comparingPointTwo"),
    (DeckCommand.move_to_point_three, "comparingPointTwo", "comparingPointThree"),
    (CalCommand.jog, "comparingPointThree", "comparingPointThree"),
    (CheckCommand.compare_point, "comparingPointThree", "comparingPointThree"),
    (CalCommand.move_to_tip_rack, "comparingPointThree", "returningTip"),
    (CheckCommand.return_tip, "returningTip", "returningTip"),
    (CheckCommand.transition, "returningTip", "resultsSummary"),
    (CalCommand.exit, "calibrationComplete", "sessionExited"),
    (CalCommand.exit, "sessionStarted", "sessionExited"),
    (CalCommand.exit, "labwareLoaded", "sessionExited"),
    (CalCommand.exit, "preparingPipette", "sessionExited"),
    (CalCommand.exit, "comparingPointOne", "sessionExited"),
    (CalCommand.exit, "comparingPointTwo", "sessionExited"),
    (CalCommand.exit, "comparingPointThree", "sessionExited"),
]


@pytest.fixture
def state_machine():
    return CalibrationCheckStateMachine()


@pytest.mark.parametrize("command,from_state,to_state", valid_commands)
async def test_valid_commands(command, from_state, to_state, state_machine):
    next_state = state_machine.get_next_state(from_state, command)
    assert next_state == to_state
