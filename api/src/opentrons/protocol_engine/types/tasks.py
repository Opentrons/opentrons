"""Types for Tasks."""
from datetime import datetime
from opentrons.protocol_engine.errors import ErrorOccurrence
from dataclasses import dataclass
import asyncio


@dataclass
class Task:
    """A task representation."""

    id: str
    createdAt: datetime
    asyncioTask: asyncio.Task[None]
    finishedAt: datetime | None
    error: ErrorOccurrence | None


@dataclass
class TaskSummary:
    """A summary of a task."""

    id: str
    createdAt: datetime
    finishedAt: datetime | None
    error: ErrorOccurrence | None
