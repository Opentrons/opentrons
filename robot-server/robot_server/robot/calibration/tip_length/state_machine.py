from typing import Dict
from robot_server.service.session.models import CommandName
from robot_server.robot.calibration.tip_length.util import (
    SimpleStateMachine,
    TipCalibrationError as Error
)
from robot_server.robot.calibration.tip_length.constants import (
    TipCalibrationState as State,
)


TIP_LENGTH_TRANSITIONS: Dict[State, Dict[CommandName, State]] = {
    State.sessionStarted: {
        CommandName.load_labware: State.labwareLoaded
    },
    State.labwareLoaded: {
        CommandName.move_to_reference_point: State.measuringNozzleOffset
    },
    State.measuringNozzleOffset: {
        CommandName.save_offset: State.preparingPipette,
        CommandName.jog: State.measuringNozzleOffset
    },
    State.preparingPipette: {
        CommandName.jog: State.preparingPipette,
        CommandName.pick_up_tip: State.preparingPipette,
        CommandName.invalidate_tip: State.preparingPipette,
        CommandName.move_to_reference_point: State.measuringTipOffset
    },
    State.measuringTipOffset: {
        CommandName.save_offset: State.calibrationComplete,
        CommandName.jog: State.measuringTipOffset
    },
    State.WILDCARD: {
        CommandName.exit: State.sessionExited
    }
}


class TipCalibrationStateMachine():
    def __init__(self):
        self._state_machine = SimpleStateMachine(
            states=set(s for s in State),
            transitions=TIP_LENGTH_TRANSITIONS
        )

    def get_next_state(self, from_state: State, command: CommandName):
        next_state = self._state_machine.get_next_state(from_state, command)
        if next_state:
            return next_state
        else:
            raise Error(f"Cannot call {command} command from {from_state}.")
