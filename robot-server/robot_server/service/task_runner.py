"""

The task runner refactor is now using anyio instead of fastapi.BackgroundTasks.
Testing will be similar to the previous code base primarily integration and end-to-end tests.
"""

from __future__ import annotations
import asyncio
from hashlib import new
from logging import getLogger
from typing import Any, Awaitable, Callable, Set
from fastapi import Depends
from robot_server.app_state import AppState, AppStateValue, get_app_state

log = getLogger(__name__)

TaskFunc = Callable[..., Awaitable[Any]]

_init_taskrunner = AppStateValue["TaskRunner"]("bg_task_runner")


class TaskRunner:
    def __init__(self) -> None:
        """Initialize the TaskRunner by using Python Set"""

        self._running_tasks: Set[asyncio.Task[None]] = set()
        # set of background tasks

    def run(self, func: TaskFunc, **kwargs: Any) -> None:
        """Run an async function in the background.

        Will log when the function completes, including any error
        that may occur.

        Arguments:
            func: An async, None-returning function to run in the background.
            Use **kwargs to pass to func.
        """
        func_name = func.__qualname__

        async def wrapper() -> None:
            # Add the previous logic back
            current_task = asyncio.current_task()
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
        for task in self._running_tasks:
            task.cancel()
        await asyncio.gather(*self._running_tasks, return_exceptions=True)


def initialize_task_runner(app_state: AppState) -> None:
    """Create a new `TaskRunner` and store it on `app_state`."""
    _init_taskrunner.set_on(app_state, TaskRunner())


async def clean_up_task_runner(app_state: AppState) -> None:
    """Clean up the `TaskRunner` stored on `app_state`."""
    task_runner = _init_taskrunner.get_from(app_state)

    if task_runner is not None:
        await task_runner.cancel_all_and_clean_up()


# The get_task_runner method is for the HTTP endpoint functions that need a TaskRunner instance.
def get_task_runner(app_state: AppState = Depends(get_app_state)) -> TaskRunner:
    new_task_runner = _init_taskrunner.get_from(app_state)
    assert new_task_runner, "Task runner was not initialized"
    return new_task_runner
