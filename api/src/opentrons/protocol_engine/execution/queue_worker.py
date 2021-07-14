"""Command queue execution worker module."""
import asyncio
from typing import Optional

from ..state import StateStore
from .command_executor import CommandExecutor


class QueueWorker:
    """Handle and track execution of commands queued in ProtocolEngine state."""

    _state_store: StateStore
    _command_executor: CommandExecutor
    _is_running: bool
    _idle_signal: asyncio.Future

    def __init__(
        self,
        state_store: StateStore,
        command_executor: CommandExecutor,
    ) -> None:
        """Initialize the queue worker's dependencies and state."""
        self._state_store = state_store
        self._command_executor = command_executor
        self._is_running = False
        self._current_task: Optional[asyncio.Task] = None
        self._idle_signal = asyncio.get_running_loop().create_future()

    @property
    def is_running(self) -> bool:
        """Get whether or not the worker is currently pulling jobs."""
        return self._is_running

    def start(self) -> None:
        """Start executing commands in the queue."""
        if self._idle_signal.done():
            self._idle_signal = asyncio.get_running_loop().create_future()

        self._is_running = True
        self._schedule_next_command()

    def stop(self) -> None:
        """Stop executing commands in the queue."""
        self._is_running = False

    async def wait_for_idle(self) -> None:
        """Wait for the queue worker to be idle and ready to accept new commands.

        The worker is "idle" when:

        - There is no command currently executing
        - The worker is _not_ currently stopped

        This method should not raise, but if any unexepected exceptions
        happen during command execution that are not properly caught by
        the CommandExecutor, this is where they will be raised.
        """
        await self._idle_signal

    def _schedule_next_command(self, prev_task: Optional[asyncio.Task] = None) -> None:
        next_command_id = self._state_store.state_view.commands.get_next_queued()
        prev_exc = prev_task.exception() if prev_task is not None else None

        self._current_task = None

        if not self._idle_signal.done():
            if prev_exc:
                self._is_running = False
                self._idle_signal.set_exception(prev_exc)
            elif next_command_id is None:
                self._is_running = False
                self._idle_signal.set_result(None)
            elif self._is_running is True:
                self._run_command(next_command_id)

    def _run_command(self, command_id: str) -> None:
        exec_coro = self._command_executor.execute_by_id(command_id)
        self._current_task = asyncio.create_task(exec_coro)
        self._current_task.add_done_callback(self._schedule_next_command)
