"""Protocol engine commands sub-state."""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from .. import command_models as cmd
from .substore import Substore


@dataclass
class CommandState:
    """Command state and getters."""
    _commands_by_id: Dict[str, cmd.CommandType] = field(default_factory=dict)

    def get_command_by_id(self, uid: str) -> Optional[cmd.CommandType]:
        """Get a command by its unique identifier."""
        return self._commands_by_id.get(uid)

    def get_all_commands(self) -> List[Tuple[str, cmd.CommandType]]:
        """Get a list of all command entries in state."""
        return [entry for entry in self._commands_by_id.items()]


class CommandStore(Substore[CommandState]):
    def __init__(self):
        self._state = CommandState()

    def handle_command(
        self,
        command: cmd.CommandType,
        command_id: str
    ) -> None:
        """Modify state in reaction to any command."""
        self._state._commands_by_id[command_id] = command
