import logging
import enum
from typing import (Dict, Union, Awaitable, Optional, Callable, Set, Any, List)

log = logging.getLogger(__name__)


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
        log.debug(f"trigger_transition for {trigger} "
                  f"in {self.current_state_name}")
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
            log.exception(f"exception raised processing trigger {trigger}"
                          f"in state {self.current_state_name}")
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
        Create a transition from state to state

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
        bound_kwargs = {
            k: self._bind_cb_kwarg(k, v) for k, v in kwargs.items()
        }
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

    def get_potential_triggers(self) -> Set[str]:
        """Return a set of currently available triggers"""
        potential_triggers = set()
        for trigger, events in self._events.items():
            if WILDCARD in events or self.current_state_name in events:
                potential_triggers.add(trigger)
        return potential_triggers
