"""Task handling."""

from __future__ import annotations
import logging
from typing import Protocol, AsyncIterator
from ..state.state import StateStore
from ..resources import ModelUtils
from ..types import Task
import asyncio
import contextlib


log = logging.getLogger(__name__)


class TaskFunction(Protocol):
    """The function run inside a task protocol."""

    async def __call__(self, task_handler: TaskHandler) -> None:
        """The function called inside a task."""
        ...


class TaskHandler:
    """Implementation logic for fast concurrency."""

    _state_store: StateStore
    _model_utils: ModelUtils

    def __init__(
        self, state_store: StateStore, model_utils: ModelUtils | None = None
    ) -> None:
        """Initialize a TaskHandler instance."""
        self._state_store = state_store
        self._model_utils = model_utils if model_utils is not None else ModelUtils()

    async def create_task(self, task_code: TaskFunction, id: str | None = None) -> Task:
        """Create a task and immediately schedules it."""
        task_id = self._model_utils.ensure_id(id)
        asyncio_task = asyncio.create_task(
            task_code(task_handler=self), name=f"engine-task-{task_id}"
        )
        return Task(
            id=task_id,
            createdAt=self._model_utils.get_timestamp(),
            asyncioTask=asyncio_task,
            finishedAt=None,
            error=None,
        )

    @contextlib.asynccontextmanager
    async def synchronize_cancel_latest(self, id: str) -> AsyncIterator[None]:
        """Cancel current task."""
        yield

    @contextlib.asynccontextmanager
    async def synchronize_cancel_previous(self, id: str) -> AsyncIterator[None]:
        """Cancel previous run."""
        yield

    @contextlib.asynccontextmanager
    async def synchronize_sequential(self, id: str) -> AsyncIterator[None]:
        """Run tasks one after the other."""
        yield

    @contextlib.asynccontextmanager
    async def synchronize_concurrent(self, id: str) -> AsyncIterator[None]:
        """Run a list of tasks at the same time."""
        yield
