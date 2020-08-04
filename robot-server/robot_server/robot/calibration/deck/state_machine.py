from typing import Dict

from robot_server.service.session.models import CommandDefinition, \
    DeckCalibrationCommand as DeckCalCommand, CalibrationCommand
from robot_server.robot.calibration.util import (
    SimpleStateMachine, StateTransitionError)
from .constants import DeckCalibrationState as State


DECK_CALIBRATION_TRANSITIONS: Dict[State, Dict[CommandDefinition, State]] = {
    State.sessionStarted: {
        CalibrationCommand.load_labware: State.labwareLoaded
    },
    State.labwareLoaded: {
        DeckCalCommand.move_to_tip_rack: State.preparingPipette
    },
    State.preparingPipette: {
        CalibrationCommand.jog: State.preparingPipette,
        CalibrationCommand.pick_up_tip: State.preparingPipette,
        CalibrationCommand.invalidate_tip: State.preparingPipette,
        DeckCalCommand.move_to_point_one: State.savingPointOne,
        DeckCalCommand.move_to_tip_rack: State.preparingPipette
    },
    State.savingPointOne: {
        CalibrationCommand.jog: State.savingPointOne,
        CalibrationCommand.save_offset: State.savingPointOne,
        DeckCalCommand.move_to_point_two: State.savingPointTwo
    },
    State.savingPointTwo: {
        CalibrationCommand.jog: State.savingPointTwo,
        CalibrationCommand.save_offset: State.savingPointTwo,
        DeckCalCommand.move_to_point_three: State.savingPointThree
    },
    State.savingPointThree: {
        CalibrationCommand.jog: State.savingPointThree,
        CalibrationCommand.save_offset: State.savingPointThree,
        DeckCalCommand.move_to_tip_rack: State.calibrationComplete
    },
    State.WILDCARD: {
        CalibrationCommand.exit: State.sessionExited
    }
}


class DeckCalibrationStateMachine:
    def __init__(self):
        self._state_machine = SimpleStateMachine(
            states=set(s for s in State),
            transitions=DECK_CALIBRATION_TRANSITIONS
        )

    def get_next_state(self, from_state: State, command: CommandDefinition):
        next_state = self._state_machine.get_next_state(from_state, command)
        if next_state:
            return next_state
        else:
            raise StateTransitionError(command, from_state, 'DeckCalibration')
