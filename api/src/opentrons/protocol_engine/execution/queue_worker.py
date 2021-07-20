"""Command queue execution worker module."""
import asyncio
from enum import Enum
from typing import Optional

from ..state import StateStore
from .command_executor import CommandExecutor


class QueueBehavior(str, Enum):
    """Queue handling behavior.

    Properties:
        RUN: Run all jobs in the queue to completion.
        STEP: Run a single job.
    """

    RUN = "run"
    STEP = "step"


class QueueWorker:
    """Handle and track execution of commands queued in ProtocolEngine state."""

    _state_store: StateStore
    _command_executor: CommandExecutor
    _is_running: bool
    _current_task: Optional[asyncio.Task]
    _behavior: QueueBehavior
    _ok_to_run: asyncio.Event
    _idle: asyncio.Future

    def __init__(
        self,
        state_store: StateStore,
        command_executor: CommandExecutor,
    ) -> None:
        """Initialize the queue worker's dependencies and state."""
        self._state_store = state_store
        self._command_executor = command_executor
        self._current_task = None
        self._behavior = QueueBehavior.RUN
        self._ok_to_run = asyncio.Event()
        self._idle_signal = asyncio.get_running_loop().create_future()

        self._ok_to_run.set()

    def start(self) -> None:
        """Start executing commands in the queue."""
        self._ok_to_run.set()

        if self._current_task is None:
            if self._idle_signal.done():
                self._idle_signal = asyncio.get_running_loop().create_future()

            self._schedule_next_command()

    def stop(self) -> None:
        """Stop executing commands in the queue."""
        self._ok_to_run.clear()

    async def step(self) -> None:
        """Execute exactly one queued command and then stop.

        - If there is a command in progress, wait for it to complete before stepping.
        - If the worker is stopped, wait for it to start before stepping.
        """
        if self._current_task is not None:
            await self._current_task

        await self._ok_to_run.wait()
        self._behavior = QueueBehavior.STEP
        self.start()
        await self._idle_signal

    async def wait_for_idle(self) -> None:
        """Wait for the queue worker to be idle and ready to accept new commands.

        The worker is "idle" when there is no command currently executing.

        This method should not raise, but if any unexepected exceptions
        happen during command execution that are not properly caught by
        the CommandExecutor, they will be raised here.
        """
        await self._idle_signal

    def _schedule_next_command(self, prev_task: Optional[asyncio.Task] = None) -> None:
        self._current_task = None

        prev_exc = prev_task.exception() if prev_task is not None else None
        next_command_id = (
            self._state_store.state_view.commands.get_next_queued()
            if self._behavior == QueueBehavior.RUN or prev_task is None
            else None
        )

        if not self._idle_signal.done():
            if prev_exc:
                self._behavior = QueueBehavior.RUN
                self._idle_signal.set_exception(prev_exc)
            elif next_command_id is None or not self._ok_to_run.is_set():
                self._behavior = QueueBehavior.RUN
                self._idle_signal.set_result(None)
            elif next_command_id:
                self._run_command(next_command_id)

    def _run_command(self, command_id: str) -> None:
        exec_coro = self._command_executor.execute(command_id=command_id)
        self._current_task = asyncio.create_task(exec_coro)
        self._current_task.add_done_callback(self._schedule_next_command)
