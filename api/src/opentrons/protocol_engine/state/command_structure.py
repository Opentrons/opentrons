from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Union
from typing_extensions import assert_never

from opentrons.ordered_set import OrderedSet
from opentrons.protocol_engine.commands.command import CommandIntent, CommandStatus
from opentrons.protocol_engine.commands.command_unions import Command
from opentrons.protocol_engine.errors.error_occurrence import ErrorOccurrence
from opentrons.protocol_engine.errors.exceptions import CommandDoesNotExistError


@dataclass(frozen=True)
class CommandEntry:
    """A command entry in state, including its index in the list."""

    command: Command
    index: int


@dataclass  # dataclass for __eq__() autogeneration.
class CommandStructure:
    """Command state container for command data."""

    _commands_by_id: Dict[str, CommandEntry]
    """All command resources, in insertion order, mapped by their unique IDs."""

    _queued_command_ids: OrderedSet[str]
    """The IDs of queued commands, in FIFO order"""

    _queued_setup_command_ids: OrderedSet[str]
    """The IDs of queued setup commands, in FIFO order"""

    _running_command_id: Optional[str]
    """The ID of the currently running command, if any"""

    recent_dequeued_command_id: Optional[str]
    """ID of the most recent command that was dequeued, if any"""

    def __init__(self) -> None:
        self._queued_command_ids = OrderedSet()
        self._queued_setup_command_ids = OrderedSet()
        self._commands_by_id = OrderedDict()

    def length(self) -> int:
        return len(self._commands_by_id)

    def has(self, command_id: str) -> bool:
        return command_id in self._commands_by_id

    def get(self, command_id: str) -> CommandEntry:
        try:
            return self._commands_by_id[command_id]
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")

    def get_next_command(self, command_id: str) -> Optional[CommandEntry]:
        """Get the command which follows the command associated with the given ID"""
        try:
            index = self._commands_by_id[command_id].index
            commands_by_id_list = list(self._commands_by_id.keys())
            return self._commands_by_id[commands_by_id_list[index + 1]]
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")

    def get_if_present(self, command_id: str) -> Optional[CommandEntry]:
        return self._commands_by_id.get(command_id)

    def get_all_commands(self) -> List[Command]:
        commands = list(self._commands_by_id.values())
        return [command.command for command in commands]

    def get_all_ids(self) -> List[str]:
        return list(self._commands_by_id.keys())

    def get_slice(self, start: int, stop: int) -> List[Command]:
        commands = list(self._commands_by_id.values())[start:stop]
        return [command.command for command in commands]

    def get_recent_added_command(self) -> Optional[CommandEntry]:
        """Get the command most recently added to _commands_by_id."""
        return next(reversed(self._commands_by_id.values()))

    def get_recent_dequeued_command(self) -> Optional[CommandEntry]:
        """Get the command most recently dequeued from all queues."""
        if self.recent_dequeued_command_id is None:
            return None
        else:
            return self._commands_by_id[self.recent_dequeued_command_id]

    def get_running_command(self) -> Optional[CommandEntry]:
        if self._running_command_id is None:
            return None
        else:
            return self._commands_by_id[self._running_command_id]

    def get_failed_command(self) -> Optional[CommandEntry]:
        if self._failed_command_id is None:
            return None
        else:
            return self._commands_by_id[self._failed_command_id]

    def get_queued_command_ids(self) -> OrderedSet[str]:
        return self._queued_command_ids

    def get_queued_setup_command_ids(self) -> OrderedSet[str]:
        return self._queued_setup_command_ids

    def set_command_entry(self, command_id: str, command_entry: CommandEntry) -> None:
        self._commands_by_id[command_id] = command_entry

    def set_recent_dequeued_command_id(self, command_id: str) -> None:
        self.recent_dequeued_command_id = command_id

    def set_running_command_id(self, command_id: Union[str, None]):
        self._running_command_id = command_id

    def set_failed_command_id(self, command_id: str):
        self._failed_command_id = command_id

    def add_to_queued_command_ids(self, command_id: str) -> None:
        self._queued_command_ids.add(command_id)

    def add_to_queued_setup_command_ids(self, command_id: str) -> None:
        self._queued_setup_command_ids.add(command_id)

    def clear_queued_command_ids(self) -> None:
        self._queued_command_ids.clear()

    def clear_queued_setup_command_ids(self) -> None:
        self._queued_setup_command_ids.clear()

    def remove_from_queued_command_ids(self, command_id: str) -> None:
        self._queued_command_ids.discard(command_id)

    def remove_from_queued_setup_command_ids(self, command_id: str) -> None:
        self._queued_setup_command_ids.discard(command_id)
