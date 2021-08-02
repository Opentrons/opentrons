"""State store actions.

Actions can be passed to the StateStore, where they will trigger
state changes.
"""

from dataclasses import dataclass
from typing import Union

from ..commands import Command


@dataclass(frozen=True)
class PlayAction:
    """Start or resume processing commands in the engine."""

    pass


@dataclass(frozen=True)
class PauseAction:
    """Pause processing commands in the engine."""

    pass


@dataclass(frozen=True)
class StopAction:
    """Stop processing commands in the engine, marking the engine status as done."""

    pass


@dataclass(frozen=True)
class UpdateCommandAction:
    """Update a given command."""

    command: Command


Action = Union[
    PlayAction,
    PauseAction,
    StopAction,
    UpdateCommandAction,
]
