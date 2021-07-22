"""Command queue execution worker module."""
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
        self._worker_task: Optional[asyncio.Task] = None

    def start(self) -> None:
        """Start processing jobs.

        This method will no-op if the worker is already running.
        """
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._run_commands())

    async def stop(self) -> None:
        """Stop proccessing commands and clean up.

        This method should be called when you are done executing commands.
        """
        worker_task = self._worker_task

        if worker_task:
            self._worker_task = None
            worker_task.cancel()

            try:
                await worker_task
            except asyncio.CancelledError:
                pass
            except Exception as e:
                log.error("Unhandled exception in QueueWorker job", exc_info=e)
                raise e

    async def _run_commands(self) -> None:
        while True:
            get_next_queued = self._state_store.commands.get_next_queued
            command_id = await self._state_store.wait_for(condition=get_next_queued)

            await self._command_executor.execute(command_id=command_id)
