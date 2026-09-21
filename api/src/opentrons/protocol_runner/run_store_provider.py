"""RunStore/AnalysisStore provider."""

from __future__ import annotations

from typing import Callable, Optional, Awaitable

from opentrons.protocol_engine import CommandSlice
from opentrons.protocol_engine.commands import Command
from opentrons.protocol_engine.state.commands import CommandAnnotationsSlice
from opentrons.protocol_engine.types import CommandAnnotation

class RunStoreProvider:
    """Provider class to allow read/write access to the RunStore or AnalysisStore."""

    def __init__(
        self,
        run_id: Optional[str],
        store_insert_command: Optional[
            Callable[[str, int, Command], Awaitable[None]]
        ] = None,
        store_insert_command_annotation: Optional[
            Callable[[str, int, CommandAnnotation], Awaitable[None]]
        ] = None,
        store_get_command: Optional[
            Callable[[str, str], Awaitable[Command]]
        ] = None,
        store_get_commands_slice: Optional[
            Callable[[str, int, int], Awaitable[CommandSlice]]
        ] = None,
        store_get_command_annotation: Optional[
            Callable[[str, str], Awaitable[CommandAnnotation]]
        ] = None,
        store_get_command_annotation_slice: Optional[
            Callable[[str, int, int], Awaitable[CommandAnnotationsSlice]]
        ] = None,
    ) -> None:
        """Initialize a provider to access the RunStore or AnalysisStore."""
        self._run_id = run_id
        self._store_insert_command = store_insert_command,
        self._store_insert_command_annotation = store_insert_command_annotation
        self._store_get_command = store_get_command
        self._store_get_commands_slice = store_get_commands_slice
        self._store_get_command_annotation = store_get_command_annotation
        self._store_get_command_annotation_slice = store_get_command_annotation_slice

        # CASEY NOTE: should this whole thing regress to using a dictionary if a run store isn't available to set all this stuff?

    def set_run_id(self, run_id: str) -> None:
        """Set the current Run Id."""
        self._run_id = run_id

    async def insert_command(self, command_index: int, command: Command) -> None:
        """insert command"""
        if self._run_id and self._store_insert_command:
            await self._store_insert_command(self._run_id, command_index, command)

    async def insert_command_annotation(self, command_annotation: CommandAnnotation) -> None:
        """insert command annotation"""
        if self._run_id and self._store_insert_command_annotation:
            await self._store_insert_command_annotation(self._run_id, command_annotation)

    async def get_command(self, command_id: str) -> Command:
        """get command"""
        if self._run_id and self._store_get_command:
            return await self._store_get_command(self._run_id, command_id)

    async def get_command_annotation(self, command_annotation_id: str) -> CommandAnnotation:
        """get command annotation"""
        if self._run_id and self._store_get_command_annotation:
            return await self._store_get_command_annotation(self._run_id, command_annotation_id)

    async def get_commands_slice(self, cursor: int, length: int) -> CommandSlice:
        """get commands slice"""
        if self._run_id and self._store_get_commands_slice:
            return await self._store_get_commands_slice(self._run_id, cursor, length)

    async def get_command_annotations_slice(self, cursor: int, length: int) -> CommandAnnotationsSlice:
        """get command annotations slice"""
        if self._run_id and self._store_get_command_annotation_slice:
            return await self._store_get_command_annotation_slice(self._run_id, cursor, length)
        
