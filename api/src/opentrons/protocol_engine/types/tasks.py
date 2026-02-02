"""Types for Tasks."""

import asyncio
from dataclasses import dataclass
from datetime import datetime

from opentrons.protocol_engine.errors import ErrorOccurrence


@dataclass
class _BaseTask:
    """A base task representation."""

    id: str
    createdAt: datetime


@dataclass
class Task(_BaseTask):
    """A task representation."""

    asyncioTask: asyncio.Task[None]


@dataclass
class FinishedTask(_BaseTask):
    """A finished task representation."""

    finishedAt: datetime
    error: ErrorOccurrence | None


@dataclass
class TaskSummary:
    """Task info for use in summary lists."""

    id: str
    createdAt: datetime
    finishedAt: datetime | None = None
    error: ErrorOccurrence | None = None
