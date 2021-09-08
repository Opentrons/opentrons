"""Protocol engine commands sub-state."""
from __future__ import annotations
from collections import OrderedDict
from dataclasses import dataclass, replace
from typing import List, Optional, Union

from ..commands import Command, CommandStatus
from ..errors import CommandDoesNotExistError, ProtocolEngineStoppedError
from ..types import EngineStatus
from .abstract_store import HasState, HandlesActions
from .actions import Action, UpdateCommandAction, PlayAction, PauseAction, StopAction


@dataclass(frozen=True)
class CommandState:
    """State of all protocol engine command resources."""

    is_running: bool
    stop_requested: bool
    # TODO(mc, 2021-06-16): OrderedDict is mutable. Switch to Sequence + Mapping
    commands_by_id: OrderedDict[str, Command]


class CommandStore(HasState[CommandState], HandlesActions):
    """Command state container."""

    _state: CommandState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState(
            is_running=False,
            stop_requested=False,
            commands_by_id=OrderedDict(),
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            command = action.command
            commands_by_id = self._state.commands_by_id.copy()
            commands_by_id.update({command.id: command})

            self._state = replace(self._state, commands_by_id=commands_by_id)

        elif isinstance(action, PlayAction):
            if not self._state.stop_requested:
                self._state = replace(self._state, is_running=True)

        elif isinstance(action, PauseAction):
            self._state = replace(self._state, is_running=False)

        elif isinstance(action, StopAction):
            self._state = replace(self._state, is_running=False, stop_requested=True)


class CommandView(HasState[CommandState]):
    """Read-only command state view."""

    _state: CommandState

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

        Returns:
            The ID of the earliest queued command, if any.

        Raises:
            EngineStoppedError:
        """
        if self._state.stop_requested:
            raise ProtocolEngineStoppedError("Engine was stopped")

        if not self._state.is_running:
            return None

        for command_id, command in self._state.commands_by_id.items():
            if command.status == CommandStatus.FAILED:
                raise ProtocolEngineStoppedError("Previous command failed.")
            elif command.status == CommandStatus.QUEUED:
                return command_id

        return None

    def get_is_running(self) -> bool:
        """Get whether the engine is running and queued commands should be executed."""
        return self._state.is_running

    def get_is_complete(self, command_id: str) -> bool:
        """Get whether a given command is completed.

        A command is "completed" if one of the following is true:

        - Its status is CommandStatus.SUCCEEDED
        - Its status is CommandStatus.FAILED
        - A command earlier in the queue has a status of CommandStatus.FAILED
             - In this case, the command in question will never run

        Arguments:
            command_id: Command to check.
        """
        for search_id, search_command in self._state.commands_by_id.items():
            search_status = search_command.status
            is_failed = search_status == CommandStatus.FAILED

            if search_id == command_id or is_failed:
                return search_status == CommandStatus.SUCCEEDED or is_failed

        return False

    def get_all_complete(self) -> bool:
        """Get whether all commands have completed.

        All commands have "completed" if one of the following is true:

        - All commands have a status of CommandStatus.SUCCEEDED
        - Any command has a status of CommandStatus.FAILED
        """
        for command in self._state.commands_by_id.values():
            if command.status == CommandStatus.FAILED:
                return True
            elif command.status != CommandStatus.SUCCEEDED:
                return False
        return True

    def get_stop_requested(self) -> bool:
        """Get whether an engine stop has been requested.

        A command may still be executing while the engine is stopping.
        """
        return self._state.stop_requested

    def validate_action_allowed(self, action: Union[PlayAction, PauseAction]) -> None:
        """Validate if a PlayAction or PauseAction is allowed, raising if not.

        For safety / reliability reasons, a StopAction is always allowed.

        Raises:
            ProtocolEngineStoppedError: the engine has been stopped.
        """
        if self._state.stop_requested:
            action_desc = "play" if isinstance(action, PlayAction) else "pause"
            raise ProtocolEngineStoppedError(f"Cannot {action_desc} a stopped engine.")

    def get_status(self) -> EngineStatus:
        """Get the current execution status of the engine."""
        all_commands = self._state.commands_by_id.values()
        all_statuses = [c.status for c in all_commands]

        if self._state.stop_requested:
            if all(s == CommandStatus.SUCCEEDED for s in all_statuses):
                return EngineStatus.SUCCEEDED

            elif any(s == CommandStatus.RUNNING for s in all_statuses):
                return EngineStatus.STOP_REQUESTED

            else:
                return EngineStatus.STOPPED

        elif any(s == CommandStatus.FAILED for s in all_statuses):
            return EngineStatus.FAILED

        elif not self._state.is_running:
            if all(s == CommandStatus.QUEUED for s in all_statuses):
                return EngineStatus.READY_TO_RUN

            elif any(s == CommandStatus.RUNNING for s in all_statuses):
                return EngineStatus.PAUSE_REQUESTED

            else:
                return EngineStatus.PAUSED

        else:
            return EngineStatus.RUNNING
