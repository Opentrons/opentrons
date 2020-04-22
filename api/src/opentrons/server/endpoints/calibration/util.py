import enum
import asyncio
from dataclasses import dataclass
from functools import partial
from typing import (TypeVar, Generic, Type, Dict, Union, Awaitable,
                    Optional, Callable, Set, Any, List)


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


# calibration_check_transitions = {

# }
# def leaveStateUnchanged(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return currentState

# jog = leaveStateUnchanged
# move = leaveStateUnchanged
# pickUpTip = leaveStateUnchanged
# dropTip = leaveStateUnchanged
#
# def loadLabware(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.labwareLoaded
#
# def preparePipette(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.preparingPipette
#
# def checkPointOne(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.checkingPointOne
#
# def checkPointTwo(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.checkingPointTwo
#
# def checkPointThree(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.checkingPointThree
#
# def checkHeight(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.checkingHeight
#
# def cleanUp(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.cleaningUp
#
# def exitSession(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.sessionExited
#
# def invalidateTip(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.p
#
# def rejectCalibration(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.badCalibratioData
#
# def promptNoPipettesAttached(currentState: CalibrationCheckState) -> CalibrationCheckState:
#     return CalibrationCheckState.noPipettesAttached



# class CalibrationCheckVerbsForState:
#     sessionStarted: {loadLabware}
#     labwareLoaded = {preparePipette}
#     preparingPipette = {jog, pickUpTip, checkPointOne}
#     checkingPointOne = {jog, checkPointTwo}
#     checkingPointTwo = {jog, checkPointThree}
#     checkingPointThree = {jog, checkHeight}
#     checkingHeight = {jog, cleanUp}
#     cleaningUp = {dropTip, exitSession}
#     badCalibrationData = {exitSession}
#     noPipettesAttached = {exitSession}
#     sessionExited = {}




# check_normal_relationship_dict = {
#     CalibrationCheckState.sessionStarted: CalibrationCheckState.labwareLoaded,
#     CalibrationCheckState.labwareLoaded: CalibrationCheckState.pickingUpTip,
#     CalibrationCheckState.pickingUpTip: CalibrationCheckState.checkingPointOne,
#     CalibrationCheckState.checkingPointOne: CalibrationCheckState.checkingPointTwo,
#     CalibrationCheckState.checkingPointTwo: CalibrationCheckState.checkingPointThree,
#     CalibrationCheckState.checkingPointThree: CalibrationCheckState.checkingHeight,
#     CalibrationCheckState.checkingHeight: CalibrationCheckState.droppingTip,
#     CalibrationCheckState.droppingTip: CalibrationCheckState.sessionExited
# }

# exit = CalibrationCheckState.sessionExit
# check_exit_relationship_dict = {
#     CalibrationCheckState.badCalibrationData: exit,
#     CalibrationCheckState.checkHeight: exit,
#     CalibrationCheckState.noPipettesAttached: exit,
#     CalibrationCheckState.dropTip: exit
# }

# nopips = CalibrationCheckState.noPipettesAttached
# badcal = CalibrationCheckState.badCalibratioData
# check_error_relationship_dict = {
#     CalibrationCheckState.sessionStart: nopips,
#     CalibrationCheckState.loadLabware: badcal,
#     CalibrationCheckState.checkPointOne: badcal,
#     CalibrationCheckState.checkPointTwo: badcal,
#     CalibrationCheckState.checkPointThree: badcal,
#     CalibrationCheckState.checkHeight: badcal,
#     CalibrationCheckState.invalidateTip: CalibrationCheckState.pickUpTip
# }

# check_relationship_requires_move_dict = {
#     CalibrationCheckState.moveToTipRack: CalibrationCheckState.move,
#     CalibrationCheckState.checkPointOne: CalibrationCheckState.move,
#     CalibrationCheckState.checkPointTwo: CalibrationCheckState.move,
#     CalibrationCheckState.checkPointThree: CalibrationCheckState.move,
#     CalibrationCheckState.checkHeight: CalibrationCheckState.move
# }

