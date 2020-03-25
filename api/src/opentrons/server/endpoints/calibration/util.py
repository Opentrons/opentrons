import enum
from typing import TypeVar, Generic, Type, Dict


class CalibrationCheckState(enum.Enum):
    sessionStart = enum.auto()
    specifyLabware = enum.auto()
    pickUpTip = enum.auto()
    checkPointOne = enum.auto()
    checkPointTwo = enum.auto()
    checkPointThree = enum.auto()
    checkHeight = enum.auto()
    sessionExit = enum.auto()
    badDeckCalibration = enum.auto()
    noPipettesAttached = enum.auto()


check_normal_relationship_dict = {
    CalibrationCheckState.sessionStart: CalibrationCheckState.specifyLabware,
    CalibrationCheckState.specifyLabware: CalibrationCheckState.pickUpTip,
    CalibrationCheckState.checkPointOne: CalibrationCheckState.checkPointTwo,
    CalibrationCheckState.checkPointTwo: CalibrationCheckState.checkPointThree,
    CalibrationCheckState.checkPointThree: CalibrationCheckState.checkHeight,
    CalibrationCheckState.checkHeight: CalibrationCheckState.sessionStart

}

exit = CalibrationCheckState.sessionExit
check_exit_relationship_dict = {
    CalibrationCheckState.badDeckCalibration: exit,
    CalibrationCheckState.checkHeight: exit,
    CalibrationCheckState.noPipettesAttached: exit
}

nopips = CalibrationCheckState.noPipettesAttached
badcal = CalibrationCheckState.badDeckCalibration
check_error_relationship_dict = {
    CalibrationCheckState.sessionStart: nopips,
    CalibrationCheckState.specifyLabware: badcal,
    CalibrationCheckState.checkPointOne: badcal,
    CalibrationCheckState.checkPointTwo: badcal,
    CalibrationCheckState.checkPointThree: badcal,
    CalibrationCheckState.checkHeight: badcal
}


StateEnumType = TypeVar('StateEnumType', bound=enum.Enum)
Relationship = Dict[StateEnumType, StateEnumType]


class StateMachine(Generic[StateEnumType]):
    """
    A class for building a mealy state machine pattern based on
    steps provided to this class.
    """
    def __init__(
            self, states: Type[StateEnumType], rel: Relationship,
            exit: Relationship, error: Relationship,
            first_state: StateEnumType):
        self._states = states
        self._relationship = rel
        self._exit_relationship = exit
        self._error_relationship = error
        self._current_state = first_state

    def get_state(self, state_name: str) -> StateEnumType:
        return getattr(self._states, state_name)

    def update_state(self, state_name: StateEnumType):
        self._current_state = self._iterate_thru_relationships(state_name)

    def _iterate_thru_relationships(
            self, state_name: StateEnumType) -> StateEnumType:
        rel_list = [
            self._relationship,
            self._exit_relationship,
            self._error_relationship]
        for relationship in rel_list:
            next_state = self._find_next(state_name, relationship)
            if next_state != self.current_state:
                return next_state
        return self.current_state

    def _find_next(
            self, input: StateEnumType,
            relationship_enum: Relationship) -> StateEnumType:
        """
        Next state will either check the input or the current state to see
        if it can find a relationship in any of the enum classes provided.
        """
        output = relationship_enum.get(input)
        if output:
            return self.get_state(output.name)
        else:
            return self.get_state(input.name)

    @property
    def current_state(self) -> StateEnumType:
        return self._current_state

    @property
    def next_state(self) -> StateEnumType:
        """
        The next state based on current state only. For session status msg.
        """
        return self._iterate_thru_relationships(self.current_state)


class CalibrationCheckMachine(StateMachine[CalibrationCheckState]):
    def __init__(self) -> None:
        super().__init__(CalibrationCheckState,
                         check_normal_relationship_dict,
                         check_exit_relationship_dict,
                         check_error_relationship_dict,
                         CalibrationCheckState.sessionStart)
