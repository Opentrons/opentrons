"""Asynchronous task queue to accomplish a protocol run."""
import asyncio
import logging
from typing import Any, Awaitable, Callable, Optional, ParamSpec, Concatenate

log = logging.getLogger(__name__)

CleanupFuncInput = ParamSpec("CleanupFuncInput")
RunFuncInput = ParamSpec("RunFuncInput")


class TaskQueue:
    """A queue of async tasks to run.

    Once started, a TaskQueue may not be re-used.
    """

    def __init__(
        self,
        # cleanup_func: CleanupFunc,
    ) -> None:
        """Initialize the TaskQueue."""
        self._cleanup_func: Optional[
            Callable[[Optional[Exception]], Awaitable[Any]]
        ] = None

        self._run_func: Optional[Callable[[], Any]] = None
        self._run_task: Optional["asyncio.Task[None]"] = None
        self._ok_to_join_event: asyncio.Event = asyncio.Event()

    def set_cleanup_func(
        self,
        func: Callable[
            Concatenate[Optional[Exception], CleanupFuncInput], Awaitable[Any]
        ],
        *args: CleanupFuncInput.args,
        **kwargs: CleanupFuncInput.kwargs,
    ) -> None:
        """Add the protocol cleanup task to the queue.

        The "cleanup" task will be run after the "run" task.
        """

        async def _do_cleanup(error: Optional[Exception]) -> None:
            await func(error, *args, **kwargs)

        self._cleanup_func = _do_cleanup

    def set_run_func(
        self,
        func: Callable[RunFuncInput, Awaitable[Any]],
        *args: RunFuncInput.args,
        **kwargs: RunFuncInput.kwargs,
    ) -> None:
        """Add the protocol run task to the queue.

        The "run" task will be run first, before the "cleanup" task.
        """

        async def _do_run() -> None:
            await func(*args, **kwargs)

        self._run_func = _do_run

    def start(self) -> None:
        """Start running tasks in the queue."""
        self._ok_to_join_event.set()

        if self._run_task is None:
            self._run_task = asyncio.create_task(self._run())

    async def join(self) -> None:
        """Wait for the background run task to complete, propagating errors."""
        await self._ok_to_join_event.wait()

        if self._run_task:
            await self._run_task

    async def _run(self) -> None:
        error = None

        try:
            if self._run_func is not None:
                await self._run_func()
        except Exception as e:
            log.exception("Exception raised by protocol")
            error = e

        if self._cleanup_func is not None:
            await self._cleanup_func(error)
