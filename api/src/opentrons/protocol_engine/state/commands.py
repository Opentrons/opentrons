"""Protocol engine commands sub-state."""
import typing
from typing import List, Optional, Tuple
import collections

from ..commands import CommandType, CommandRequestType
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
        """Get a list of all command entries in state.
        
        Entries are returned in the order of first-added command to last-added command.
        Replacing a command (to change its status, for example) keeps its place in the
        ordering.
        """
        return [entry for entry in self._commands_by_id.items()]

    def get_next_request(self) -> Optional[Tuple[str, CommandRequestType]]:
        """Get the next pending request.

        If there are no more pending requests, or if the last command failed,
        return None instead.
        """
        raise NotImplementedError()


class CommandStore(Substore[CommandState]):
    """Command state container."""

    _state: CommandState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState()

    def handle_command(self, command: CommandType, command_id: str) -> None:
        """Modify state in reaction to any command."""
        self._state._commands_by_id[command_id] = command
