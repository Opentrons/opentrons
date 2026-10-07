"""Command Store provider to allow commands to be submitted to RunStore and AnalysisStore."""

from __future__ import annotations

from typing import TYPE_CHECKING, Awaitable, Callable, Optional

if TYPE_CHECKING:
    from opentrons.protocol_engine.commands import Command


class CommandStoreProvider:
    """Provider class to allow read/write access to the RunStore or AnalysisStore."""

    def __init__(
        self,
        run_id: Optional[str] = None,
        store_insert_batch_commands: Optional[
            Callable[[str, list[tuple[int, "Command"]]], Awaitable[None]]
        ] = None,
    ) -> None:
        """Initialize a provider to access the RunStore or AnalysisStore."""
        self._run_id = run_id
        self._store_insert_batch_commands = store_insert_batch_commands

    def set_run_id(self, run_id: str) -> None:
        """Set the current Run Id."""
        self._run_id = run_id

    async def insert_batch_commands(
        self, commands_batch: list[tuple[int, "Command"]]
    ) -> None:
        """Insert or update a batch of commands."""
        if self._run_id and self._store_insert_batch_commands:
            await self._store_insert_batch_commands(
                self._run_id,
                commands_batch,
            )
