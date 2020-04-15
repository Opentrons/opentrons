import enum
from dataclasses import dataclass
from typing import (TypeVar, Generic, Type, Dict,
                    Optional, Callable, Set)


class CalibrationCheckState(enum.Enum):
    sessionStarted = enum.auto()
    labwareLoaded = enum.auto()
    preparingPipette = enum.auto()
    checkingPointOne = enum.auto()
    checkingPointTwo = enum.auto()
    checkingPointThree = enum.auto()
    checkingHeight = enum.auto()
    cleaningUp = enum.auto()
    sessionExited = enum.auto()
    badCalibrationData = enum.auto()
    noPipettesAttached = enum.auto()


calibration_check_transitions = {

}
def leaveStateUnchanged(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return currentState

jog = leaveStateUnchanged
move = leaveStateUnchanged
pickUpTip = leaveStateUnchanged
dropTip = leaveStateUnchanged

def loadLabware(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.labwareLoaded

def preparePipette(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.preparingPipette

def checkPointOne(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.checkingPointOne

def checkPointTwo(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.checkingPointTwo

def checkPointThree(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.checkingPointThree

def checkHeight(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.checkingHeight

def cleanUp(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.cleaningUp

def exitSession(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.sessionExited

def invalidateTip(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.p

def rejectCalibration(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.badCalibratioData

def promptNoPipettesAttached(currentState: CalibrationCheckState) -> CalibrationCheckState:
    return CalibrationCheckState.noPipettesAttached



class CalibrationCheckVerbsForState:
    sessionStarted: {loadLabware}
    labwareLoaded = {preparePipette}
    preparingPipette = {jog, pickUpTip, checkPointOne}
    checkingPointOne = {jog, checkPointTwo}
    checkingPointTwo = {jog, checkPointThree}
    checkingPointThree = {jog, checkHeight}
    checkingHeight = {jog, cleanUp}
    cleaningUp = {dropTip, exitSession}
    badCalibrationData = {exitSession}
    noPipettesAttached = {exitSession}
    sessionExited = {}




check_normal_relationship_dict = {
    CalibrationCheckState.sessionStarted: CalibrationCheckState.labwareLoaded,
    CalibrationCheckState.labwareLoaded: CalibrationCheckState.pickingUpTip,
    CalibrationCheckState.pickingUpTip: CalibrationCheckState.checkingPointOne,
    CalibrationCheckState.checkingPointOne: CalibrationCheckState.checkingPointTwo,
    CalibrationCheckState.checkingPointTwo: CalibrationCheckState.checkingPointThree,
    CalibrationCheckState.checkingPointThree: CalibrationCheckState.checkingHeight,
    CalibrationCheckState.checkingHeight: CalibrationCheckState.droppingTip,
    CalibrationCheckState.droppingTip: CalibrationCheckState.sessionExited
}

exit = CalibrationCheckState.sessionExit
check_exit_relationship_dict = {
    CalibrationCheckState.badCalibrationData: exit,
    CalibrationCheckState.checkHeight: exit,
    CalibrationCheckState.noPipettesAttached: exit,
    CalibrationCheckState.dropTip: exit
}

nopips = CalibrationCheckState.noPipettesAttached
badcal = CalibrationCheckState.badCalibratioData
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


class State():
    def __init__(self,
                 name: str,
                 on_enter: Callable = None,
                 on_exit: Callable = None):
        self._name = name
        self._on_enter = on_enter
        self._on_exit = on_exit

    def on_enter(self) -> str:
        return self._on_enter()

    def on_exit(self) -> str:
        return self._on_exit()

    @property
    def name(self) -> str:
        return self._name

@dataclass
class Transition:
    trigger: str
    from_state_name: str
    to_state_name: str
    before: Callable = None
    after: Callable = None
    condition: Callable[Any, Boolean] = None

class StateTransitionError(Exception):
    def __init__(self, transition: Transition = None) -> None:
        self.transition = transition or {}
        super().__init__()

    def __repr__(self):
        return '<StateTransitionError: cannot trigger event' \
               f'{self.transition.trigger} from {self.transition.from_state}>'

    def __str__(self):
        return 'StateTransitionError: cannot trigger event' \
               f'{self.transition.trigger} from {self.transition.from_state}'

class NewStateMachine():
    def __init__(self,
                 states: Set[State],
                 transitions: Set[Transition],
                 initial_state_name: str):
        self._states = states
        self._transitions = transitions
        self._register_triggers()
        self._current_state = None
        self._set_current_state(initial_state_name)

    def _register_triggers(self):
        for transition in self._transitions:
            setattr(self, transition.trigger, )

    def _find_state_by_name(self, name: str) -> State:
        return next((state for state in self._states
                     if state.name == name), None)

    def _execute_transition(self, transition)):
        from_state = self._find_state_by_name(transition.from_state_name)
        to_state = self._find_state_by_name(transition.to_state_name)
        for t in self._transitions if t.trigger == transition.trigger \
                and t.from_state == self._current_state:


        if not from_state or not to_state:
           raise StateTransitionError(transition)

    self._set_current_state(self, state_name: str):
        # TODO: check if state name exists
        # TODO: perform state enter and exit callbacks if preset
        # TODO: perform state enter and exit callbacks if preset

    def add_state(self, state: State):
        self._states.add(state)

    def add_transition(self, transition: Transition):
        self._transitions.add(transition)

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
        return bool(self._move_relationship.get(state))


class CalibrationCheckMachine(StateMachine[CalibrationCheckState]):
    def __init__(self) -> None:
        super().__init__(CalibrationCheckState,
                         check_normal_relationship_dict,
                         check_exit_relationship_dict,
                         check_error_relationship_dict,
                         CalibrationCheckState.sessionStart,
                         check_relationship_requires_move_dict)
