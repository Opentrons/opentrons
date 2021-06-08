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
        self._keep_running = False

    # todo(mm, 2021-06-07): "play" and "stop" at this level do not necessarily mean
    # as "play" and "stop" at higher-levels (FileRunner). Use more specific names, like
    # "start_scheduling_executions" and "stop_scheduling_executions"?
    def play(self) -> None:
        """Start executing the `ProtocolEngine`'s queued commands.

        The commands are executed in order, one by one, in the background via asyncio
        tasks.

        See `wait_to_be_idle` for when execution may stop.
        """
        # todo(mm, 2021-06-07): How should things work if you pause and resume multiple
        # times while a single command is executing? To ensure clean sequencing,
        # would each resume need to be preceded by a wait_to_be_idle() call? If so,
        # the resume request could block for multiple seconds. If not, there might be
        # a race condition where a resume is ignored depending on the timing of
        # self._task getting set to None. Resolving this might require more detailed
        # state handling than "has a task" vs. "doesn't have a task".
        if nself._task is None
            self._keep_running = True
            self._start_scheduling_rest_if_still_running()

    def pause(self) -> None:
        """Equivalent to `stop`."""
        self.stop()

    def stop(self) -> None:
        """Stop executing any more queued commands.

        If a command is currently in the middle of executing, it will continue until
        it's done. Further commands will be left unexecuted in the queue.
        """
        if self._task is not None:
            self._keep_running = False

    async def wait_to_be_idle(self) -> None:
        """Wait until this `CommandQueueWorker` is idle.
        
        This means:
        
        * No command is currently executing on the `ProtocolEngine`.
        * No commands are scheduled for execution in the future, and none will be
          scheduled without further action from you.

        A `CommandQueueWorker` can reach an idle state when either of the following
        happen:

          * The `ProtocolEngine` reports no more commands in the queue, stopping the
            `CommandQueueWorker` automatically.
            (Execution will not automatically resume if more commands are then added.)
          * You manually stop the `CommandQueueWorker` with `stop`.

        If a command is currently executing, this method will return after that command
        finishes.

        If an exception happened while executing commands, it will be raised from this
        call.

        When you're finished with a `CommandQueueWorker`, you must call this method on
        it. This gives it a chance to clean up its background task, and propagate any
        errors.
        """
        if self._task is not None:
            await self._task
            self._task = None

    def _start_scheduling_rest_if_still_running(self) -> None:
        if self._keep_running:
            next_request_result = self._engine.state_store.commands.get_next_request()
            if next_request_result is None:  # Nothing left in the queue.
                return
            next_command_id, next_request = next_request_result

            # We rely on asyncio.create_task() returning before the event loop actually
            # switches to the new task -- otherwise, this task and the new task would
            # race to set self._task.
            #
            # This mutually recursive pair of functions *looks* like it would have
            # stack depth problems as the depth grows linearly with the number of
            # commands; but I think it's actually fine, because this method never
            # awaits the new task that it creates here, so it will return immediately.
            self._task = asyncio.create_task(
                self._execute_and_start_scheduling_rest(
                    next_command_id, next_request
                )
            )

    async def _execute_and_start_scheduling_rest(
        self,
        command_id_to_execute: str,
        request_to_execute: protocol_engine.commands.CommandRequestType
    ) -> None:
        await self._engine.execute_command(request_to_execute, command_id_to_execute)
        self._start_scheduling_rest_if_still_running()
