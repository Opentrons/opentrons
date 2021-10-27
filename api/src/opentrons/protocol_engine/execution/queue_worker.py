"""Command queue execution worker module."""
import asyncio
from logging import getLogger
from typing import Optional

from ..state import StateStore
from ..errors import ProtocolEngineStoppedError
from .command_executor import CommandExecutor


log = getLogger(__name__)


class QueueWorker:
    """Handle and track execution of commands queued in ProtocolEngine state."""

    def __init__(
        self,
        state_store: StateStore,
        command_executor: CommandExecutor,
    ) -> None:
        """Initialize the queue worker's dependencies and state.

        Arguments:
            state_store: The source of truth for protocol state, including
                all queued commands.
            command_executor: Interface used to execute and update commands.
        """
        self._state_store: StateStore = state_store
        self._command_executor: CommandExecutor = command_executor
        self._worker_task: Optional["asyncio.Task[None]"] = None

    def start(self) -> None:
        """Start processing jobs.

        This method will no-op if the worker is already running.
        """
        log.warn("MAX:QueueWorker.start()")
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
        log.warn("MAX:QueueWorker.cancel()")
        if self._worker_task:
            self._worker_task.cancel()

    async def join(self) -> None:
        """Wait for the worker to finish, propagating any errors."""
        log.warn("MAX:QueueWorker.join()")
        worker_task = self._worker_task

        if worker_task:
            self._worker_task = None

            try:
                log.warn("MAX:QueueWorker.join(): awaiting worker_task")
                await worker_task
            except (ProtocolEngineStoppedError, asyncio.CancelledError) as e:
                log.warn(f"MAX:QueueWorker.join(): passing caught exception: {e}")
                pass
            except Exception as e:
                log.error("Unhandled exception in QueueWorker job", exc_info=e)
                raise e

    async def _run_commands(self) -> None:
        log.warn("MAX:QueueWorker._run_commands(): starting")
        while not self._state_store.commands.get_stop_requested():
            log.warn("MAX:QueueWorker._run_commands(): awaiting next queued command")
            # May raise ProtocolEngineStoppedError.
            command_id = await self._state_store.wait_for(
                condition=self._state_store.commands.get_next_queued
            )

            log.warn("MAX:QueueWorker._run_commands(): awaiting execute")
            await self._command_executor.execute(command_id=command_id)
        log.warn("MAX:QueueWorker._run_commands(): finished")
