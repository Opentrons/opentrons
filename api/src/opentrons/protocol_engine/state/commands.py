"""Protocol engine commands sub-state."""
from typing import Dict, List, Optional, Tuple

from ..commands import CommandType
from .substore import Substore


class CommandState:
    """Command state and getters."""

    _commands_by_id: Dict[str, CommandType]

    def __init__(self) -> None:
        """Initialize a CommandState instance."""
        self._commands_by_id = {}

    def get_command_by_id(self, uid: str) -> Optional[CommandType]:
        """Get a command by its unique identifier."""
        return self._commands_by_id.get(uid)

    def get_all_commands(self) -> List[Tuple[str, CommandType]]:
        """Get a list of all command entries in state."""
        return [entry for entry in self._commands_by_id.items()]


class CommandStore(Substore[CommandState]):
    """Command state container."""

    _state: CommandState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState()

    def handle_command(self, command: CommandType, command_id: str) -> None:
        """Modify state in reaction to any command."""
        self._state._commands_by_id[command_id] = command
