"""CommandQueueWorker definition. Implements JSON protocol flow control."""
import asyncio
from typing import Optional, Awaitable

from opentrons.protocol_engine import ProtocolEngine


class CommandQueueWorker:
    """A class that executes the queued commands in a ProtocolEngine."""

    def __init__(self, protocol_engine: ProtocolEngine) -> None:
        """Construct a CommandQueueWorker.

        Args:
            protocol_engine: ProtocolEngine
        """
        self._engine = protocol_engine
        self._task: Optional[Awaitable] = None
        self._terminate = False

    def play(self) -> None:
        """Start/resume queued command execution."""
        if self._task is None:
            self._terminate = False
            self._task = asyncio.create_task(self._loop())

    def pause(self) -> None:
        """Pause queued command execution."""
        self.stop()

    def stop(self) -> None:
        """Stop queued command execution."""
        if self._task is not None:
            self._terminate = True
            self._task = None

    async def wait_terminated(self) -> None:
        """Wait for background task to terminate.

        This can occur either due to a pause, stop, or no more pending requests.
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

        self._task = None
