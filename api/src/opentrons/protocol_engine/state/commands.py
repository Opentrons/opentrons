"""Protocol engine commands sub-state."""
from collections import OrderedDict
from dataclasses import dataclass, replace
from typing import List, Optional, OrderedDict as OrderedDictType, Tuple

from ..commands import CommandType, CommandRequestType, PendingCommand, FailedCommand
from .substore import Substore


@dataclass(frozen=True)
class CommandState:
    """State of all protocol engine command resources."""

    # TODO(mc, 2021-06-16): OrderedDict is mutable. Switch to Sequence + Mapping
    commands_by_id: OrderedDictType[str, CommandType]


class CommandStore(Substore[CommandState]):
    """Command state container."""

    _state: CommandState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState(commands_by_id=OrderedDict())

    def handle_command(self, command: CommandType, command_id: str) -> None:
        """Modify state in reaction to any command."""
        commands_by_id = self._state.commands_by_id.copy()
        commands_by_id.update({command_id: command})

        self._state = replace(self._state, commands_by_id=commands_by_id)


class CommandView:
    """Read-only command state view."""

    def __init__(self, state: CommandState) -> None:
        """Initialize the view of command state with its underlying data."""
        self._state = state

    def get_command_by_id(self, uid: str) -> Optional[CommandType]:
        """Get a command by its unique identifier."""
        return self._state.commands_by_id.get(uid)

    def get_all_commands(self) -> List[Tuple[str, CommandType]]:
        """Get a list of all commands in state, paired with their respective IDs.

        Entries are returned in the order of first-added command to last-added command.
        Replacing a command (to change its status, for example) keeps its place in the
        ordering.
        """
        return [entry for entry in self._state.commands_by_id.items()]

    def get_next_request(self) -> Optional[Tuple[str, CommandRequestType]]:
        """Return the next request in line to be executed.

        Normally, this corresponds to the earliest-added command that's currently
        pending.

        But if any command added before that command is currently failed, None is
        returned instead. This models the entire protocol stopping when any command
        fails.

        If there are no pending commands at all, returns None.
        """
        for command_id, command in self._state.commands_by_id.items():
            if isinstance(command, FailedCommand):
                return None
            elif isinstance(command, PendingCommand):
                return command_id, command.request
        return None
