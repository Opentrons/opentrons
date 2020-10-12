from robot_server.service.session.models.command import CommandDefinition
from robot_server.robot.calibration.util import (
    SimpleStateMachine, StateTransitionError)

from .constants import CalibrationCheckState as State

CHECK_TRANSITIONS: typing.List[typing.Dict[str, typing.Any]] = [
    {
        "trigger": CalibrationCheckTrigger.load_labware,
        "from_state": CalibrationCheckState.sessionStarted,
        "to_state": CalibrationCheckState.labwareLoaded,
        "before": "_load_tip_rack_objects"
    },
    {
        "trigger": CalibrationCheckTrigger.prepare_pipette,
        "from_state": CalibrationCheckState.labwareLoaded,
        "to_state": CalibrationCheckState.preparingFirstPipette,
        "after": "_move_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.preparingFirstPipette,
        "to_state": CalibrationCheckState.preparingFirstPipette,
        "before": "_jog_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.pick_up_tip,
        "from_state": CalibrationCheckState.preparingFirstPipette,
        "to_state": CalibrationCheckState.inspectingFirstTip,
        "after": [
            "_register_point_first_pipette",
            "_pick_up_tip_first_pipette"]
    },
    {
        "trigger": CalibrationCheckTrigger.invalidate_tip,
        "from_state": CalibrationCheckState.inspectingFirstTip,
        "to_state": CalibrationCheckState.preparingFirstPipette,
        "before": "_return_first_tip",
        "after": "_move_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_tip_attached,
        "from_state": CalibrationCheckState.inspectingFirstTip,
        "to_state": CalibrationCheckState.badCalibrationData,
        "condition": "_is_tip_pick_up_dangerous",
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_tip_attached,
        "from_state": CalibrationCheckState.inspectingFirstTip,
        "to_state": CalibrationCheckState.joggingFirstPipetteToHeight,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingFirstPipetteToHeight,
        "to_state": CalibrationCheckState.joggingFirstPipetteToHeight,
        "before": "_jog_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingFirstPipetteToHeight,
        "to_state": CalibrationCheckState.comparingFirstPipetteHeight,
        "after": "_register_point_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipetteHeight,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointOne,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointOne,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointOne,
        "before": "_jog_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointOne,
        "to_state": CalibrationCheckState.comparingFirstPipettePointOne,
        "after": "_register_point_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipettePointOne,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointTwo,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointTwo,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointTwo,
        "before": "_jog_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointTwo,
        "to_state": CalibrationCheckState.comparingFirstPipettePointTwo,
        "after": "_register_point_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipettePointTwo,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointThree,
        "after": "_move_first_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointThree,
        "to_state": CalibrationCheckState.joggingFirstPipetteToPointThree,
        "before": "_jog_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingFirstPipetteToPointThree,
        "to_state": CalibrationCheckState.comparingFirstPipettePointThree,
        "after": "_register_point_first_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipettePointThree,
        "to_state": CalibrationCheckState.preparingSecondPipette,
        "condition": "_is_checking_both_mounts",
        "before": "_trash_first_pipette_tip",
        "after": "_move_second_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingFirstPipettePointThree,
        "to_state": CalibrationCheckState.checkComplete,
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.preparingSecondPipette,
        "to_state": CalibrationCheckState.preparingSecondPipette,
        "before": "_jog_second_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.pick_up_tip,
        "from_state": CalibrationCheckState.preparingSecondPipette,
        "to_state": CalibrationCheckState.inspectingSecondTip,
        "after": [
            "_register_point_second_pipette",
            "_pick_up_tip_second_pipette"]
    },
    {
        "trigger": CalibrationCheckTrigger.invalidate_tip,
        "from_state": CalibrationCheckState.inspectingSecondTip,
        "to_state": CalibrationCheckState.preparingSecondPipette,
        "before": "_return_second_tip",
        "after": "_move_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_tip_attached,
        "from_state": CalibrationCheckState.inspectingSecondTip,
        "to_state": CalibrationCheckState.badCalibrationData,
        "condition": "_is_tip_pick_up_dangerous",
    },
    {
        "trigger": CalibrationCheckTrigger.confirm_tip_attached,
        "from_state": CalibrationCheckState.inspectingSecondTip,
        "to_state": CalibrationCheckState.joggingSecondPipetteToHeight,
        "after": "_move_second_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingSecondPipetteToHeight,
        "to_state": CalibrationCheckState.joggingSecondPipetteToHeight,
        "before": "_jog_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingSecondPipetteToHeight,
        "to_state": CalibrationCheckState.comparingSecondPipetteHeight,
        "after": "_register_point_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingSecondPipetteHeight,
        "to_state": CalibrationCheckState.joggingSecondPipetteToPointOne,
        "after": "_move_second_pipette",
    },
    {
        "trigger": CalibrationCheckTrigger.jog,
        "from_state": CalibrationCheckState.joggingSecondPipetteToPointOne,
        "to_state": CalibrationCheckState.joggingSecondPipetteToPointOne,
        "before": "_jog_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.compare_point,
        "from_state": CalibrationCheckState.joggingSecondPipetteToPointOne,
        "to_state": CalibrationCheckState.comparingSecondPipettePointOne,
        "after": "_register_point_second_pipette"
    },
    {
        "trigger": CalibrationCheckTrigger.go_to_next_check,
        "from_state": CalibrationCheckState.comparingSecondPipettePointOne,
        "to_state": CalibrationCheckState.checkComplete,
    },
    {
        "trigger": CalibrationCheckTrigger.exit,
        "from_state": WILDCARD,
        "to_state": CalibrationCheckState.sessionExited
    },
    {
        "trigger": CalibrationCheckTrigger.reject_calibration,
        "from_state": WILDCARD,
        "to_state": CalibrationCheckState.badCalibrationData
    }
]



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
        CalibrationCommand.invalidate_tip: State.preparingPipette,
        CalibrationCommand.move_to_deck: State.joggingToDeck,
    },
    State.joggingToDeck: {
        CalibrationCommand.jog: State.joggingToDeck,
        CalibrationCommand.save_offset: State.joggingToDeck,
        CalibrationCommand.move_to_point_one: State.savingPointOne,
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
        CalCheckCommand.second_pipette: State.preparingPipette,
        CalibrationCommand.move_to_tip_rack: State.calibrationComplete
    },
    State.badCalibrationData: {
        CalCheckCommand.return_tip: State.returningTip
    }
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
