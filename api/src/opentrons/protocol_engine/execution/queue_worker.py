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
from logging import getLogger
from typing import Optional

from ..state import StateStore
from .command_executor import CommandExecutor


log = getLogger(__name__)


class QueueWorker:
    """Handle and track execution of commands queued in ProtocolEngine state."""

    def __init__(
        self,
        state_store: StateStore,
        command_executor: CommandExecutor,
    ) -> None:
        """Initialize the queue worker's dependencies and state."""
        self._state_store: StateStore = state_store
        self._command_executor: CommandExecutor = command_executor
        self._command_queue: "asyncio.Queue[str]" = asyncio.Queue()
        self._worker_task: Optional[asyncio.Task] = None
        self._keep_running: bool = False

    def start(self) -> None:
        """Start executing commands in the queue."""
        self._keep_running = True
        self.refresh()

    def stop(self) -> None:
        """Stop executing commands in the queue."""
        self._keep_running = False

    def refresh(self) -> None:
        """Refresh the worker's jobs.

        You should call this method when commands are added to the queue
        so the worker can restart if the queue was previously empty.
        """
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._run_commands())

        if self._command_queue.empty():
            self._queue_next_command()

    async def wait_for_idle(self) -> None:
        """Wait for the queue worker finish all tasks and clean up.

        This method should be called when you are done executing commands.
        """
        worker_task = self._worker_task

        if worker_task:
            await self._command_queue.join()
            worker_task.cancel()

            self._command_queue = asyncio.Queue()
            self._worker_task = None
            await asyncio.gather(worker_task, return_exceptions=True)

    def _queue_next_command(self) -> None:
        if self._keep_running:
            next_command_id = self._state_store.commands.get_next_queued()

            if next_command_id:
                self._command_queue.put_nowait(next_command_id)

    async def _run_commands(self) -> None:
        while True:
            command_id = None

            try:
                command_id = await self._command_queue.get()
                await self._command_executor.execute(command_id=command_id)
                self._queue_next_command()
            except asyncio.CancelledError:
                return
            except Exception as e:
                log.error("Unexpected exception while running command", exc_info=e)
                return
            finally:
                if command_id is not None:
                    self._command_queue.task_done()
