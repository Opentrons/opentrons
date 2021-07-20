"""Command queue execution worker module."""
# TODO(mc, 2021-07-20): the command executor itself will need to be able to signal
# the queue to start/stop during protocol pause/resume commands. Factor flow control
# signaling out of the queue worker and into a common dependency.
#
# A good candidate for this might be the command state, which could lean more heavily on
# the "return None if execution should pause" logic, because the handling of a protocol
# pause command could set a pause flagged in command state.
#
# It also might make sense to move the concept of non-command actions into the
# ProtocolEngine core, as well, to use those same state mechanisms and move statefulness
# out of this QueueWorker.
import asyncio
from typing import Optional

from ..state import StateStore
from .command_executor import CommandExecutor


class QueueWorker:
    """Handle and track execution of commands queued in ProtocolEngine state."""

    _state_store: StateStore
    _command_executor: CommandExecutor
    _current_task: Optional[asyncio.Task]
    _ok_to_run: asyncio.Event
    _done_signal: asyncio.Future

    def __init__(
        self,
        state_store: StateStore,
        command_executor: CommandExecutor,
    ) -> None:
        """Initialize the queue worker's dependencies and state."""
        self._state_store = state_store
        self._command_executor = command_executor
        self._current_task = None
        self._ok_to_run = asyncio.Event()
        self._done_signal = asyncio.get_running_loop().create_future()

    def start(self) -> None:
        """Start executing commands in the queue."""
        self._ok_to_run.set()

        if self._current_task is None:
            if self._done_signal.done():
                self._done_signal = asyncio.get_running_loop().create_future()

            self._schedule_next_command()

    def stop(self) -> None:
        """Stop executing commands in the queue."""
        self._ok_to_run.clear()

    async def wait_for_running(self) -> None:
        """Wait for the queue worker to be ready to execute new commands."""
        await self._ok_to_run.wait()

    async def wait_for_done(self) -> None:
        """Wait for the queue worker to be done.

        The worker is "done" when there is no command currently executing and
        no future commands will be executed.

        This method should not raise, but if any unexepected exceptions
        happen during command execution that are not properly caught by
        the CommandExecutor, they will be raised here.
        """
        await self._done_signal

    def _schedule_next_command(self, prev_task: Optional[asyncio.Task] = None) -> None:
        prev_exc = prev_task.exception() if prev_task is not None else None

        self._current_task = None

        if not self._done_signal.done():
            if prev_exc:
                self._done_signal.set_exception(prev_exc)
            elif self._ok_to_run.is_set():
                next_command_id = self._state_store.commands.get_next_queued()

                if next_command_id:
                    self._run_command(next_command_id)
                else:
                    self._done_signal.set_result(None)

    def _run_command(self, command_id: str) -> None:
        exec_coro = self._command_executor.execute(command_id=command_id)
        self._current_task = asyncio.create_task(exec_coro)
        self._current_task.add_done_callback(self._schedule_next_command)
