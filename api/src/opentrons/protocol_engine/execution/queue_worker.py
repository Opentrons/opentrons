"""Command queue execution worker module."""
import asyncio
from logging import getLogger
from typing import Optional, AsyncGenerator, Callable

from ..state.state import StateStore
from .command_executor import CommandExecutor

log = getLogger(__name__)


class QueueWorker:
    """Handle and track execution of commands queued in ProtocolEngine state."""

    def __init__(
        self,
        state_store: StateStore,
        command_executor: CommandExecutor,
        command_generator: Callable[[], AsyncGenerator[str, None]],
    ) -> None:
        """Initialize the queue worker's dependencies and state.

        Arguments:
            state_store: The source of truth for protocol state, including
                all queued commands.
            command_executor: Interface used to execute and update commands.
            command_generator: Command generator to get the next command to execute.
        """
        self._state_store: StateStore = state_store
        self._command_executor: CommandExecutor = command_executor
        self._command_generator = command_generator
        self._worker_task: Optional["asyncio.Task[None]"] = None

    def start(self) -> None:
        """Start processing jobs.

        This method will no-op if the worker is already running.
        """
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._run_commands())

    def cancel(self) -> None:
        """Cancel any in-progress commands.

        This method is synchronous to allow synchronous callers to
        cancel the ongoing background task in situations where it
        needs to happen immediately.

        You should call `join` after calling `cancel` to clean up and
        propagate errors.
        """
        if self._worker_task:
            self._worker_task.cancel()

    async def join(self) -> None:
        """Wait for the worker to finish, propagating any errors."""
        worker_task = self._worker_task

        if worker_task:
            self._worker_task = None

            try:
                await worker_task
            except asyncio.CancelledError:  # From self.cancel().
                pass
            except Exception as e:
                log.error("Unhandled exception in QueueWorker job", exc_info=e)
                raise e

    async def _run_commands(self) -> None:
        async for command_id in self._command_generator():
            try:
                await self._command_executor.execute(command_id=command_id)
            except BaseException:
                log.exception(
                    # The state can tear if e.g. we've finished updating PipetteStore,
                    # but the exception came before we could update LabwareStore. Or
                    # the exception could have interrupted updating a single store.
                    "Unhandled failure in command executor."
                    " This is a bug in opentrons.protocol_engine"
                    " and has probably left the ProtocolEngine in a torn state."
                )
                raise
            # Yield to the event loop in case we're executing a long sequence of commands
            # that never yields internally. For example, a long sequence of comment commands.
            await asyncio.sleep(0)
