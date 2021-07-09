"""Execution of queued commands in a ProtocolEngine's state."""
# TODO(mc, 2021-07-06): move to ProtocolEngine core
import asyncio
from typing import Optional

from opentrons.protocol_engine import ProtocolEngine


class CommandQueueWorker:
    """Execute a `ProtocolEngine`'s queued commands in the background."""

    def __init__(self, loop: asyncio.AbstractEventLoop, engine: ProtocolEngine) -> None:
        """Construct a CommandQueueWorker.

        Args:
            loop: The EventLoop in which commands will be executed.
            engine: The ProtocolEngine instance to run commands on.
        """
        self._engine = engine
        self._done_signal: asyncio.Future = loop.create_future()
        self._running = False
        self._current_task: Optional[asyncio.Task] = None

    def play(self) -> None:
        """Start executing the `ProtocolEngine`'s queued commands.

        This method returns immediately. Commands will be executed sequentially
        in the background via event loop tasks.

        See `wait_for_done` for when execution may stop.
        """
        self._running = True
        self._schedule_next_command()

    def pause(self) -> None:
        """Pause execution of queued commands.

        This will return immediately, but if a command is currently in the middle of
        executing, it will continue until it's done. Further commands will be left
        unexecuted in the queue.
        """
        self._running = False

    async def wait_for_done(self) -> None:
        """Wait until all queued commands have finished executing.

        This means:

        * No command is currently executing on the `ProtocolEngine`.
        * No commands are left in the `ProtocolEngine`'s queue.

        If an unexpected exception is raised while executing commands,
        it will be raised from this call. When you're finished with a
        `CommandQueueWorker`, you should call this method to clean up and
        propogate errors.
        """
        await self._done_signal

    def _schedule_next_command(self, command_id: Optional[str] = None) -> None:
        if self._current_task is None and self._running is True:
            command_id = (
                command_id or self._engine.state_view.commands.get_next_queued()
            )

            if command_id is not None:
                exec_coro = self._engine.execute_command_by_id(command_id=command_id)
                self._current_task = asyncio.create_task(exec_coro)
                self._current_task.add_done_callback(self._handle_command_done)
            else:
                self._handle_command_done()

    def _handle_command_done(self, task: Optional[asyncio.Task] = None) -> None:
        self._current_task = None
        next_command_id = self._engine.state_view.commands.get_next_queued()
        exc = task.exception() if task is not None else None

        if exc is not None:
            self._done_signal.set_exception(exc)
        elif next_command_id is None and not self._done_signal.done():
            self._done_signal.set_result(None)
        elif next_command_id is not None:
            self._schedule_next_command(next_command_id)
