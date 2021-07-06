"""Background task management.

This mosule is mostly a thin wrapper around fastapi.BackgroundTasks
that adds logging. It should be tested primarly through integration
and end-to-end tests.
"""
from asyncio import iscoroutinefunction
from fastapi import BackgroundTasks
from logging import getLogger
from typing import Awaitable, Callable, Union

log = getLogger(__name__)


TaskFunc = Union[
    Callable[[], Awaitable[None]],
    Callable[[], None],
]


class TaskRunner:
    def __init__(self, background_tasks: BackgroundTasks) -> None:
        """Initialize the TaskRunner.

        Add to any route handler with `FastAPI.Depends`/

        Arguments:
            background_tasks: FastAPI's background task system, fed in
                automatically by FastAPI's dependency injection system.
        """
        self._background_tasks = background_tasks

    def run(self, func: TaskFunc) -> None:
        """Run a function in the background.

        Will log when the function completes, including any error
        that may occur.

        Arguments:
            func: A argumentless, None-returing function to run the in
                the background. Use functools.partial to add arguments,
                if required.
        """
        func_name = func.__name__

        async def _run_async_task() -> None:
            try:
                await func()  # type: ignore[misc]
                log.debug(f"Backgound task {func_name} succeeded")
            except Exception as e:
                log.warning(f"Backgound task {func_name} failed", exc_info=e)

        def _run_sync_task() -> None:
            try:
                func()
                log.debug(f"Backgound task {func_name} succeeded")
            except Exception as e:
                log.warning(f"Backgound task {func_name} failed", exc_info=e)

        # NOTE: FastAPI will run async background tasks differently than
        # sync background tasks (a threadpool is involved). Ensure we
        # maintain the asynchronicity of the original function
        if iscoroutinefunction(func):
            self._background_tasks.add_task(_run_async_task)
        else:
            self._background_tasks.add_task(_run_sync_task)
