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

StateEnumType = TypeVar('StateEnumType', bound=enum.Enum)
Relationship = Dict[StateEnumType, StateEnumType]


# State Side Effect callbacks take no params other than self
SideEffectCallback = Callable[['StateMachine'], Awaitable[Any]]

# Transition callbacks pass through all params from trigger call
TransitionCallback = Callable[[Any], Awaitable[Any]]

# Condition callbacks pass through all params from trigger call,
# and must return bool
ConditionCallback = Callable[[Any], Awaitable[bool]]

WILDCARD = '*'

class State():
    def __init__(self,
                 name: str,
                 on_enter: SideEffectCallback = None,
                 on_exit: SideEffectCallback = None):
        self._name = name
        self._on_enter = on_enter
        self._on_exit = on_exit

    async def enter(self) -> str:
        if self._on_enter:
           return await self._on_enter()

    async def exit(self) -> str:
        if self._on_exit:
            return await self._on_exit()

    @property
    def name(self) -> str:
        return self._name

class Transition:
    def __init__(self,
                 from_state_name: str,
                 to_state_name: str,
                 before: TransitionCallback = None,
                 after: TransitionCallback = None,
                 condition: ConditionCallback = None):
        self.from_state_name = from_state_name
        self.to_state_name = to_state_name
        self.before = before
        self.after = after
        self.condition = condition

    async def execute(self, get_state_by_name, set_current_state,
                      *args, **kwargs):
        if self.condition and not await self.condition():
            return False
        if self.before:
            await self.before(*args, **kwargs)
        if self.from_state_name is not WILDCARD:
            await get_state_by_name(self.from_state_name).exit()
        set_current_state(self.to_state_name)
        await get_state_by_name(self.to_state_name).enter()
        if self.after:
            await self.after(*args, **kwargs)
        return True

class StateMachineError(Exception):
    def __init__(self, msg: str) -> None:
        self.msg = msg or ''
        super().__init__()

    def __repr__(self):
        return f'<StateMachineError: {self.msg}'

    def __str__(self):
        return f'StateMachineError: {self.msg}'


def enum_to_set(enum) -> set:
    return set(item.name for item in enum)

class StateKeys(enum.Enum):
    name = enum.auto()
    on_enter = enum.auto()
    on_exit = enum.auto()

StateParams = Union[str, Dict[StateKeys, str]]

class TransitionKeys(enum.Enum):
    from_state_name = enum.auto()
    to_state_name = enum.auto()
    before = enum.auto()
    after = enum.auto()
    condition = enum.auto()

class CallbackKeys(enum.Enum):
    on_enter = enum.auto()
    on_exit = enum.auto()
    before = enum.auto()
    after = enum.auto()
    condition = enum.auto()

TransitionKwargs = Dict[TransitionKeys, str]

class StateMachine():
    def __init__(self,
                 states: List[StateParams],
                 transitions: List[TransitionKwargs],
                 initial_state_name: str):
        self._states = set()
        self._current_state = None
        self._events = {}
        for params in states:
            if isinstance(params, dict):
                self.add_state(**params)
            else:
                self.add_state(name=params)
        self._set_current_state(initial_state_name)
        for t in transitions:
            self.add_transition(**t)

    def _get_state_by_name(self, name: str) -> State:
        return next((state for state in self._states
                     if state.name == name), None)

    def _set_current_state(self, state_name: str):
        goal_state = self._get_state_by_name(state_name)
        assert goal_state, f"state {state_name} doesn't exist in machine"
        self._current_state = goal_state
        return None

    async def _dispatch_trigger(self, trigger, *args, **kwargs):
        if trigger in self._events and \
                WILDCARD not in self._events[trigger] and \
                self._current_state.name not in self._events[trigger]:
            raise StateMachineError(f'cannot trigger event {trigger}' \
                                    f' from state {self._current_state.name}')
        try:
            from_state = WILDCARD if WILDCARD in self._events[trigger] \
                          else self._current_state.name
            for transition in self._events[trigger][from_state]:
                if await transition.execute(self._get_state_by_name,
                                            self._set_current_state,
                                            *args, **kwargs):
                    break
        except Exception:
            raise StateMachineError(f'event {trigger} failed to '
                                    f'transition from {self._current_state.name}')

    def _get_cb(self, method_name: Optional[str]):
        print(f'GOT CALLBACK {method_name}, {getattr(self,method_name)}\n\n')
        return getattr(self, method_name) if method_name else None

    def _bind_cb_kwarg(self, key, value):
        print(f'BOUND CALLBACK {key}, {value} \n\n')
        if key in enum_to_set(CallbackKeys):
            return self._get_cb(value)
        return value

    def add_state(self, *args, **kwargs):
        bound_kwargs = {k: self._bind_cb_kwarg(k,v) for k,v in kwargs.items()}
        self._states.add(State(*args, **bound_kwargs))

    def add_transition(self,
                       trigger: str,
                       from_state: str,
                       to_state: str,
                       **kwargs):
        if from_state is not WILDCARD:
            assert self._get_state_by_name(from_state),\
                f"state {from_state} doesn't exist in machine"
            assert self._get_state_by_name(to_state),\
                f"state {to_state} doesn't exist in machine"
        if trigger not in self._events:
            setattr(self, trigger,
                    partial(self._dispatch_trigger, trigger))
        bound_kwargs = {k: self._bind_cb_kwarg(k,v) for k,v in kwargs.items()}
        self._events[trigger] = {**self._events.get(trigger, {}),
                                 from_state: [
                                        *self._events.get(trigger,
                                                          {}).get(from_state,
                                                                  []),
                                        Transition(from_state_name=from_state,
                                                   to_state_name=to_state,
                                                   **bound_kwargs)
                                        ]
                                }
    @property
    def current_state(self) -> State:
        return self._current_state

class OldStateMachine(Generic[StateEnumType]):
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


class CalibrationCheckMachine(OldStateMachine[CalibrationCheckState]):
    def __init__(self) -> None:
        super().__init__(CalibrationCheckState,{},{}, {},'s',{})
                        #  check_normal_relationship_dict,
                        #  check_exit_relationship_dict,
                        #  check_error_relationship_dict,
                        #  CalibrationCheckState.sessionStart,
                        #  check_relationship_requires_move_dict)
