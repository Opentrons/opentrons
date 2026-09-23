"""Protocol Engine CommandStore sub-state."""

from collections import OrderedDict
from dataclasses import dataclass
from typing import Dict, List, Optional

import asyncio
from ..commands import Command, CommandIntent, CommandStatus
from opentrons.ordered_set import OrderedSet
from opentrons.protocol_engine.errors.exceptions import CommandDoesNotExistError
from opentrons.protocol_runner.run_store_provider import RunStoreProvider



@dataclass(frozen=True)
class CommandEntryJSON:
    """A raw command entry in state, including its index in the list."""

    command: str
    command_type: type[Command]
    index: int


@dataclass(frozen=True)
class CommandEntry:
    """A command entry in state, including its index in the list."""

    command: Command
    index: int

class CommandManager:
    """Manages command insertion into and queries on persistent command storage through the RunStoreProvider."""

    def __init__(
        self,
        run_store_provider: RunStoreProvider,
    ) -> None:
        self._teardown_signal = asyncio.Event()
        self._run_store_provider = run_store_provider
        self._command_queue: list[CommandEntry] = []

        # Set up the run store task
        self._run_store_interface_task = asyncio.create_task(
            self.run_store_interface_task()
        )

    def teardown(self) -> None:
        """Send the teardown signal to the run store interface task."""
        self._teardown_signal.set()

    async def run_store_interface_task(self) -> None:
        """Handle interactions with the RunStoreProvider."""
        while not self._teardown_signal.is_set():
            if len(self._command_queue) > 0:
                # Remove the command from the queue and insert/update it on the RunStore
                command_entry = self._command_queue.pop()
                await self._run_store_provider.insert_command(command_index=command_entry.index, command=command_entry.command)

            await asyncio.sleep(0.1)
    
    def insert_command(self, command_entry) -> None:
        """Insert a command into the command queue for storage into persistence."""
        self._command_queue.insert(0, command_entry)


