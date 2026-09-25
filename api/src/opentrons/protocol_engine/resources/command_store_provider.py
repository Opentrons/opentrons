"""Command Store provider to allow commands to be submitted to RunStore and AnalysisStore."""

from __future__ import annotations

from typing import TYPE_CHECKING, Awaitable, Callable, Dict, Optional

if TYPE_CHECKING:
    from opentrons.protocol_engine.commands import Command
    from opentrons.protocol_engine.state.command_history import CommandEntry


class CommandStoreProvider:
    """Provider class to allow read/write access to the RunStore or AnalysisStore."""

    def __init__(
        self,
        run_id: Optional[str] = None,
        store_insert_command: Optional[
            Callable[[str, int, "Command"], Awaitable[None]]
        ] = None,
    ) -> None:
        """Initialize a provider to access the RunStore or AnalysisStore."""
        self._run_id = run_id
        self._store_insert_command = store_insert_command

        # NOTE: The dictionaries of commands keyed by id will remain empty UNLESS the above fields are `None`
        self._all_commands_by_id: Dict[str, "CommandEntry"] = {}

    def set_run_id(self, run_id: str) -> None:
        """Set the current Run Id."""
        self._run_id = run_id

    async def insert_command(self, command_index: int, command: "Command") -> None:
        """Insert or update a command."""
        if self._run_id and self._store_insert_command:
            await self._store_insert_command(self._run_id, command_index, command)
        else:
            self._all_commands_by_id[command.id] = CommandEntry(
                command=command, index=command_index
            )
