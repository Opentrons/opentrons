"""Background task runner.

This module is mostly a thin wrapper around fastapi.BackgroundTasks
that adds logging. It should be tested primarily through integration
and end-to-end tests.
"""
from fastapi import BackgroundTasks
from logging import getLogger
from typing import Any, Awaitable, Callable, List, Optional

log = getLogger(__name__)

TaskFunc = Callable[..., Awaitable[Any]]
# TODO (tz, 2022-04-29): Should I declare this or should I make the other method async?
TaskFuncAll = Callable[..., Any]


class TaskRunner:
    def __init__(self, background_tasks: BackgroundTasks) -> None:
        """Initialize the TaskRunner.

        Add to any route handler with `FastAPI.Depends`. Based on FastAPI and
        Starlett's background task system, which means background tasks
        for a given request will run serially, not concurrently.

        Arguments:
            background_tasks: FastAPI's background task system, fed in
                automatically by FastAPI's dependency injection system.
        """
        self._background_tasks = background_tasks

    def run(self, func: TaskFunc, **kwargs: Any) -> None:
        """Run an async function in the background.

        Will log when the function completes, including any error
        that may occur.

        Arguments:
            func: An async, None-returning function to run in the background.
            Use kwargs to add arguments if required.
        """
        func_name = func.__qualname__

        async def _run_async_task() -> None:
            try:
                await func(**kwargs)
                log.debug(f"Background task {func_name} succeeded")
            except Exception as e:
                log.warning(f"Background task {func_name} failed", exc_info=e)

        self._background_tasks.add_task(_run_async_task)

    def run_waterfall(self, func_list: List[TaskFuncAll]) -> None:
        """Run a list of functions in the background.

        Will log when the function completes, including any error
        that may occur.

        Arguments:
            func_list: function list to run in the background.
        """

        async def _run_async_task() -> None:
            response: Optional[str] = None
            for func in func_list:
                func_name = func.__qualname__
                if response is None:
                    try:
                        response = await func()
                    except Exception as e:
                        log.warning(f"Background task {func_name} failed", exc_info=e)
                else:
                    func(response)
                    log.debug(f"Background task {func_name} succeeded")
                    response = None

        self._background_tasks.add_task(_run_async_task)
