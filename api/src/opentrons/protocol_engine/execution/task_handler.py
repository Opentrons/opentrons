"""Task handling."""


import logging
from typing import Coroutine
from ..state.state import StateStore
from ..resources import ModelUtils
from ..types import Task
import asyncio

log = logging.getLogger(__name__)


class TaskHandler:
    """Implementation logic for fask concurrency."""

    _state_store: StateStore
    _model_utils: ModelUtils

    def __init__(
        self, state_store: StateStore, model_utils: ModelUtils | None = None
    ) -> None:
        """Initialize a TaskHandler instance."""
        self._state_store = state_store
        self._model_utils = model_utils if model_utils is not None else ModelUtils()

    async def create_task(
        self, task_code: Coroutine[None, None, None], id: str | None = None
    ) -> Task:
        """Create a task and immediately schedules it."""
        task_id = self._model_utils.ensure_id(id)
        asyncio_task = asyncio.create_task(task_code, name=f"engine-task-{task_id}")
        return Task(
            id=task_id,
            createdAt=self._model_utils.get_timestamp(),
            asyncioTask=asyncio_task,
            finishedAt=None,
            error=None,
        )
