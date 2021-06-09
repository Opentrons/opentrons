"""CommandQueueWorker definition. Implements JSON protocol flow control."""
import asyncio
from typing import Awaitable, Optional, Tuple

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
        self._keep_running = False

    # todo(mm, 2021-06-07): "play" and "pause" at this level do not necessarily mean
    # as "play" and "pause" at higher-levels (FileRunner). Use more specific names, like
    # "start_scheduling_executions" and "pause_scheduling_executions"?
    def play(self) -> None:
        """Start executing the `ProtocolEngine`'s queued commands.

        This returns immediately.

        Commands are executed sequentially in the background via asyncio tasks.

        See `wait_to_be_idle` for when execution may stop.
        """
        if self._task is None:
            self._keep_running = True
            # We rely on asyncio.create_task() returning before the event loop actually
            # switches to the new task -- otherwise, concurrent calls to this function
            # could race to check and set self._task.
            self._task = asyncio.create_task(self._play_async())

    def pause(self) -> None:
        """Stop executing any more queued commands.

        This will return immediately, but if a command is currently in the middle of
        executing, it will continue until it's done. Further commands will be left
        unexecuted in the queue.
        """
        if self._task is not None:
            self._keep_running = False

    # todo(mm, 2021-06-08): In addition to calling this when it's done with the object,
    # should calling code also call this between adjacent pause() and resume()s?
    #
    # If yes, the resume request could block for multiple seconds.
    #
    # If no, there might be race conditions where a resume is ignored depending on the
    # timing of self._task getting set to None? Resolving this might require better
    # internal state representation than "has a task" vs. "doesn't have a task".
    async def wait_to_be_idle(self) -> None:
        """Wait until this `CommandQueueWorker` is idle.

        This means:

        * No command is currently executing on the `ProtocolEngine`.
        * No commands are scheduled for execution in the future, and none will be
          scheduled without further action from you.

        A `CommandQueueWorker` can reach an idle state when either of the following
        happen:

          * The `ProtocolEngine` reports no more commands in the queue,
            stopping the `CommandQueueWorker` automatically.
            (Execution will not automatically resume if more commands are then added.)
          * You manually pause the `CommandQueueWorker` with `pause`.

        This method will return only after any ongoing command executions have finished.

        If an exception happened while executing commands, it will be raised from this
        call.

        When you're finished with a `CommandQueueWorker`, you should call this method on
        it. This gives it a chance to clean up its background task, and propagate any
        errors.
        """
        if self._task is not None:
            await self._task
            self._task = None

    def _next_command(self) -> \
            Optional[Tuple[str, protocol_engine.commands.CommandRequestType]]:
        if self._keep_running:
            # Will be None if the engine has no commands left.
            return self._engine.state_store.commands.get_next_request()
        else:
            return None

    async def _play_async(self) -> None:
        for command_id, request in iter(self._next_command, None):
            await self._engine.execute_command(
                request=request,
                command_id=command_id
            )
