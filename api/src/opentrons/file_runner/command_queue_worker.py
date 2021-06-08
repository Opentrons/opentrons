"""CommandQueueWorker definition. Implements JSON protocol flow control."""
import asyncio
from typing import Optional, Awaitable

from opentrons import protocol_engine


class CommandQueueWorker:
    """Execute a `ProtocolEngine`'s queued commands in the background."""

    def __init__(self, protocol_engine: protocol_engine.ProtocolEngine) -> None:
        """Construct a CommandQueueWorker.

        Args:
            protocol_engine: ProtocolEngine
        """
        self._engine = protocol_engine
        self._task: Optional[Awaitable] = None
        self._terminate = False

    # todo(mm, 2021-06-07): "play" and "stop" at this level do not necessarily mean
    # as "play" and "stop" at higher-levels (FileRunner). Use more specific names, like
    # "start_scheduling_executions" and "stop_scheduling_executions"?
    def play(self) -> None:
        """Start executing the `ProtocolEngine`'s queued commands.

        The commands are executed in order, one by one, in a concurrent background task.

        See `wait_terminated` for when execution may stop.

        If this `CommandQueueWorker` was already executing queued commands,
        this method is a no-op.
        """
        if self._task is None:
            self._terminate = False
            self._task = asyncio.create_task(self._loop())

    def pause(self) -> None:
        """Pause queued command execution."""
        self.stop()

    def stop(self) -> None:
        """Stop queued command execution.

        If a command is currently executing, it will continue. Further commands will
        be left unexecuted in the queue.

        If this worker was already stopped, this method is a no-op.
        """
        if self._task is not None:
            self._terminate = True
            # fixme(mm, 2021-05-18): I think this is a bug if stop() is called before
            # wait_terminated(). It discards the background task before it's awaited,
            # which both leaks the task and throws away any errors raised in the task
            # that we haven't yet seen.
            self._task = None

    async def wait_terminated(self) -> None:
        """Wait until this `CommandQueueWorker` has stopped executing new commands.

        Execution will stop when any of the following happen:

          * A command raises an error.
          * The queue of commands in the `ProtocolEngine` runs empty.
            (Execution will not automatically resume if more commands are then added.)
          * You call `stop`.

        If a command is currently executing, this method will return after that command
        finishes.

        When you're finished with a `CommandQueueWorker`, you must call this method on
        it. This gives it a chance to clean up its background task, and propagate any
        errors.

        Raises:
            ProtocolEngineError: If there was a problem executing one of the commands
                in the queue.
        """
        if self._task:
            await self._task

    async def _loop(self) -> None:
        """Loop through pending commands and execute them."""
        while self._terminate is False:
            pending = self._engine.state_store.commands.get_next_request()
            if pending is None:
                break
            cmd_id, request = pending
            await self._engine.execute_command(
                command_id=cmd_id,
                request=request
            )
