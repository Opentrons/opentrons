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
