"""Task handling."""

from __future__ import annotations

import asyncio
import contextlib
import logging
from typing import AsyncIterator, Protocol

from opentrons_shared_data.errors.exceptions import EnumeratedError, PythonException

from ..actions import ActionDispatcher, FinishTaskAction, StartTaskAction
from ..errors import ErrorOccurrence
from ..resources import ConcurrencyProvider, ModelUtils
from ..state.state import StateStore
from ..types import Task

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
    _concurrency_provider: ConcurrencyProvider

    def __init__(
        self,
        state_store: StateStore,
        action_dispatcher: ActionDispatcher,
        model_utils: ModelUtils | None = None,
        concurrency_provider: ConcurrencyProvider | None = None,
    ) -> None:
        """Initialize a TaskHandler instance."""
        self._state_store = state_store
        self._model_utils = model_utils or ModelUtils()
        self._concurrency_provider = concurrency_provider or ConcurrencyProvider()
        self._action_dispatcher = action_dispatcher

    async def create_task(
        self, task_function: TaskFunction, id: str | None = None
    ) -> Task:
        """Create a task and immediately schedules it."""
        task_id = self._model_utils.ensure_id(id)
        asyncio_task = asyncio.create_task(
            task_function(task_handler=self), name=f"engine-task-{task_id}"
        )

        def _done_callback(task: asyncio.Task[None]) -> None:
            try:
                maybe_exception = task.exception()
            except asyncio.CancelledError as e:
                maybe_exception = e
            if isinstance(maybe_exception, EnumeratedError):
                occurence: ErrorOccurrence | None = ErrorOccurrence.from_failed(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    error=maybe_exception,
                )
            elif isinstance(maybe_exception, BaseException):
                occurence = ErrorOccurrence.from_failed(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    error=PythonException(maybe_exception),
                )
            else:
                occurence = None
            try:
                self._action_dispatcher.dispatch(
                    FinishTaskAction(
                        task_id=task_id,
                        finished_at=self._model_utils.get_timestamp(),
                        error=occurence,
                    ),
                )
            except BaseException:
                log.exception("Exception in task finish dispatch.")

        asyncio_task.add_done_callback(_done_callback)
        task = Task(
            id=task_id,
            createdAt=self._model_utils.get_timestamp(),
            asyncioTask=asyncio_task,
        )
        self._action_dispatcher.dispatch(StartTaskAction(task))
        return task

    @staticmethod
    def _empty_queue(
        queue: "asyncio.Queue[asyncio.Task[None]]", this_task: asyncio.Task[None]
    ) -> None:
        """Empties the queue."""
        try:
            while True:
                task = queue.get_nowait()
                if task is this_task:
                    break
        except asyncio.QueueEmpty:
            pass

    @contextlib.asynccontextmanager
    async def synchronize_cancel_latest(self, group_id: str) -> AsyncIterator[None]:
        """Cancel current task."""
        lock = self._concurrency_provider.lock_for_group(group_id)
        if lock.locked():
            raise asyncio.CancelledError()
        async with lock:
            yield

    @contextlib.asynccontextmanager
    async def synchronize_cancel_previous(self, group_id: str) -> AsyncIterator[None]:
        """Cancel previous run."""
        queue = self._concurrency_provider.queue_for_group(group_id)
        while not queue.empty():
            task = queue.get_nowait()
            task.cancel()
        this_task = asyncio.current_task()
        assert this_task is not None
        queue.put_nowait(this_task)
        try:
            yield
        except asyncio.CancelledError:
            raise
        except BaseException:
            self._empty_queue(queue, this_task)
            raise
        else:
            self._empty_queue(queue, this_task)

    @contextlib.asynccontextmanager
    async def synchronize_sequential(self, group_id: str) -> AsyncIterator[None]:
        """Run tasks one after the other."""
        lock = self._concurrency_provider.lock_for_group(group_id)
        async with lock:
            yield

    @contextlib.asynccontextmanager
    async def synchronize_concurrent(self, group_id: str) -> AsyncIterator[None]:
        """Run a list of tasks at the same time."""
        yield

    def cancel_all(self, message: str | None = None) -> None:
        """Cancel all asyncio tasks immediately.

        Do not call this more than once synchronously because
        that could lead to tasks cancelling more than once.
        It can be called if there are no current tasks. In that case
        nothing will happen.
        """
        for task in self._state_store.tasks.get_all_current():
            task.asyncioTask.cancel(msg=message)
