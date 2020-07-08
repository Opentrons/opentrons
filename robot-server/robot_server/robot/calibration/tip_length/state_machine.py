from typing import Dict
from robot_server.service.session.models import CommonCommand
from robot_server.robot.calibration.tip_length.util import (
    SimpleStateMachine,
    TipCalibrationError as Error
)
from robot_server.robot.calibration.tip_length.constants import (
    TipCalibrationState as State,
)


TIP_LENGTH_TRANSITIONS: Dict[State, Dict[CommonCommand, State]] = {
    State.sessionStarted: {
        CommonCommand.load_labware: State.labwareLoaded
    },
    State.labwareLoaded: {
        CommonCommand.move_to_reference_point: State.measuringNozzleOffset
    },
    State.measuringNozzleOffset: {
        CommonCommand.save_offset: State.preparingPipette,
        CommonCommand.jog: State.measuringNozzleOffset
    },
    State.preparingPipette: {
        CommonCommand.jog: State.preparingPipette,
        CommonCommand.pick_up_tip: State.preparingPipette,
        CommonCommand.invalidate_tip: State.preparingPipette,
        CommonCommand.move_to_reference_point: State.measuringTipOffset
    },
    State.measuringTipOffset: {
        CommonCommand.save_offset: State.calibrationComplete,
        CommonCommand.jog: State.measuringTipOffset
    },
    State.WILDCARD: {
        CommonCommand.exit: State.sessionExited
    }
}


class TipCalibrationStateMachine():
    def __init__(self):
        self._state_machine = SimpleStateMachine(
            states=set(s for s in State),
            transitions=TIP_LENGTH_TRANSITIONS
        )

    def get_next_state(self, from_state: State, command: CommonCommand):
        next_state = self._state_machine.get_next_state(from_state, command)
        if next_state:
            return next_state
        else:
            raise Error(f"Cannot call {command} command from {from_state}.")
