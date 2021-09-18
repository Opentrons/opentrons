"""Asynchronous task queue to accomplish a protocol run."""
import asyncio
from enum import Enum
from typing import Any, Awaitable, Callable, Dict, NamedTuple, Optional, Tuple


class TaskQueuePhase(str, Enum):
    """Phase in which to run a given task."""

    RUN = "run"
    CLEANUP = "cleanup"


class TaskQueueEntry(NamedTuple):
    """An entry in the task queue."""

    func: Callable[..., Awaitable[Any]]
    args: Tuple[Any, ...]
    kwargs: Dict[str, Any]


class TaskQueue:
    """A queue of async tasks to run.

    Once started, a TaskQueue may not be re-used.
    """

    def __init__(self) -> None:
        """Initialize the TaskQueue."""
        self._run_entry: Optional[TaskQueueEntry] = None
        self._cleanup_entry: Optional[TaskQueueEntry] = None
        self._run_task: Optional["asyncio.Task[None]"] = None
        self._run_started_event: asyncio.Event = asyncio.Event()

    def add(
        self,
        phase: TaskQueuePhase,
        func: Callable[..., Awaitable[Any]],
        *args: Any,
        **kwargs: Any,
    ) -> None:
        """Add a task to the queue.

        Two phases are available: TaskQueuePhase.RUN and TaskQueuePhase.CLEANUP.
        Each phase may contain no tasks or one task. The RUN task will be run first,
        if present, and the CLEANUP task will run second. The CLEANUP task will run
        regardless of the success or failure of the RUN task.
        """
        entry = TaskQueueEntry(func=func, args=args, kwargs=kwargs)

        if phase == TaskQueuePhase.RUN:
            self._run_entry = entry
        else:
            self._cleanup_entry = entry

    def is_started(self) -> bool:
        """Get whether the task queue has started running."""
        return self._run_task is not None

    def start(self) -> None:
        """Start running tasks in the queue."""
        self._run_task = asyncio.create_task(self._run())
        self._run_started_event.set()

    async def join(self) -> None:
        """Wait for the background run task to complete, propagating errors."""
        await self._run_started_event.wait()

        if self._run_task:
            await self._run_task

    async def _run(self) -> None:
        run_entry = self._run_entry
        cleanup_entry = self._cleanup_entry

        try:
            await self._run_task_entry(run_entry)
        finally:
            await self._run_task_entry(cleanup_entry)

    @staticmethod
    async def _run_task_entry(entry: Optional[TaskQueueEntry]) -> None:
        if entry:
            await entry.func(*entry.args, **entry.kwargs)