#
# StateEnumType = TypeVar('StateEnumType', bound=enum.Enum)
# Relationship = Dict[StateEnumType, StateEnumType]

# Transition callbacks pass through all params from trigger call
TransitionCallback = Callable[..., Awaitable[Any]]

# Condition callbacks pass through all params from trigger call,
# and must return bool
ConditionCallback = Callable[..., Awaitable[bool]]

WILDCARD = '*'


class State:
    def __init__(self, name: str):
        self._name = name

    @property
    def name(self) -> str:
        return self._name


class Transition:
    def __init__(self,
                 from_state: str,
                 to_state: str,
                 before: TransitionCallback = None,
                 after: TransitionCallback = None,
                 condition: ConditionCallback = None):
        self.from_state = from_state
        self.to_state = to_state
        self.before = before
        self.after = after
        self.condition = condition

    async def execute(self, set_current_state, *args, **kwargs):
        if self.condition and not await self.condition():
            return False
        if self.before:
            await self.before(*args, **kwargs)
        set_current_state(self.to_state)
        if self.after:
            await self.after(*args, **kwargs)
        return True


class StateMachineError(Exception):
    def __init__(self, msg: str):
        self.msg = msg or ''
        super().__init__()

    def __repr__(self):
        return f'<{str(self)}>'

    def __str__(self):
        return f'StateMachineError: {self.msg}'


def enum_to_set(e) -> set:
    return set(item.name for item in e)


StateParams = Union[str, Dict[str, Any]]


class TransitionKeys(enum.Enum):
    from_state = enum.auto()
    to_state = enum.auto()
    before = enum.auto()
    after = enum.auto()
    condition = enum.auto()


class CallbackKeys(enum.Enum):
    on_enter = enum.auto()
    on_exit = enum.auto()
    before = enum.auto()
    after = enum.auto()
    condition = enum.auto()


TransitionKwargs = Dict[str, Any]


class StateMachine:
    def __init__(self,
                 states: List[StateParams],
                 transitions: List[TransitionKwargs],
                 initial_state: str):
        """
        Construct a state machine

        :param states: a collection of available states
        :param transitions: the transitions from state to state
        :param initial_state: the starting state
        """
        self._states: Dict[str, State] = {}
        self._current_state: Optional[State] = None
        self._events: Dict[str, Dict[str, List[Transition]]] = {}
        for params in states:
            if isinstance(params, dict):
                self.add_state(**params)
            else:
                self.add_state(name=params)
        self._set_current_state(initial_state)
        for t in transitions:
            self.add_transition(**t)

    def _get_state_by_name(self, name: str) -> Optional[State]:
        return self._states.get(name)

    def _set_current_state(self, state_name: str):
        """
        This method should only be called implicitly via transitions, or
        inside a test
        """
        goal_state = self._get_state_by_name(state_name)
        assert goal_state, f"state {state_name} doesn't exist in machine"
        self._current_state = goal_state

    async def trigger_transition(self, trigger, *args, **kwargs):
        """
        Trigger a state transition

        :param trigger: The name of the transition
        :param args: arg list passed to transition callbacks
        :param kwargs: keyword args passed to transition callbacks
        :return: None
        """
        events = self._events.get(trigger, {})
        if events and WILDCARD not in events and \
                self.current_state_name not in events:
            raise StateMachineError(f'cannot trigger event {trigger}'
                                    f' from state {self.current_state_name}')
        try:
            from_state = WILDCARD if WILDCARD in events \
                else self.current_state_name
            for transition in events[from_state]:
                if await transition.execute(self._set_current_state,
                                            *args, **kwargs):
                    break
        except Exception as e:
            raise StateMachineError(f'event {trigger} failed to transition '
                                    f'from {self.current_state_name}: '
                                    f'{str(e)}')

    def _get_cb(self, method_name: Optional[str]):
        return getattr(self, method_name) if method_name else None

    def _bind_cb_kwarg(self, key, value):
        if key in enum_to_set(CallbackKeys):
            return self._get_cb(value)
        return value

    def add_state(self, *args, **kwargs):
        state = State(*args, **kwargs)
        self._states[state.name] = state

    def add_transition(self,
                       trigger: str,
                       from_state: str,
                       to_state: str,
                       **kwargs):
        """
        Create a transition form state to state

        :param trigger: name of the trigger
        :param from_state: name of source state
        :param to_state: name of target state
        :param kwargs: extra arguments
        :return: None
        """
        if from_state is not WILDCARD:
            assert self._get_state_by_name(from_state),\
                f"state {from_state} doesn't exist in machine"
            assert self._get_state_by_name(to_state),\
                f"state {to_state} doesn't exist in machine"
        bound_kwargs = {k: self._bind_cb_kwarg(k, v) for k, v in kwargs.items()}
        self._events[trigger] = {
            **self._events.get(trigger, {}),
            from_state: [
                *self._events.get(trigger, {}).get(from_state, []),
                Transition(from_state=from_state,
                           to_state=to_state,
                           **bound_kwargs)
            ]
        }

    @property
    def current_state(self) -> Optional[State]:
        return self._current_state

    @property
    def current_state_name(self) -> str:
        return self._current_state.name if self._current_state else ""

    @property
    def potential_triggers(self) -> Set[str]:
        """Return a set of currently available triggers"""
        potential_triggers = set()
        for trigger, events in self._events.items():
            if WILDCARD in events or self.current_state_name in events:
                potential_triggers.add(trigger)
        return potential_triggers

