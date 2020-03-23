import enum
from typing import TypeVar, Generic, Type
from dataclasses import dataclass

"""
Note, the general types below should be restricted to the following:

StateOutput contrained to int, str and State
StateInput constrained to str (may expand where applicable)

Currently, mypy evaluates TypeVar to be the first class specified when
type checking. See https://github.com/python/mypy/issues/3644
"""
StateInput = TypeVar('StateInput', bound=str)
StateOutput = TypeVar('StateOutput')

Relationship = TypeVar('Relationship', bound=Type[enum.Enum])


@dataclass
class State:
    """
    A class that encapsulates a state and its relationships,
    similar to a directed acyclic graph.
    """
    name: str
    value: int


class CalibrationCheckState(enum.Enum):
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


class CheckRelationshipEnum(enum.Enum):
    sessionStart = CalibrationCheckState.specifyLabware
    specifyLabware = CalibrationCheckState.pickUpTip
    checkPointOne = CalibrationCheckState.checkPointTwo
    checkPointTwo = CalibrationCheckState.checkPointThree
    checkPointThree = CalibrationCheckState.checkHeight
    checkHeight = CalibrationCheckState.sessionStart


class CheckExitRelationshipEnum(enum.Enum):
    badDeckCalibration = CalibrationCheckState.sessionExit
    checkHeight = CalibrationCheckState.sessionExit
    noPipettesAttached = CalibrationCheckState.sessionExit


class CheckErrorRelationshipEnum(enum.Enum):
    sessionStart = CalibrationCheckState.noPipettesAttached
    specifyLabware = CalibrationCheckState.badDeckCalibration
    checkPointOne = CalibrationCheckState.badDeckCalibration
    checkPointTwo = CalibrationCheckState.badDeckCalibration
    checkPointThree = CalibrationCheckState.badDeckCalibration
    checkHeight = CalibrationCheckState.badDeckCalibration


StateEnumType = TypeVar('StateEnumType', bound=CalibrationCheckState)


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

    def get_state(self, state_name: StateInput) -> StateEnumType:
        return getattr(self._states, state_name)

    def update_state(self, state_name: StateInput):
        self._current_state = self._iterate_thru_relationships(state_name)

    def _iterate_thru_relationships(
            self, state_name: StateInput) -> StateEnumType:
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
            self, input: StateInput,
            relationship_enum: Relationship) -> StateEnumType:
        """
        Next state will either check the input or the current state to see
        if it can find a relationship in any of the enum classes provided.
        """
        if hasattr(relationship_enum, input):
            output = getattr(relationship_enum, input)
            return self.get_state(output.value.name)
        else:
            return self.get_state(input)

    def set_start(self, state_name: StateInput):
        self._current_state = self.get_state(state_name)

    @property
    def current_state(self) -> StateEnumType:
        return self._current_state

    @property
    def next_state(self) -> StateEnumType:
        """
        The next state based on current state only. For session status msg.
        """
        state = self.current_state.value
        return self._iterate_thru_relationships(state.name)


class CalibrationCheckMachine(StateMachine):
    def __init__(self) -> None:
        super().__init__(CalibrationCheckState,
                         CheckRelationshipEnum,
                         CheckExitRelationshipEnum,
                         CheckErrorRelationshipEnum,
                         CalibrationCheckState.sessionStart)
