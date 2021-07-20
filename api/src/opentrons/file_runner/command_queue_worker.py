"""Execution of queued commands in a ProtocolEngine's state."""
# TODO(mc, 2021-07-06): move to ProtocolEngine core
import asyncio
from typing import Optional

from opentrons.protocol_engine import ProtocolEngine


class CommandQueueWorker:
    """Execute a `ProtocolEngine`'s queued commands in the background."""

    def __init__(self, engine: ProtocolEngine) -> None:
        """Construct a CommandQueueWorker.

        Args:
            engine: The ProtocolEngine instance to run commands on.
        """
        self._engine = engine
        self._keep_running = False
        self._current_task: Optional[asyncio.Task] = None
        self._done_signal: asyncio.Future = asyncio.get_running_loop().create_future()

    def play(self) -> None:
        """Start or resume executing the `ProtocolEngine`'s queued commands.

        This method returns immediately. Commands will be executed sequentially
        in the background via event loop tasks. If commands are already
        executing, this method will no-op.

        See `wait_for_done` for when execution may stop.
        """
        self._keep_running = True
        if self._current_task is None:
            self._schedule_next_command()

    def pause(self) -> None:
        """Pause execution of queued commands.

        This will return immediately, but if a command is currently in the middle of
        executing, it will continue until it's done. Further commands will be left
        unexecuted in the queue.
        """
        self._keep_running = False

    async def wait_for_done(self) -> None:
        """Wait until all queued commands have finished executing.

        This means:

        * No command is currently executing on the `ProtocolEngine`.
        * No commands are left in the `ProtocolEngine`'s queue.

        If an unexpected exception is raised while executing commands,
        it will be raised from this call. When you're finished with a
        `CommandQueueWorker`, you should call this method to clean up and
        propagate errors.
        """
        await self._done_signal

    def _schedule_next_command(self, prev_task: Optional[asyncio.Task] = None) -> None:
        next_command_id = self._engine.state_view.commands.get_next_queued()
        prev_exc = prev_task.exception() if prev_task is not None else None

        self._current_task = None

        if not self._done_signal.done():
            if prev_exc:
                self._done_signal.set_exception(prev_exc)
            elif next_command_id is None:
                self._done_signal.set_result(None)
            elif self._keep_running is True:
                self._run_command(next_command_id)

    def _run_command(self, command_id: str) -> None:
        exec_coro = self._engine.execute_command_by_id(command_id=command_id)
        self._current_task = asyncio.create_task(exec_coro)
        self._current_task.add_done_callback(self._schedule_next_command)
