"""Command Store provider to allow commands to be submitted to RunStore and AnalysisStore."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Awaitable, Callable, Optional

log = logging.getLogger(__name__)

if TYPE_CHECKING:
    from opentrons.protocol_engine.commands import Command


class CommandStoreProvider:
    """Provider class to allow read/write access to the RunStore or AnalysisStore."""

    def __init__(
        self,
        run_id: Optional[str] = None,
        store_insert_batch_commands: Optional[
            Callable[[str, int, list["Command"]], Awaitable[None]]
        ] = None,
    ) -> None:
        """Initialize a provider to access the RunStore or AnalysisStore."""
        self._run_id = run_id
        self._store_insert_batch_commands = store_insert_batch_commands
        log.warning(f"COMMAND STORE CREATED WITH {self._store_insert_batch_commands}")

    def set_run_id(self, run_id: str) -> None:
        """Set the current Run Id."""
        self._run_id = run_id


    async def insert_batch_commands(
        self, commands_total: int, commands_batch: list["Command"]
    ) -> None:
        """Insert or update a batch of commands."""
        log.warning(
            f"INSERT BATCH COMMANDS CALLED WITH: {self._run_id} {self._store_insert_batch_commands}"
        )
        if self._run_id and self._store_insert_batch_commands:
            log.warning(
                f"LOGGING BATCH COMMANDS ON COMMAND STORE OF SIZE: {len(commands_batch)}"
            )
            await self._store_insert_batch_commands(
                self._run_id,
                commands_total,
                commands_batch,
            )
