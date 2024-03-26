from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

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
    _commands_by_id: Dict[str, CommandEntry]
    """All command resources, in insertion order, mapped by their unique IDs."""

    _queued_command_ids: OrderedSet[str]
    """The IDs of queued commands, in FIFO order"""

    _queued_setup_command_ids: OrderedSet[str]
    """The IDs of queued setup commands, in FIFO order"""

    _running_command_id: Optional[str]
    """The ID of the currently running command, if any"""

    _recently_dequeued_command_id: Optional[str]
    """ID of the most recent command that was dequeued, if any"""

    _failed_command_id: Optional[str]
    """ID of the command that made the run fail, if any"""

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

    def get_running_command(self) -> Optional[CommandEntry]:
        if self._running_command_id is None:
            return None
        else:
            return self._commands_by_id[self._running_command_id]

    def get_recently_dequeued_command(self) -> Optional[CommandEntry]:
        if self._recently_dequeued_command_id is None:
            return None
        else:
            return self._commands_by_id[self._recently_dequeued_command_id]

    def get_failed_command(self) -> Optional[CommandEntry]:
        if self._failed_command_id is None:
            return None
        else:
            return self._commands_by_id[self._failed_command_id]

    def get_queued_command_ids(self) -> OrderedSet[str]:
        return self._queued_command_ids

    def get_queued_setup_command_ids(self) -> OrderedSet[str]:
        return self._queued_setup_command_ids

    def add_queued(self, queued_command: Command) -> None:
        assert queued_command.status == CommandStatus.QUEUED
        assert not self.has(queued_command.id)

        next_index = self.length()
        self._commands_by_id[queued_command.id] = CommandEntry(
            index=next_index,
            command=queued_command,
        )

        if queued_command.intent == CommandIntent.SETUP:
            self._queued_setup_command_ids.add(queued_command.id)
        else:
            self._queued_command_ids.add(queued_command.id)

    def update(self, command: Command) -> None:
        prev_entry = self.get_if_present(command.id)

        if prev_entry is None:
            next_index = self.length()
            self._commands_by_id[command.id] = CommandEntry(
                index=next_index,
                command=command,
            )
        else:
            self._commands_by_id[command.id] = CommandEntry(
                index=prev_entry.index, command=command
            )

        self._queued_command_ids.discard(command.id)
        self._queued_setup_command_ids.discard(command.id)

        if command.status == CommandStatus.RUNNING:
            self._running_command_id = command.id
        elif self._running_command_id == command.id:
            self._running_command_id = None
            if command.status != CommandStatus.QUEUED:
                self._recently_dequeued_command_id = command.id

    def fail(
        self, command_id: str, error_occurrence: ErrorOccurrence, failed_at: datetime
    ) -> None:
        prev_entry = self._commands_by_id[command_id]
        self._commands_by_id[command_id] = CommandEntry(
            index=prev_entry.index,
            # TODO(mc, 2022-06-06): add new "cancelled" status or similar
            # and don't set `completedAt` in commands other than the specific
            # one that failed
            # https://opentrons.atlassian.net/browse/EXEC-14
            command=prev_entry.command.copy(
                update={
                    "error": error_occurrence,
                    "completedAt": failed_at,
                    "status": CommandStatus.FAILED,
                }
            ),
        )

        self._failed_command_id = command_id
        if prev_entry.command.intent == CommandIntent.SETUP:
            other_command_ids_to_fail = self._queued_setup_command_ids
            self._queued_setup_command_ids.clear()
        else:
            other_command_ids_to_fail = self._queued_command_ids
            self._queued_command_ids.clear()

        for command_id in other_command_ids_to_fail:
            prev_entry = self._commands_by_id[command_id]

            self._commands_by_id[command_id] = CommandEntry(
                index=prev_entry.index,
                command=prev_entry.command.copy(
                    update={
                        "completedAt": failed_at,
                        "status": CommandStatus.FAILED,
                    }
                ),
            )

        if self._running_command_id == command_id:
            self._running_command_id = None
