"""Protocol engine commands sub-state."""
import typing
from typing import List, Optional, Tuple
import collections

from ..commands import CommandType, CommandRequestType, PendingCommand, FailedCommand
from .substore import Substore


class CommandState:
    """Command state and getters."""

    _commands_by_id: typing.OrderedDict[str, CommandType]

    def __init__(self) -> None:
        """Initialize a CommandState instance."""
        self._commands_by_id = collections.OrderedDict()

    def get_command_by_id(self, uid: str) -> Optional[CommandType]:
        """Get a command by its unique identifier."""
        return self._commands_by_id.get(uid)

    def get_all_commands(self) -> List[Tuple[str, CommandType]]:
        """Get a list of all commands in state, paired with their respective IDs.

        Entries are returned in the order of first-added command to last-added command.
        Replacing a command (to change its status, for example) keeps its place in the
        ordering.
        """
        return [entry for entry in self._commands_by_id.items()]

    def get_next_request(self) -> Optional[Tuple[str, CommandRequestType]]:
        """Return the next request in line to be executed.

        Normally, this corresponds to the earliest-added command that's currently
        pending.

        But if any command added before that command is currently failed, None is
        returned instead. This models the entire protocol stopping when any command
        fails.

        If there are no pending commands at all, returns None.
        """
        for command_id, command in self._commands_by_id.items():
            if isinstance(command, FailedCommand):
                return None
            elif isinstance(command, PendingCommand):
                return command_id, command.request
        return None


class CommandStore(Substore[CommandState]):
    """Command state container."""

    _state: CommandState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState()

    def handle_command(self, command: CommandType, command_id: str) -> None:
        """Modify state in reaction to any command."""
        self._state._commands_by_id[command_id] = command
