"""Basic protocol engine create file data state and store."""
from dataclasses import dataclass
from typing import List

from ._abstract_store import HasState, HandlesActions
from ..actions import Action, SucceedCommandAction
from ..commands import (
    Command,
    absorbance_reader,
)


@dataclass
class FileState:
    """State of Engine created files."""

    file_ids: List[str]


class FileStore(HasState[FileState], HandlesActions):
    """File state container."""

    _state: FileState

    def __init__(self) -> None:
        """Initialize a File store and its state."""
        self._state = FileState(file_ids=[])

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, SucceedCommandAction):
            self._handle_command(action.command)

    def _handle_command(self, command: Command) -> None:
        if isinstance(command.result, absorbance_reader.ReadAbsorbanceResult):
            if command.result.fileIds is not None:
                self._state.file_ids.extend(command.result.fileIds)


class FileView(HasState[FileState]):
    """Read-only engine created file state view."""

    _state: FileState

    def __init__(self, state: FileState) -> None:
        """Initialize the view of file state.

        Arguments:
            state: File state dataclass used for tracking file creation status.
        """
        self._state = state

    def get_filecount(self) -> int:
        """Get the number of files currently created by the protocol."""
        return len(self._state.file_ids)

    def get_file_id_list(self) -> List[str]:
        """Get the list of files by file ID created by the protocol."""
        return self._state.file_ids
