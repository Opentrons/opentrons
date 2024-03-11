from collections import OrderedDict
from dataclasses import dataclass
from typing import Dict, List, Optional

from opentrons.ordered_set import OrderedSet
from opentrons.protocol_engine.commands.command import CommandIntent
from opentrons.protocol_engine.commands.command_unions import Command


@dataclass(frozen=True)
class CommandEntry:
    """An command entry in state, including its index in the list."""

    command: Command
    index: int


@dataclass  # dataclass for __eq__() autogeneration.
class CommandStructure:
    _all_command_ids: List[str]
    """All command IDs, in insertion order."""

    _queued_command_ids: OrderedSet[str]
    """The IDs of queued commands, in FIFO order"""

    _queued_setup_command_ids: OrderedSet[str]
    """The IDs of queued setup commands, in FIFO order"""

    _running_command_id: Optional[str]
    """The ID of the currently running command, if any"""

    _commands_by_id: Dict[str, CommandEntry]
    """All command resources, in insertion order, mapped by their unique IDs."""

    def __init__(self) -> None:
        self._all_command_ids = []
        self._running_command_id = None
        self._queued_command_ids = OrderedSet()
        self._queued_setup_command_ids = OrderedSet()
        self._commands_by_id = OrderedDict()

    def has(self, command_id: str) -> bool:
        return command_id in self._all_command_ids

    def get_if_present(self, command_id: str) -> Optional[Command]:
        entry = self._commands_by_id.get(command_id)
        return None if entry is None else entry.command

    def add(self, queued_command: Command) -> None:
        next_index = len(self._all_command_ids)
        self._all_command_ids.append(queued_command.id)
        self._commands_by_id[queued_command.id] = CommandEntry(
            index=next_index,
            command=queued_command,
        )

        if queued_command.intent == CommandIntent.SETUP:
            self._queued_setup_command_ids.add(queued_command.id)
        else:
            self._queued_command_ids.add(queued_command.id)
