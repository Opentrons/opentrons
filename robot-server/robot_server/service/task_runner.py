"""

The task runner refactor is now using anyio instead of fastapi.BackgroundTasks.
Testing will be similar to the previous code base primarily integration and end-to-end tests.
"""

from __future__ import annotations
import asyncio
from logging import getLogger
from typing import Any, Awaitable, Callable, Set
from fastapi import Depends
from robot_server.app_state import AppState, AppStateValue, get_app_state


log = getLogger(__name__)

TaskFunc = Callable[..., Awaitable[Any]]

_init_taskrunner = AppStateValue["asyncio.Task[None]"]("bg_task_runner")


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

        new_ct = asyncio.create_task(func(**kwargs))
        # Create Tasks running in the background
        self._running_tasks.add(new_ct)
        asyncio.current_task()
        self._running_tasks.remove(new_ct)

        async def initialize_task_runner_tasks(app_state: AppState) -> None:
            """Create a new `TaskRunner` and store it on `app_state`."""
            initialize_taskrunner = _init_taskrunner.get_from(app_state)

            if initialize_taskrunner is None:
                initialize_taskrunner = asyncio.create_task(func(**kwargs))
                _init_taskrunner.set_on(app_state, initialize_taskrunner)

        async def clean_up_task_runner(app_state: AppState) -> None:
            """Clean up the `TaskRunner` stored on `app_state`."""
            initialize_task = _init_taskrunner.get_from(app_state)

            _init_taskrunner.set_on(app_state, None)

            if initialize_task is not None:
                initialize_task.cancel()
                await asyncio.gather(initialize_task, return_exceptions=True)

            for task in self._running_tasks:
                task.cancel()
            try:
                await asyncio.gather(*self._running_tasks, return_exceptions=True)
                log.debug(f"Background task {func_name} succeeded")
            except Exception as e:
                log.warning(f"Background task {func_name} failed", exc_info=e)


# The get_task_runner method is for the HTTP endpoint functions that need a TaskRunner instance.
def get_task_runner(app_state: AppState = Depends(get_app_state)) -> TaskRunner:
    return app_state.task_runner
