"""RunStore/AnalysisStore provider."""

from __future__ import annotations

from typing import TYPE_CHECKING, Awaitable, Callable, Dict, Optional

if TYPE_CHECKING:
    from opentrons.protocol_engine import CommandSlice
    from opentrons.protocol_engine.commands import Command, CommandIntent
    from opentrons.protocol_engine.errors.exceptions import CommandDoesNotExistError
    from opentrons.protocol_engine.state.command_history import CommandEntry
    from opentrons.protocol_engine.state.commands import CommandAnnotationsSlice
    from opentrons.protocol_engine.types import CommandAnnotation


class RunStoreProvider:
    """Provider class to allow read/write access to the RunStore or AnalysisStore."""

    def __init__(
        self,
        run_id: Optional[str] = None,
        store_insert_command: Optional[
            Callable[[str, int, "Command"], Awaitable[None]]
        ] = None,
        store_insert_command_annotation: Optional[
            Callable[[str, "CommandAnnotation"], Awaitable[None]]
        ] = None,
        store_get_command: Optional[Callable[[str, str], Awaitable["Command"]]] = None,
        store_get_commands_slice: Optional[
            Callable[[str, int, int, bool], Awaitable["CommandSlice"]]
        ] = None,
        store_get_command_annotation: Optional[
            Callable[[str, str], Awaitable["CommandAnnotation"]]
        ] = None,
        store_get_command_annotation_slice: Optional[
            Callable[[str, int, int], Awaitable["CommandAnnotationsSlice"]]
        ] = None,
    ) -> None:
        """Initialize a provider to access the RunStore or AnalysisStore."""
        self._run_id = run_id
        self._store_insert_command = store_insert_command
        self._store_insert_command_annotation = store_insert_command_annotation
        self._store_get_command = store_get_command
        self._store_get_commands_slice = store_get_commands_slice
        self._store_get_command_annotation = store_get_command_annotation
        self._store_get_command_annotation_slice = store_get_command_annotation_slice

        # NOTE: The dictionaries of commands and annotations keyed by id will remain empty UNLESS the above fields are `None`
        self._all_commands_by_id: Dict[str, "CommandEntry"] = {}
        self._all_command_annotations_by_id: Dict[str, "CommandAnnotation"] = {}

    def set_run_id(self, run_id: str) -> None:
        """Set the current Run Id."""
        self._run_id = run_id

    async def insert_command(self, command_index: int, command: "Command") -> None:
        """insert or update a command"""
        if self._run_id and self._store_insert_command:
            await self._store_insert_command(self._run_id, command_index, command)
        else:
            self._all_commands_by_id[command.id] = CommandEntry(
                command=command, index=command_index
            )

    async def insert_command_annotation(
        self, command_annotation: "CommandAnnotation"
    ) -> None:
        """insert command annotation"""
        if self._run_id and self._store_insert_command_annotation:
            await self._store_insert_command_annotation(
                self._run_id, command_annotation
            )
        else:
            self._all_command_annotations_by_id[command_annotation.id] = (
                command_annotation
            )

    async def get_command(self, command_id: str) -> "Command":
        """get command"""
        if self._run_id and self._store_get_command:
            return await self._store_get_command(self._run_id, command_id)
        else:
            try:
                return self._all_commands_by_id[command_id].command
            except KeyError:
                raise CommandDoesNotExistError(f"Command {command_id} does not exist")

    async def get_command_annotation(
        self, command_annotation_id: str
    ) -> "CommandAnnotation":
        """get command annotation"""
        if self._run_id and self._store_get_command_annotation:
            return await self._store_get_command_annotation(
                self._run_id, command_annotation_id
            )
        else:
            return self._all_command_annotations_by_id[command_annotation_id]

    async def get_commands_slice(
        self, cursor: int, length: int, include_fixit_commands: bool
    ) -> "CommandSlice":
        """get commands slice"""
        if self._run_id and self._store_get_commands_slice:
            return await self._store_get_commands_slice(
                self._run_id, cursor, length, include_fixit_commands
            )
        else:
            command_ids = []
            for command_id, command_entry in self._all_commands_by_id.items():
                if include_fixit_commands:
                    command_ids.append(command_id)
                elif (
                    not include_fixit_commands
                    and command_entry.command.intent != CommandIntent.FIXIT
                ):
                    command_ids.append(command_id)

            total_length = len(command_ids)

            # start is inclusive, stop is exclusive
            start = max(0, min(cursor, total_length - 1))
            stop = min(total_length, start + length)

            selected_command_ids = command_ids

            commands = selected_command_ids[start:stop]
            command_list = [
                self._all_commands_by_id[command].command for command in commands
            ]
            return CommandSlice(
                commands=command_list,
                cursor=start,
                total_length=total_length,
            )

    async def get_command_annotations_slice(
        self, cursor: int, length: int
    ) -> "CommandAnnotationsSlice":
        """get command annotations slice"""
        if self._run_id and self._store_get_command_annotation_slice:
            return await self._store_get_command_annotation_slice(
                self._run_id, cursor, length
            )
        else:
            # start is inclusive, stop is exclusive
            all_annotations = list(self._all_command_annotations_by_id.values())
            total_length = len(all_annotations)
            actual_cursor = max(
                0, min(cursor, total_length - 1)
            )  # 0 <= cursor < total_length
            stop = min(total_length, actual_cursor + length)  # stop <= total_length

            sliced_annotations = all_annotations[actual_cursor:stop]
            return CommandAnnotationsSlice(
                command_annotations=sliced_annotations,
                cursor=actual_cursor,
                total_length=total_length,
            )
