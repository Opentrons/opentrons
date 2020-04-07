import enum
from typing import TypeVar, Generic, Type, Dict, Optional


class CalibrationCheckState(enum.Enum):
    sessionStart = enum.auto()
    loadLabware = enum.auto()
    moveToTipRack = enum.auto()
    pickUpTip = enum.auto()
    checkPointOne = enum.auto()
    checkPointTwo = enum.auto()
    checkPointThree = enum.auto()
    checkHeight = enum.auto()
    dropTip = enum.auto()
    jog = enum.auto()
    move = enum.auto()
    sessionExit = enum.auto()
    invalidateTip = enum.auto()
    badDeckCalibration = enum.auto()
    noPipettesAttached = enum.auto()


check_normal_relationship_dict = {
    CalibrationCheckState.sessionStart: CalibrationCheckState.loadLabware,
    CalibrationCheckState.loadLabware: CalibrationCheckState.moveToTipRack,
    CalibrationCheckState.moveToTipRack: CalibrationCheckState.jog,
    CalibrationCheckState.jog: CalibrationCheckState.pickUpTip,
    CalibrationCheckState.pickUpTip: CalibrationCheckState.checkPointOne,
    CalibrationCheckState.checkPointOne: CalibrationCheckState.checkPointTwo,
    CalibrationCheckState.checkPointTwo: CalibrationCheckState.checkPointThree,
    CalibrationCheckState.checkPointThree: CalibrationCheckState.checkHeight,
    CalibrationCheckState.checkHeight: CalibrationCheckState.sessionStart
}

exit = CalibrationCheckState.sessionExit
check_exit_relationship_dict = {
    CalibrationCheckState.badDeckCalibration: exit,
    CalibrationCheckState.checkHeight: exit,
    CalibrationCheckState.noPipettesAttached: exit,
    CalibrationCheckState.dropTip: exit
}

nopips = CalibrationCheckState.noPipettesAttached
badcal = CalibrationCheckState.badDeckCalibration
check_error_relationship_dict = {
    CalibrationCheckState.sessionStart: nopips,
    CalibrationCheckState.loadLabware: badcal,
    CalibrationCheckState.checkPointOne: badcal,
    CalibrationCheckState.checkPointTwo: badcal,
    CalibrationCheckState.checkPointThree: badcal,
    CalibrationCheckState.checkHeight: badcal,
    CalibrationCheckState.invalidateTip: CalibrationCheckState.pickUpTip
}

check_relationship_requires_move_dict = {
    CalibrationCheckState.moveToTipRack: CalibrationCheckState.move,
    CalibrationCheckState.checkPointOne: CalibrationCheckState.move,
    CalibrationCheckState.checkPointTwo: CalibrationCheckState.move,
    CalibrationCheckState.checkPointThree: CalibrationCheckState.move,
    CalibrationCheckState.checkHeight: CalibrationCheckState.move
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
            first_state: StateEnumType, move: Relationship = None):
        self._states = states
        self._relationship = rel
        self._exit_relationship = exit
        self._error_relationship = error
        self._move_relationship = move if move else {}
        self._current_state = first_state

    def get_state(self, state_name: str) -> StateEnumType:
        return getattr(self._states, state_name)

    def update_state(
            self,
            state_name: Optional[StateEnumType] = None, next: bool = False):
        if state_name and next:
            self._current_state = self._iterate_thru_relationships(state_name)
        elif state_name:
            self._current_state = state_name
        else:
            self._current_state = self.next_state

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

    def requires_move(self, state: StateEnumType) -> bool:
        move_state = self._move_relationship.get(state)
        if move_state:
            return True
        else:
            return False


class CalibrationCheckMachine(StateMachine[CalibrationCheckState]):
    def __init__(self) -> None:
        super().__init__(CalibrationCheckState,
                         check_normal_relationship_dict,
                         check_exit_relationship_dict,
                         check_error_relationship_dict,
                         CalibrationCheckState.sessionStart,
                         check_relationship_requires_move_dict)
