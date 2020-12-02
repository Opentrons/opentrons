from typing import Optional, List
from typing_extensions import Literal, TypedDict

State = Literal[
    'loaded', 'running', 'finished', 'stopped', 'paused', 'error', None]


class StateInfo(TypedDict, total=False):
    message: str
    #: A message associated with the state change by the system for display
    changedAt: float
    #: The time at which the state changed, relative to the startTime
    estimatedDuration: float
    #: If relevant for the state (e.g. 'paused' caused by a delay() call) the
    #: duration estimated for the state
    userMessage: str
    #: If provided by the mechanism that changed the state, a message from the
    #: user


class LastCommand(TypedDict):
    id: int
    handledAt: int


class Error(TypedDict):
    timestamp: int
    error: Exception


class SnapPayload(TypedDict):
    state: State
    stateInfo: StateInfo
    startTime: Optional[float]
    doorState: Optional[str]
    blocked: Optional[bool]
    errors: List[Error]
    lastCommand: Optional[LastCommand]


class Message(TypedDict):
    topic: Literal['session']
    payload: SnapPayload


class CommandShortId(TypedDict):
    level: int
    description: str
    id: int
