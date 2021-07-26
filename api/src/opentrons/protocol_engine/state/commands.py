"""Protocol engine commands sub-state."""
from __future__ import annotations
from collections import OrderedDict
from dataclasses import dataclass, replace
from typing import List, Optional

from ..commands import Command, CommandStatus
from ..errors import CommandDoesNotExistError, ProtocolEngineStoppedError
from ..types import EngineStatus
from .abstract_store import HasState, HandlesActions
from .actions import Action, UpdateCommandAction, PlayAction, PauseAction, StopAction


@dataclass(frozen=True)
class CommandState:
    """State of all protocol engine command resources."""

    is_running: bool
    is_stopped: bool
    # TODO(mc, 2021-06-16): OrderedDict is mutable. Switch to Sequence + Mapping
    commands_by_id: OrderedDict[str, Command]


class CommandStore(HasState[CommandState], HandlesActions):
    """Command state container."""

    _state: CommandState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState(
            is_running=False,
            is_stopped=False,
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
            if self._state.is_stopped:
                raise ProtocolEngineStoppedError("Cannot start a stopped protocol.")

            self._state = replace(self._state, is_running=True)

        elif isinstance(action, PauseAction):
            self._state = replace(self._state, is_running=False)

        elif isinstance(action, StopAction):
            self._state = replace(self._state, is_running=False, is_stopped=True)


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
            Normally, the ID of the earliest queued command. However, will return
                None if any command has failed (since a command failure is fatal
                to a protocol run) or if the engine is currently paused.
        """
        if self._state.is_running is False:
            return None

        for command_id, command in self._state.commands_by_id.items():
            if command.status == CommandStatus.FAILED:
                return None
            elif command.status == CommandStatus.QUEUED:
                return command_id

        return None

    def get_is_complete(self, command_id: Optional[str] = None) -> bool:
        """Get whether a given command is (or all commands are) completed.

        A command is "completed" if one of the following is true:

        - Its status is CommandStatus.SUCCEEDED
        - Its status is CommandStatus.FAILED
        - A command earlier in the queue has a status of CommandStatus.FAILED
             - In this case, the command in question will never run

        Arguments:
            command_id: Command to check. If omitted or `None`, will only
                return True if _all_ commands have completed.
        """
        for search_id, search_command in self._state.commands_by_id.items():
            search_status = search_command.status
            is_failed = search_status == CommandStatus.FAILED

            if search_id == command_id or is_failed:
                return search_status == CommandStatus.SUCCEEDED or is_failed
            elif command_id is None and search_status != CommandStatus.SUCCEEDED:
                return False

        return True if command_id is None else False

    def get_status(self) -> EngineStatus:
        """Get the current execution status of the engine."""
        if any(
            command.status == CommandStatus.FAILED
            for command in self._state.commands_by_id.values()
        ):
            return EngineStatus.FAILED

        if self._state.is_stopped:
            return EngineStatus.SUCCEEDED

        if self._state.is_running:
            return EngineStatus.RUNNING

        if all(
            command.status == CommandStatus.QUEUED
            for command in self._state.commands_by_id.values()
        ):
            return EngineStatus.READY_TO_START

        return EngineStatus.PAUSED
