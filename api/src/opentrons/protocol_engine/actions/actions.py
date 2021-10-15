"""State store actions.

Actions can be passed to the ActionDispatcher, where they will trigger
reactions in objects that subscribe to the pipeline, like the StateStore.
"""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Union

from ..commands import Command


@dataclass(frozen=True)
class PlayAction:
    """Start or resume processing commands in the engine."""


@dataclass(frozen=True)
class PauseAction:
    """Pause processing commands in the engine."""


@dataclass(frozen=True)
class StopAction:
    """Stop processing commands in the engine, marking the engine status as done.

    Arguments:
        error_details: Details about an external error that caused the stop,
            if applicable.
    """

    error_details: Optional[StopErrorDetails] = None


@dataclass(frozen=True)
class StopErrorDetails:
    """Details about an error that caused a StopAction to be issued.

    Arguments:
        error: The exception that caused the failure.
        error_id: A unique identifier to assign to the error occurance.
        created_at: A timestamp of when the error occurred.
    """

    error: Exception
    error_id: str
    created_at: datetime


@dataclass(frozen=True)
class CommandUpdatedAction:
    """Update a given command."""

    command: Command


@dataclass(frozen=True)
class CommandFailedAction:
    """Update a given command to "failed"."""

    command_id: str
    completed_at: datetime
    error: Exception
    error_id: str


Action = Union[
    PlayAction,
    PauseAction,
    StopAction,
    CommandUpdatedAction,
    CommandFailedAction,
]
