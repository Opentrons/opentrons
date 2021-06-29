"""Protocol engine commands sub-state."""
from __future__ import annotations
from collections import OrderedDict
from dataclasses import dataclass, replace
from typing import List, Optional

from ..commands import Command, CommandStatus
from ..errors import CommandDoesNotExistError
from .substore import Substore, CommandReactive


@dataclass(frozen=True)
class CommandState:
    """State of all protocol engine command resources."""

    # TODO(mc, 2021-06-16): OrderedDict is mutable. Switch to Sequence + Mapping
    commands_by_id: OrderedDict[str, Command]


class CommandStore(Substore[CommandState], CommandReactive):
    """Command state container."""

    _state: CommandState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState(commands_by_id=OrderedDict())

    def handle_command(self, command: Command) -> None:
        """Modify state in reaction to any command."""
        commands_by_id = self._state.commands_by_id.copy()
        commands_by_id.update({command.id: command})

        self._state = replace(self._state, commands_by_id=commands_by_id)


class CommandView:
    """Read-only command state view."""

    def __init__(self, state: CommandState) -> None:
        """Initialize the view of command state with its underlying data."""
        self._state = state

    def get(self, command_id: str) -> Command:
        """Get a command by its unique identifier."""
        try:
            return self._state.commands_by_id[command_id]
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")

    def get_all(self) -> List[Command]:
        """Get a list of all commands in state.

        Entries are returned in the order of first-added command to last-added command.
        Replacing a command (to change its status, for example) keeps its place in the
        ordering.
        """
        return list(self._state.commands_by_id.values())

    def get_next_queued(self) -> Optional[str]:
        """Return the next request in line to be executed.

        Normally, this corresponds to the earliest-added command that's currently
        pending.

        But if any command added before that command is currently failed, None is
        returned instead. This models the entire protocol stopping when any command
        fails.

        If there are no pending commands at all, returns None.
        """
        for command_id, command in self._state.commands_by_id.items():
            if command.status == CommandStatus.FAILED:
                return None
            elif command.status == CommandStatus.QUEUED:
                return command_id
        return None
