import pytest
from typing import List, Tuple

from robot_server.service.session.models.command_definitions import CalibrationCommand
from robot_server.robot.calibration.pipette_offset.state_machine import (
    PipetteOffsetCalibrationStateMachine,
    PipetteOffsetWithTipLengthStateMachine,
)

offset_valid_commands: List[Tuple[str, str, str]] = [
    (CalibrationCommand.load_labware, "sessionStarted", "labwareLoaded"),
    (CalibrationCommand.move_to_tip_rack, "labwareLoaded", "preparingPipette"),
    (CalibrationCommand.jog, "preparingPipette", "preparingPipette"),
    (CalibrationCommand.pick_up_tip, "preparingPipette", "inspectingTip"),
    (CalibrationCommand.invalidate_tip, "inspectingTip", "preparingPipette"),
    (CalibrationCommand.move_to_deck, "inspectingTip", "joggingToDeck"),
    (CalibrationCommand.jog, "joggingToDeck", "joggingToDeck"),
    (CalibrationCommand.save_offset, "joggingToDeck", "joggingToDeck"),
    (CalibrationCommand.move_to_point_one, "joggingToDeck", "savingPointOne"),
    (CalibrationCommand.jog, "savingPointOne", "savingPointOne"),
    (CalibrationCommand.save_offset, "savingPointOne", "calibrationComplete"),
    (CalibrationCommand.exit, "calibrationComplete", "sessionExited"),
    (CalibrationCommand.exit, "sessionStarted", "sessionExited"),
    (CalibrationCommand.exit, "labwareLoaded", "sessionExited"),
    (CalibrationCommand.exit, "joggingToDeck", "sessionExited"),
    (CalibrationCommand.exit, "savingPointOne", "sessionExited"),
    (CalibrationCommand.exit, "inspectingTip", "sessionExited"),
    (CalibrationCommand.exit, "preparingPipette", "sessionExited"),
    (CalibrationCommand.invalidate_last_action, "preparingPipette", "preparingPipette"),
    (CalibrationCommand.invalidate_last_action, "joggingToDeck", "preparingPipette"),
    (CalibrationCommand.invalidate_last_action, "savingPointOne", "preparingPipette"),
]


@pytest.fixture
def offset_state_machine():
    return PipetteOffsetCalibrationStateMachine()


@pytest.mark.parametrize("command,from_state,to_state", offset_valid_commands)
async def test_valid_offset_commands(
    command, from_state, to_state, offset_state_machine
):
    next_state = offset_state_machine.get_next_state(from_state, command)
    assert next_state == to_state


fused_valid_commands: List[Tuple[str, str, str]] = [
    (CalibrationCommand.load_labware, "sessionStarted", "labwareLoaded"),
    (
        CalibrationCommand.move_to_reference_point,
        "labwareLoaded",
        "measuringNozzleOffset",
    ),
    (CalibrationCommand.move_to_reference_point, "inspectingTip", "measuringTipOffset"),
    (CalibrationCommand.save_offset, "measuringNozzleOffset", "measuringNozzleOffset"),
    (CalibrationCommand.save_offset, "measuringTipOffset", "tipLengthComplete"),
    (CalibrationCommand.save_offset, "joggingToDeck", "joggingToDeck"),
    (CalibrationCommand.save_offset, "savingPointOne", "calibrationComplete"),
    (CalibrationCommand.jog, "measuringNozzleOffset", "measuringNozzleOffset"),
    (CalibrationCommand.jog, "preparingPipette", "preparingPipette"),
    (CalibrationCommand.jog, "measuringTipOffset", "measuringTipOffset"),
    (CalibrationCommand.jog, "joggingToDeck", "joggingToDeck"),
    (CalibrationCommand.jog, "savingPointOne", "savingPointOne"),
    (CalibrationCommand.move_to_tip_rack, "measuringNozzleOffset", "preparingPipette"),
    (
        CalibrationCommand.invalidate_last_action,
        "measuringNozzleOffset",
        "measuringNozzleOffset",
    ),
    (CalibrationCommand.invalidate_last_action, "preparingPipette", "preparingPipette"),
    (
        CalibrationCommand.invalidate_last_action,
        "measuringTipOffset",
        "preparingPipette",
    ),
    (CalibrationCommand.invalidate_last_action, "joggingToDeck", "preparingPipette"),
    (CalibrationCommand.invalidate_last_action, "savingPointOne", "preparingPipette"),
    (CalibrationCommand.pick_up_tip, "preparingPipette", "inspectingTip"),
    (CalibrationCommand.invalidate_tip, "inspectingTip", "preparingPipette"),
    (
        CalibrationCommand.set_has_calibration_block,
        "tipLengthComplete",
        "tipLengthComplete",
    ),
    (CalibrationCommand.move_to_deck, "tipLengthComplete", "joggingToDeck"),
    (CalibrationCommand.move_to_point_one, "joggingToDeck", "savingPointOne"),
    (CalibrationCommand.exit, "sessionStarted", "sessionExited"),
    (CalibrationCommand.exit, "labwareLoaded", "sessionExited"),
    (CalibrationCommand.exit, "measuringNozzleOffset", "sessionExited"),
    (CalibrationCommand.exit, "preparingPipette", "sessionExited"),
    (CalibrationCommand.exit, "inspectingTip", "sessionExited"),
    (CalibrationCommand.exit, "measuringTipOffset", "sessionExited"),
    (CalibrationCommand.exit, "tipLengthComplete", "sessionExited"),
    (CalibrationCommand.exit, "joggingToDeck", "sessionExited"),
    (CalibrationCommand.exit, "savingPointOne", "sessionExited"),
    (CalibrationCommand.exit, "calibrationComplete", "sessionExited"),
]


@pytest.fixture
def fused_state_machine():
    return PipetteOffsetWithTipLengthStateMachine()


@pytest.mark.parametrize("command,from_state,to_state", fused_valid_commands)
async def test_valid_fused_commands(command, from_state, to_state, fused_state_machine):
    next_state = fused_state_machine.get_next_state(from_state, command)
    assert next_state == to_state
