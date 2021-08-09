"""Background task runner.

This module is mostly a thin wrapper around fastapi.BackgroundTasks
that adds logging. It should be tested primarily through integration
and end-to-end tests.
"""
import asyncio
import logging
from fastapi import BackgroundTasks
from typing import Any, Awaitable, Callable

log = logging.getLogger(__name__)


TaskFunc = Callable[..., Awaitable[None]]


class TaskRunner:
    def __init__(self, background_tasks: BackgroundTasks) -> None:
        """Initialize the TaskRunner.

        Add to any route handler with `FastAPI.Depends`.

        Arguments:
            background_tasks: FastAPI's background task system, fed in
                automatically by FastAPI's dependency injection system.
        """
        self._background_tasks = background_tasks

    def run(
        self,
        func: TaskFunc,
        *args: Any,
        **kwargs: Any,
    ) -> None:
        """Run an async function in the background.

        Will log when the function completes, including any error
        that may occur.

        Arguments:
            func: An async, argumentless, None-returning function to run
                in the background. Use functools.partial to add arguments,
                if required.
            *args: Positional arguments to pass to the function.
            **kwargs: Keyword arguments to pass to the function.
        """
        func_name = func.__qualname__

        log.info(f"HEY: running {func_name}")

        async def _run_async_task() -> None:
            try:
                await func(*args, **kwargs)
                log.debug(f"Background task {func_name} succeeded")
            except asyncio.CancelledError:
                log.info(f"Background task {func_name} cancelled")
            except Exception as e:
                log.warning(f"Background task {func_name} failed", exc_info=e)

        self._background_tasks.add_task(_run_async_task)
