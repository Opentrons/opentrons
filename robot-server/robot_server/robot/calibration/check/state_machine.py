from typing import Dict

from robot_server.service.session.models.command import (
    CommandDefinition, CalibrationCommand,
    CheckCalibrationCommand, DeckCalibrationCommand)
from robot_server.robot.calibration.util import (
    SimpleStateMachine, StateTransitionError)

from .constants import CalibrationCheckState as State


CALIBRATION_CHECK_TRANSITIONS: Dict[State, Dict[CommandDefinition, State]] = {
    State.sessionStarted: {
        CalibrationCommand.load_labware: State.labwareLoaded
    },
    State.labwareLoaded: {
        CalibrationCommand.move_to_tip_rack: State.preparingPipette
    },
    State.preparingPipette: {
        CalibrationCommand.jog: State.preparingPipette,
        CalibrationCommand.pick_up_tip: State.inspectingTip,
    },
    State.inspectingTip: {
        CheckCalibrationCommand.compare_point: State.inspectingTip,
        CalibrationCommand.invalidate_tip: State.preparingPipette,
        CalibrationCommand.move_to_deck: State.comparingHeight,
    },
    State.comparingHeight: {
        CalibrationCommand.jog: State.comparingHeight,
        CheckCalibrationCommand.compare_point: State.comparingHeight,
        CalibrationCommand.move_to_point_one: State.comparingPointOne,
    },
    State.comparingPointOne: {
        CalibrationCommand.jog: State.comparingPointOne,
        CheckCalibrationCommand.compare_point: State.comparingPointOne,
        DeckCalibrationCommand.move_to_point_two: State.comparingPointTwo
    },
    State.comparingPointTwo: {
        CalibrationCommand.jog: State.comparingPointTwo,
        CheckCalibrationCommand.compare_point: State.comparingPointTwo,
        DeckCalibrationCommand.move_to_point_three: State.comparingPointThree
    },
    State.comparingPointThree: {
        CalibrationCommand.jog: State.comparingPointThree,
        CalibrationCommand.compare_point: State.comparingPointThree,
        CalibrationCommand.move_to_tip_rack: State.checkForSecondPipette
    },
    State.checkForSecondPipette: {
        CheckCalibrationCommand.switch_pipette: State.WILDCARD,
    },
    State.badCalibrationData: {
        CheckCalibrationCommand.return_tip: State.returningTip
    },
    State.WILDCARD: {
        CalibrationCommand.exit: State.sessionExited
    }
}


class CalibrationCheckStateMachine:
    def __init__(self):
        self._state_machine = SimpleStateMachine(
            states=set(s for s in State),
            transitions=CALIBRATION_CHECK_TRANSITIONS
        )

    def get_next_state(self, from_state: State, command: CommandDefinition):
        next_state = self._state_machine.get_next_state(from_state, command)
        if next_state:
            return next_state
        else:
            raise StateTransitionError(command, from_state)
