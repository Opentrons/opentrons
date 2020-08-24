from typing import Dict

from robot_server.service.session.models import \
    CommandDefinition, CalibrationCommand
from robot_server.robot.calibration.util import (
    SimpleStateMachine, StateTransitionError)
from .constants import PipetteOffsetCalibrationState as State


PIP_OFFSET_CAL_TRANSITIONS: Dict[State, Dict[CommandDefinition, State]] = {
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
        CalibrationCommand.invalidate_tip: State.preparingPipette,
        CalibrationCommand.move_to_deck: State.joggingToDeck,
    },
    State.joggingToDeck: {
        CalibrationCommand.jog: State.joggingToDeck,
        CalibrationCommand.save_offset: State.joggingToDeck,
        CalibrationCommand.move_to_point_one: State.joggingToPointOne,
    },
    State.joggingToPointOne: {
        CalibrationCommand.jog: State.joggingToPointOne,
        CalibrationCommand.save_offset: State.calibrationComplete,
    },
    State.calibrationComplete: {
        CalibrationCommand.move_to_tip_rack: State.calibrationComplete
    },
    State.WILDCARD: {
        CalibrationCommand.exit: State.sessionExited
    }
}


class PipetteOffsetCalibrationStateMachine:
    def __init__(self):
        self._state_machine = SimpleStateMachine(
            states=set(s for s in State),
            transitions=PIP_OFFSET_CAL_TRANSITIONS
        )

    def get_next_state(self, from_state: State, command: CommandDefinition):
        next_state = self._state_machine.get_next_state(from_state, command)
        if next_state:
            return next_state
        else:
            raise StateTransitionError(command, from_state)
