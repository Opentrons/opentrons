"""
    This module is mostly a thin wrapper around fastapi.BackgroundTasks
    that adds logging. It should be tested primarily through integration
    and end-to-end tests.
"""

from __future__ import annotations
import asyncio
from logging import getLogger
from typing import Any, Awaitable, Callable, Set
from fastapi import Depends
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

log = getLogger(__name__)

TaskFunc = Callable[..., Awaitable[Any]]

_task_runner_accessor = AppStateAccessor["TaskRunner"]("task_runner")


class TaskRunner:
    def __init__(self) -> None:
        """Initialize the TaskRunner"""

        self._running_tasks: Set[asyncio.Task[None]] = set()

    def run(self, func: TaskFunc, **kwargs: Any) -> None:
        """Run an async function in the background.

        Will log when the function completes, including any error
        that may occur.

        Arguments:
            func: An async, None-returning function to run in the background.
            Kwargs: Keyword arguments to pass straight through to `func`.
        """
        func_name = func.__qualname__

        async def wrapper() -> None:
            current_task = asyncio.current_task()
            assert current_task is not None
            try:
                await func(**kwargs)
                log.debug(f"Background task {func_name} succeeded")
            except Exception as e:
                log.warning(f"Background task {func_name} failed", exc_info=e)
            finally:
                self._running_tasks.remove(current_task)

        wrapper_task = asyncio.create_task(wrapper())
        self._running_tasks.add(wrapper_task)

    async def cancel_all_and_clean_up(self) -> None:
        """Cancel any ongoing background tasks and wait for them to stop.

        Intended to be called just once, when the server shuts down.
        """
        for task in self._running_tasks:
            task.cancel()
        await asyncio.gather(*self._running_tasks, return_exceptions=True)
        log.debug(
            f"Cancelled {len(self._running_tasks)} background tasks."
            f" Waiting for them to stop."
        )
        await asyncio.gather(*self._running_tasks, return_exceptions=True)
        log.debug("Background tasks stopped.")


def initialize_task_runner(app_state: AppState) -> None:
    """Create a new `TaskRunner` and store it on `app_state`

    Intended to be called just once, when the server starts up.
    """
    _task_runner_accessor.set_on(app_state, TaskRunner())


async def clean_up_task_runner(app_state: AppState) -> None:
    """Clean up the `TaskRunner` stored on `app_state`.

    Intended to be called just once, when the server shuts down.
    """
    task_runner = _task_runner_accessor.get_from(app_state)

    if task_runner is not None:
        await task_runner.cancel_all_and_clean_up()


def get_task_runner(app_state: AppState = Depends(get_app_state)) -> TaskRunner:
    """Intended to be used by endpoint functions as a FastAPI dependency,
    like `task_runner = fastapi.Depends(get_task_runner)`.
    """
    task_runner = _task_runner_accessor.get_from(app_state)
    assert task_runner, "Task runner was not initialized"
    return task_runner
