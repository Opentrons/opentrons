"""Protocol Engine CommandStore sub-state."""
from collections import OrderedDict
from dataclasses import dataclass
from typing import Dict, List, Optional

from opentrons.ordered_set import OrderedSet
from opentrons.protocol_engine.commands.command_unions import Command
from opentrons.protocol_engine.errors.exceptions import CommandDoesNotExistError


@dataclass(frozen=True)
class CommandEntry:
    """A command entry in state, including its index in the list."""

    command: Command
    index: int


@dataclass  # dataclass for __eq__() autogeneration.
class CommandHistory:
    """Command state container for command data."""

    _all_command_ids: List[str]
    """All command IDs, in insertion order."""

    _commands_by_id: Dict[str, CommandEntry]
    """All command resources, in insertion order, mapped by their unique IDs."""

    _queued_command_ids: OrderedSet[str]
    """The IDs of queued commands, in FIFO order"""

    _queued_setup_command_ids: OrderedSet[str]
    """The IDs of queued setup commands, in FIFO order"""

    _running_command_id: Optional[str]
    """The ID of the currently running command, if any"""

    _dequeued_command_id: Optional[str]
    """ID of the most recent command that was dequeued, if any"""

    def __init__(self) -> None:
        self._all_command_ids = []
        self._queued_command_ids = OrderedSet()
        self._queued_setup_command_ids = OrderedSet()
        self._commands_by_id = OrderedDict()
        self._running_command_id = None
        self._dequeued_command_id = None

    def length(self) -> int:
        """Get the length of all elements added to the history."""
        return len(self._commands_by_id)

    def has(self, command_id: str) -> bool:
        """Returns whether a command is in the history."""
        return command_id in self._commands_by_id

    def get(self, command_id: str) -> CommandEntry:
        """Get a command entry if present, otherwise raise an exception."""
        try:
            return self._commands_by_id[command_id]
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")

    def get_next(self, command_id: str) -> Optional[CommandEntry]:
        """Get the command which follows the command associated with the given ID, if any."""
        try:
            index = self._commands_by_id[command_id].index
            return self._commands_by_id[self._all_command_ids[index + 1]]
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")
        except IndexError:
            return None

    def get_if_present(self, command_id: str) -> Optional[CommandEntry]:
        """Get a command entry, if present."""
        return self._commands_by_id.get(command_id)

    def get_all_commands(self) -> List[Command]:
        """Get all commands."""
        return [
            self._commands_by_id[command_id].command
            for command_id in self._all_command_ids
        ]

    def get_all_ids(self) -> List[str]:
        """Get all command IDs."""
        return self._all_command_ids

    def get_slice(self, start: int, stop: int) -> List[Command]:
        """Get a list of commands between start and stop."""
        commands = self._all_command_ids[start:stop]
        return [self._commands_by_id[command].command for command in commands]

    def get_tail_command(self) -> Optional[CommandEntry]:
        """Get the command most recently added."""
        if self._commands_by_id:
            return next(reversed(self._commands_by_id.values()))
        else:
            return None

    def get_dequeued_command(self) -> Optional[CommandEntry]:
        """Get the command most recently dequeued from all queues."""
        if self._dequeued_command_id is not None:
            return self._commands_by_id[self._dequeued_command_id]
        else:
            return None

    def get_running_command(self) -> Optional[CommandEntry]:
        """Get the command currently running, if any."""
        if self._running_command_id is None:
            return None
        else:
            return self._commands_by_id[self._running_command_id]

    def get_queue_ids(self) -> OrderedSet[str]:
        """Get the IDs of all queued protocol commands, in FIFO order."""
        return self._queued_command_ids

    def get_setup_queue_ids(self) -> OrderedSet[str]:
        """Get the IDs of all queued setup commands, in FIFO order."""
        return self._queued_setup_command_ids

    def set_running_command_id(self, command_id: Optional[str]) -> None:
        """Set the ID of the currently running command."""
        self._running_command_id = command_id

    def add(self, command_id: str, command_entry: CommandEntry) -> None:
        """Create or update a command entry."""
        if command_id not in self._commands_by_id:
            self._all_command_ids.append(command_id)
        self._commands_by_id[command_id] = command_entry

    def add_to_queue(self, command_id: str) -> None:
        """Add new ID to the queued."""
        self._queued_command_ids.add(command_id)

    def add_to_setup_queue(self, command_id: str) -> None:
        """Add a new ID to the queued setup."""
        self._queued_setup_command_ids.add(command_id)

    def clear_queue(self) -> None:
        """Clears all commands within the queued command ids structure."""
        self._queued_command_ids.clear()

    def clear_setup_queue(self) -> None:
        """Clears all commands within the queued setup command ids structure."""
        self._queued_setup_command_ids.clear()

    def remove_queue_id(self, command_id: str) -> None:
        """Remove a specific command from the queued command ids structure."""
        self._queued_command_ids.discard(command_id)
        if command_id in self._queued_command_ids:
            self._set_dequeued_command_id(command_id)

    def remove_setup_queue_id(self, command_id: str) -> None:
        """Remove a specific command from the queued setup command ids structure."""
        self._queued_setup_command_ids.discard(command_id)
        if command_id in self._queued_setup_command_ids:
            self._set_dequeued_command_id(command_id)

    def _set_dequeued_command_id(self, command_id: str) -> None:
        """Set the ID of the most recently dequeued command."""
        self._dequeued_command_id = command_id
