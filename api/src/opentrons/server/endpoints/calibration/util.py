import enum
from typing import TypeVar

"""
Note, the general types below should be restricted to the following:

stateOutput contrained to int, str and State
stateInput constrained to str (may expand where applicable)

Currently, mypy evaluates TypeVar to be the first class specified when
type checking. See https://github.com/python/mypy/issues/3644
"""
stateInput = TypeVar('stateInput', bound=str)
stateOutput = TypeVar('stateOutput')

relationship = TypeVar('relationship', bound=enum.Enum)


class State:
    """
    A class that encapsulates a state and its relationships,
    similar to a directed acyclic graph.
    """
    def __init__(self, name: stateInput, value: stateOutput):
        self.name = name
        self.value = value


class StateEnum(enum.Enum):
    sessionStart = State("sessionStart", enum.auto())
    specifyLabware = State("specifyLabware", enum.auto())
    pickUpTip = State("pickUpTip", enum.auto())
    checkPointOne = State("checkPointOne", enum.auto())
    checkPointTwo = State("checkPointTwo", enum.auto())
    checkPointThree = State("checkPointThree", enum.auto())
    checkHeight = State("checkHeight", enum.auto())
    sessionExit = State("sessionExit", enum.auto())
    badDeckCalibration = State("badDeckCalibration", enum.auto())
    noPipettesAttached = State("noPipettesAttached", enum.auto())


class RelationshipEnum(enum.Enum):
    sessionStart = StateEnum.specifyLabware
    specifyLabware = StateEnum.pickUpTip
    checkPointOne = StateEnum.checkPointTwo
    checkPointTwo = StateEnum.checkPointThree
    checkPointThree = StateEnum.checkHeight
    checkHeight = StateEnum.sessionStart


class ExitRelationshipEnum(enum.Enum):
    badDeckCalibration = StateEnum.sessionExit
    checkHeight = StateEnum.sessionExit
    noPipettesAttached = StateEnum.sessionExit


class ErrorRelationshipEnum(enum.Enum):
    sessionStart = StateEnum.noPipettesAttached
    specifyLabware = StateEnum.badDeckCalibration
    checkPointOne = StateEnum.badDeckCalibration
    checkPointTwo = StateEnum.badDeckCalibration
    checkPointThree = StateEnum.badDeckCalibration
    checkHeight = StateEnum.badDeckCalibration


class StateMachine:
    """
    A class for building a mealy state machine pattern based on
    steps provided to this class.
    """
    def __init__(
            self, states, rel: relationship,
            exit: relationship, error: relationship):
        state_list = list(states)
        self._states = {enum.name: enum.value for enum in state_list}
        self._relationship = rel
        self._exit_relationship = exit
        self._error_relationship = error
        self._current_state = state_list[0].value

    def get_state(self, state_name: stateInput) -> 'State':
        return self._states[state_name]

    def update_state(self, state_name: stateInput):
        next_state = self.next_state(state_name)
        if next_state:
            self._current_state = next_state

    def next_state(self, input: stateInput = None) -> 'State':
        """
        Next state will either check the input or the current state to see
        if it can find a relationship in any of the enum classes provided.
        """
        curr = input if input else self._current_state.name
        if curr and hasattr(self._relationship, curr):
            rel = getattr(self._relationship, curr)
            if rel:
                return self._states[rel.value.name]
        if curr and hasattr(self._exit_relationship, curr):
            rel = getattr(self._exit_relationship, curr)
            if rel:
                return self._states[rel.value.name]
        if curr and hasattr(self._error_relationship, curr):
            rel = getattr(self._error_relationship, curr)
            if rel:
                return self._states[rel.value.name]
        return self._current_state

    def set_start(self, state_name: stateInput):
        self._current_state = self._states[state_name]

    @property
    def current_state(self) -> 'State':
        return self._current_state


class CalibrationCheckMachine(StateMachine):
    def __init__(self):
        super().__init__(StateEnum,
                         RelationshipEnum,
                         ExitRelationshipEnum,
                         ErrorRelationshipEnum)