@dataclass  # dataclass for __eq__() autogeneration.
class CommandHistory:
    """Provides O(1) amortized access to commands of interest."""

    _all_command_ids: List[str]
    """All command IDs, in insertion order."""

    _all_failed_command_ids: List[str]
    """All failed command IDs, in insertion order."""

    _all_command_ids_but_fixit_command_ids: List[str]
    """All command IDs besides fixit command intents, in insertion order."""

    _commands_by_id: Dict[str, CommandEntryJSON]
    """All command resources, in insertion order, mapped by their unique IDs."""

    _queued_command_ids: OrderedSet[str]
    """The IDs of queued commands, in FIFO order"""

    _queued_setup_command_ids: OrderedSet[str]
    """The IDs of queued setup commands, in FIFO order"""

    _queued_fixit_command_ids: OrderedSet[str]
    """The IDs of queued fixit commands, in FIFO order"""

    _running_command_id: Optional[str]
    """The ID of the currently running command, if any"""

    _most_recently_completed_command_id: Optional[str]
    """ID of the most recent command that SUCCEEDED or FAILED, if any"""

    def __init__(
        self,
        run_store_provider: RunStoreProvider,
    ) -> None:
        self._all_command_ids = []
        self._all_failed_command_ids = []
        self._all_command_ids_but_fixit_command_ids = []
        self._queued_command_ids = OrderedSet()
        self._queued_setup_command_ids = OrderedSet()
        self._queued_fixit_command_ids = OrderedSet()
        self._commands_by_id = OrderedDict()
        self._running_command_id = None
        self._most_recently_completed_command_id = None
        self._command_manager = CommandManager(run_store_provider)

    def length(self) -> int:
        """Get the length of all elements added to the history."""
        return len(self._commands_by_id)

    def has(self, command_id: str) -> bool:
        """Returns whether a command is in the history."""
        return command_id in self._commands_by_id

    def get(self, command_id: str) -> CommandEntry:
        """Get a command entry if present, otherwise raise an exception."""
        try:
            raw_command = self._commands_by_id[command_id]
            command = raw_command.command_type.model_validate_json(raw_command.command)
            return CommandEntry(command=command, index=raw_command.index)
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")

    def get_next(self, command_id: str) -> Optional[CommandEntry]:
        """Get the command which follows the command associated with the given ID, if any."""
        index = self.get(command_id).index
        try:
            raw_command = self._commands_by_id[self._all_command_ids[index + 1]]
            command = raw_command.command_type.model_validate_json(raw_command.command)
            return CommandEntry(command=command, index=raw_command.index)
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")
        except IndexError:
            return None

    def get_prev(self, command_id: str) -> Optional[CommandEntry]:
        """Get the command which precedes the command associated with the given ID, if any.

        Returns None if the command_id corresponds to the first element in the history.
        """
        index = self.get(command_id).index
        try:
            raw_prev_command = self._commands_by_id[self._all_command_ids[index - 1]]
            command = raw_prev_command.command_type.model_validate_json(
                raw_prev_command.command
            )
            prev_command = CommandEntry(command=command, index=raw_prev_command.index)
            return prev_command if index != 0 else None
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")
        except IndexError:
            return None

    def get_all_commands(self) -> List[Command]:
        """Get all commands."""
        all_commands = []
        for raw_command_entry in self._commands_by_id.values():
            command = raw_command_entry.command_type.model_validate_json(
                raw_command_entry.command
            )
            all_commands.append(command)

        return all_commands

    def get_all_failed_commands(self) -> List[Command]:
        """Get all failed commands."""
        all_failed_commands = []
        for command_id in self._all_failed_command_ids:
            raw_command_entry = self._commands_by_id[command_id]
            command = raw_command_entry.command_type.model_validate_json(
                raw_command_entry.command
            )
            all_failed_commands.append(command)

        return all_failed_commands

    def get_filtered_command_ids(self, include_fixit_commands: bool) -> List[str]:
        """Get all fixit command IDs."""
        if include_fixit_commands:
            return self._all_command_ids
        else:
            return self._all_command_ids_but_fixit_command_ids

    def get_all_ids(self) -> List[str]:
        """Get all command IDs."""
        return self._all_command_ids

    def get_slice(
        self, start: int, stop: int, command_ids: Optional[list[str]] = None
    ) -> List[Command]:
        """Get a list of commands between start and stop."""
        commands = self._all_command_ids[start:stop]
        selected_command_ids = (
            command_ids if command_ids is not None else self._all_command_ids
        )
        commands = selected_command_ids[start:stop]
        raw_command_slice = [self._commands_by_id[command] for command in commands]
        command_slice = []
        for raw_command_entry in raw_command_slice:
            command_slice.append(
                raw_command_entry.command_type.model_validate_json(raw_command_entry.command)
            )
        return command_slice

    def del_end_slice(self, length: int) -> None:
        """Delete the end of the command history up to a given length."""
        for command_id in self._all_command_ids[length * -1 :]:
            del self._commands_by_id[command_id]
        del self._all_command_ids[length * -1 :]

    def get_tail_command(self) -> Optional[CommandEntry]:
        """Get the command most recently added."""
        if self._commands_by_id:
            tail_raw_command_entry = next(reversed(self._commands_by_id.values()))
            command = tail_raw_command_entry.command_type.model_validate_json(
                tail_raw_command_entry.command
            )
            return CommandEntry(command=command, index=tail_raw_command_entry.index)
        else:
            return None

    def get_most_recently_completed_command(self) -> Optional[CommandEntry]:
        """Get the command most recently marked as SUCCEEDED or FAILED."""
        if self._most_recently_completed_command_id is not None:
            completed_raw_command = self._commands_by_id[
                self._most_recently_completed_command_id
            ]
            command = completed_raw_command.command_type.model_validate_json(
                completed_raw_command.command
            )
            return CommandEntry(command=command, index=completed_raw_command.index)
        else:
            return None

    def get_running_command(self) -> Optional[CommandEntry]:
        """Get the command currently running, if any."""
        if self._running_command_id is None:
            return None
        else:
            raw_running_command = self._commands_by_id[self._running_command_id]
            command = raw_running_command.command_type.model_validate_json(
                raw_running_command.command
            )
            return CommandEntry(command=command, index=raw_running_command.index)

    def get_queue_ids(self) -> OrderedSet[str]:
        """Get the IDs of all queued protocol commands, in FIFO order."""
        return self._queued_command_ids

    def get_setup_queue_ids(self) -> OrderedSet[str]:
        """Get the IDs of all queued setup commands, in FIFO order."""
        return self._queued_setup_command_ids

    def get_fixit_queue_ids(self) -> OrderedSet[str]:
        """Get the IDs of all queued fixit commands, in FIFO order."""
        return self._queued_fixit_command_ids

    def append_queued_command(self, command: Command) -> None:
        """Validate and mark a command as queued in the command history."""
        assert command.status == CommandStatus.QUEUED
        assert not self.has(command.id)

        next_index = self.length()
        updated_command = CommandEntry(
            index=next_index,
            command=command,
        )
        self._add(command.id, updated_command)

        if command.intent == CommandIntent.SETUP:
            self._add_to_setup_queue(command.id)
        elif command.intent == CommandIntent.FIXIT:
            self._add_to_fixit_queue(command.id)
        else:
            self._add_to_queue(command.id)

    def set_command_running(self, command: Command) -> None:
        """Validate and mark a command as running in the command history."""
        prev_entry = self.get(command.id)

        assert prev_entry.command.status == CommandStatus.QUEUED
        assert command.status == CommandStatus.RUNNING

        self._add(
            command.id,
            CommandEntry(index=prev_entry.index, command=command),
        )

        assert self.get_running_command() is None
        self._set_running_command_id(command.id)

        self._remove_queue_id(command.id)
        self._remove_setup_queue_id(command.id)
        self._remove_fixit_queue_id(command.id)

    def set_command_succeeded(self, command: Command) -> None:
        """Validate and mark a command as succeeded in the command history."""
        prev_entry = self.get(command.id)
        assert prev_entry.command.status == CommandStatus.RUNNING
        assert command.status == CommandStatus.SUCCEEDED

        self._add(
            command.id,
            CommandEntry(
                index=prev_entry.index,
                command=command,
            ),
        )

        running_command_entry = self.get_running_command()
        assert running_command_entry is not None
        assert running_command_entry.command.id == command.id
        self._set_running_command_id(None)

        self._remove_queue_id(command.id)
        self._remove_setup_queue_id(command.id)
        self._set_most_recently_completed_command_id(command.id)

    def set_command_failed(self, command: Command) -> None:
        """Validate and mark a command as failed in the command history."""
        prev_entry = self.get(command.id)
        assert (
            prev_entry.command.status == CommandStatus.RUNNING
            or prev_entry.command.status == CommandStatus.QUEUED
        )
        assert command.status == CommandStatus.FAILED

        index = self.get(command.id).index
        self._add(
            command_id=command.id,
            command_entry=CommandEntry(index=index, command=command),
        )

        running_command_entry = self.get_running_command()
        if (
            running_command_entry is not None
            and running_command_entry.command.id == command.id
        ):
            self._set_running_command_id(None)

        self._remove_queue_id(command.id)
        self._remove_setup_queue_id(command.id)
        self._set_most_recently_completed_command_id(command.id)
        self._all_failed_command_ids.append(command.id)

    # TODO(jh, 08-01-25) Although protocol engine is garbage collected, command history persists in memory between protocol runs.
    # Explicitly clearing all history before dereferencing protocol engine and the run's run orchestrator eliminates
    # memory accumulation. Investigate further.
    def clear(self) -> None:
        """Clear state."""
        self._commands_by_id.clear()
        self._all_command_ids.clear()
        self._all_failed_command_ids.clear()
        self._all_command_ids_but_fixit_command_ids.clear()
        self._queued_command_ids.clear()
        self._queued_setup_command_ids.clear()
        self._queued_fixit_command_ids.clear()

    def _add(self, command_id: str, command_entry: CommandEntry) -> None:
        """Create or update a command entry."""
        if command_id not in self._commands_by_id:
            self._all_command_ids.append(command_id)
            if command_entry.command.intent != CommandIntent.FIXIT:
                self._all_command_ids_but_fixit_command_ids.append(command_id)

        self._commands_by_id[command_id] = CommandEntryJSON(
            command=command_entry.command.model_dump_json(by_alias=True),
            command_type=type(command_entry.command),
            index=command_entry.index,
        )
        self._command_manager.insert_command(command_entry=command_entry)

    def _add_to_queue(self, command_id: str) -> None:
        """Add new ID to the queued."""
        self._queued_command_ids.add(command_id)

    def _add_to_setup_queue(self, command_id: str) -> None:
        """Add a new ID to the queued setup."""
        self._queued_setup_command_ids.add(command_id)

    def _add_to_fixit_queue(self, command_id: str) -> None:
        """Add a new ID to the queued fixit."""
        self._queued_fixit_command_ids.add(command_id)

    def _remove_queue_id(self, command_id: str) -> None:
        """Remove a specific command from the queued command ids structure."""
        self._queued_command_ids.discard(command_id)

    def _remove_setup_queue_id(self, command_id: str) -> None:
        """Remove a specific command from the queued setup command ids structure."""
        self._queued_setup_command_ids.discard(command_id)

    def _remove_fixit_queue_id(self, command_id: str) -> None:
        """Remove a specific command from the queued fixit command ids structure."""
        self._queued_fixit_command_ids.discard(command_id)

    def _set_most_recently_completed_command_id(self, command_id: str) -> None:
        """Set the ID of the most recently dequeued command."""
        self._most_recently_completed_command_id = command_id

    def _set_running_command_id(self, command_id: Optional[str]) -> None:
        """Set the ID of the currently running command."""
        self._running_command_id = command_id
