from typing import Dict

from robot_server.service.session.models import CommandDefinition, \
    DeckCalibrationCommand as OffsetCalCommand, CalibrationCommand
from robot_server.robot.calibration.util import (
    SimpleStateMachine, StateTransitionError)
from .constants import OffsetCalibrationState as State


OFFSET_CALIBRATION_TRANSITIONS: Dict[State, Dict[CommandDefinition, State]] = {
    State.sessionStarted: {
        CalibrationCommand.load_labware: State.labwareLoaded
    },
    State.labwareLoaded: {
        CalibrationCommand.move_to_tip_rack: State.preparingPipette
    },
    State.preparingPipette: {
        CalibrationCommand.jog: State.preparingPipette,
        CalibrationCommand.pick_up_tip: State.inspectingTip,
        CalibrationCommand.move_to_tip_rack: State.preparingPipette,
    },
    State.inspectingTip: {
        CalibrationCommand.invalidate_tip: State.preparingPipette,
        OffsetCalCommand.move_to_measure_z: State.measuringZ,
    },
    State.measuringZ: {
        CalibrationCommand.jog: State.measuringZ,
        CalibrationCommand.save_offset: State.measuringZ,
        OffsetCalCommand.move_to_measure_xy: State.measuringXY,
    },
    State.measuringXY: {
        CalibrationCommand.jog: State.measuringXY,
        CalibrationCommand.save_offset: State.measuringXY,
    },
    State.calibrationComplete: {
        CalibrationCommand.move_to_tip_rack: State.calibrationComplete
    },
    State.WILDCARD: {
        CalibrationCommand.exit: State.sessionExited
    }
}


class OffsetCalibrationStateMachine:
    def __init__(self):
        self._state_machine = SimpleStateMachine(
            states=set(s for s in State),
            transitions=OFFSET_CALIBRATION_TRANSITIONS
        )

    def get_next_state(self, from_state: State, command: CommandDefinition):
        next_state = self._state_machine.get_next_state(from_state, command)
        if next_state:
            return next_state
        else:
            raise StateTransitionError(command, from_state)
