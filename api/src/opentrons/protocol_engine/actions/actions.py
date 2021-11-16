"""State store actions.

Actions can be passed to the ActionDispatcher, where they will trigger
reactions in objects that subscribe to the pipeline, like the StateStore.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Union

from ..commands import Command, CommandCreate
from ..types import LabwareOffsetCreate


@dataclass(frozen=True)
class PlayAction:
    """Start or resume processing commands in the engine."""


@dataclass(frozen=True)
class PauseAction:
    """Pause processing commands in the engine."""


@dataclass(frozen=True)
class StopAction:
    """Stop processing commands in the engine, marking the engine status as done."""

    error: Optional[Exception] = None


@dataclass(frozen=True)
class QueueCommandAction:
    """Add a command request to the queue."""

    command_id: str
    created_at: datetime
    request: CommandCreate


@dataclass(frozen=True)
class UpdateCommandAction:
    """Update a given command."""

    command: Command


@dataclass(frozen=True)
class AddLabwareOffsetAction:
    """Add a new labware offset, to apply to subsequent `LoadLabwareCommand`s."""

    labware_offset_id: str
    created_at: datetime
    request: LabwareOffsetCreate


Action = Union[
    PlayAction,
    PauseAction,
    StopAction,
    QueueCommandAction,
    UpdateCommandAction,
    AddLabwareOffsetAction,
]