#
# class OldStateMachine(Generic[StateEnumType]):
#     """
#     A class for building a mealy state machine pattern based on
#     steps provided to this class.
#     """
#     def __init__(
#             self, states: Type[StateEnumType], rel: Relationship,
#             exit: Relationship, error: Relationship,
#             first_state: StateEnumType, move: Relationship = None):
#         self._states = states
#         self._relationship = rel
#         self._exit_relationship = exit
#         self._error_relationship = error
#         self._move_relationship = move if move else {}
#         self._current_state = first_state
#
#     def get_state(self, state_name: str) -> StateEnumType:
#         return getattr(self._states, state_name)
#
#     def update_state(
#             self,
#             state_name: Optional[StateEnumType] = None, next: bool = False):
#         if state_name and next:
#             self._current_state = self._iterate_thru_relationships(state_name)
#         elif state_name:
#             self._current_state = state_name
#         else:
#             self._current_state = self.next_state
#
#     def _iterate_thru_relationships(
#             self, state_name: StateEnumType) -> StateEnumType:
#         rel_list = [
#             self._relationship,
#             self._exit_relationship,
#             self._error_relationship]
#         for relationship in rel_list:
#             next_state = self._find_next(state_name, relationship)
#             if next_state != self.current_state:
#                 return next_state
#         return self.current_state
#
#     def _find_next(
#             self, input: StateEnumType,
#             relationship_enum: Relationship) -> StateEnumType:
#         """
#         Next state will either check the input or the current state to see
#         if it can find a relationship in any of the enum classes provided.
#         """
#         output = relationship_enum.get(input)
#         if output:
#             return self.get_state(output.name)
#         else:
#             return self.get_state(input.name)
#
#     @property
#     def current_state(self) -> StateEnumType:
#         return self._current_state
#
#     @property
#     def next_state(self) -> StateEnumType:
#         """
#         The next state based on current state only. For session status msg.
#         """
#         return self._iterate_thru_relationships(self.current_state)
#
#     def requires_move(self, state: StateEnumType) -> bool:
#         return bool(self._move_relationship.get(state))
#
#
# class CalibrationCheckMachine(OldStateMachine[CalibrationCheckState]):
#     def __init__(self) -> None:
#         super().__init__(CalibrationCheckState,{},{}, {},'s',{})
#                         #  check_normal_relationship_dict,
#                         #  check_exit_relationship_dict,
#                         #  check_error_relationship_dict,
#                         #  CalibrationCheckState.sessionStart,
#                         #  check_relationship_requires_move_dict)
