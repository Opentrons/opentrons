"""Protocol engine commands sub-state."""
from __future__ import annotations
from collections import OrderedDict
from dataclasses import dataclass, replace
from typing import List, Mapping, Optional, Union

from ..actions import (
    Action,
    QueueCommandAction,
    UpdateCommandAction,
    FailCommandAction,
    PlayAction,
    PauseAction,
    StopAction,
    FinishAction,
    HardwareStoppedAction,
)

from ..commands import Command, CommandStatus
from ..errors import (
    ProtocolEngineError,
    CommandDoesNotExistError,
    ProtocolEngineStoppedError,
    ErrorOccurrence,
)
from ..types import EngineStatus
from .abstract_store import HasState, HandlesActions


@dataclass(frozen=True)
class CommandState:
    """State of all protocol engine command resources.

    Attributes:
        is_running_queue: Whether the engine is currently pulling new
            commands off the queue to execute. A command may still be
            executing, and the robot may still be in motion, even if False.
        is_hardware_stopped: Whether the engine's hardware has ceased
            motion. Once set, this flag cannot be unset.
        should_stop: Whether a graceful finish or an ungraceful stop has
            been requested. Once set, this flag cannot be unset.
        should_report_result: Whether the engine should report a success or
            failure status once stopped. If unset, the engine will simply
            report "stopped." Once set, this flag cannot be unset.
        commands_by_id: All command resources, in insertion order, mapped
            by their unique IDs.
        errors_by_id: All error occurrences, mapped by their unique IDs.
    """

    is_running_queue: bool
    is_hardware_stopped: bool
    should_stop: bool
    should_report_result: bool
    # TODO(mc, 2021-06-16): OrderedDict is mutable. Switch to Sequence + Mapping
    commands_by_id: OrderedDict[str, Command]
    errors_by_id: Mapping[str, ErrorOccurrence]


class CommandStore(HasState[CommandState], HandlesActions):
    """Command state container."""

    _state: CommandState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState(
            is_running_queue=True,
            is_hardware_stopped=False,
            should_stop=False,
            should_report_result=False,
            commands_by_id=OrderedDict(),
            errors_by_id={},
        )

    def handle_action(self, action: Action) -> None:  # noqa: C901
        """Modify state in reaction to an action."""
        errors_by_id: Mapping[str, ErrorOccurrence]

        if isinstance(action, QueueCommandAction):
            # TODO(mc, 2021-06-22): mypy has trouble with this automatic
            # request > command mapping, figure out how to type precisely
            # (or wait for a future mypy version that can figure it out).
            # For now, unit tests cover mapping every request type
            queued_command = action.request._CommandCls(
                id=action.command_id,
                createdAt=action.created_at,
                params=action.request.params,  # type: ignore[arg-type]
                status=CommandStatus.QUEUED,
            )
            commands_by_id = self._state.commands_by_id.copy()
            commands_by_id.update({queued_command.id: queued_command})

            self._state = replace(self._state, commands_by_id=commands_by_id)

        elif isinstance(action, UpdateCommandAction):
            command = action.command
            commands_by_id = self._state.commands_by_id.copy()
            commands_by_id.update({command.id: command})

            self._state = replace(self._state, commands_by_id=commands_by_id)

        elif isinstance(action, FailCommandAction):
            commands_by_id = self._state.commands_by_id.copy()
            errors_by_id = dict(self._state.errors_by_id)
            prev_command = commands_by_id[action.command_id]
            command = prev_command.copy(
                update={
                    "errorId": action.error_id,
                    "completedAt": action.failed_at,
                    "status": CommandStatus.FAILED,
                }
            )
            commands_by_id.update({command.id: command})
            errors_by_id[action.error_id] = ErrorOccurrence(
                id=action.error_id,
                createdAt=action.failed_at,
                errorType=type(action.error).__name__,
                detail=str(action.error),
            )

            self._state = replace(
                self._state,
                commands_by_id=commands_by_id,
                errors_by_id=errors_by_id,
            )

        elif isinstance(action, PlayAction):
            if not self._state.should_stop:
                self._state = replace(self._state, is_running_queue=True)

        elif isinstance(action, PauseAction):
            self._state = replace(self._state, is_running_queue=False)

        elif isinstance(action, StopAction):
            if not self._state.should_stop:
                self._state = replace(
                    self._state,
                    is_running_queue=False,
                    should_report_result=False,
                    should_stop=True,
                )

        elif isinstance(action, FinishAction):
            if not self._state.should_stop:
                # any `ProtocolEngineError`'s will be captured by `FailCommandAction`,
                # so only capture unknown errors here
                if action.error_details and not isinstance(
                    action.error_details.error,
                    ProtocolEngineError,
                ):
                    errors_by_id = dict(self._state.errors_by_id)
                    error_id = action.error_details.error_id
                    created_at = action.error_details.created_at
                    error = action.error_details.error

                    errors_by_id[error_id] = ErrorOccurrence(
                        id=error_id,
                        createdAt=created_at,
                        errorType=type(error).__name__,
                        detail=str(error),
                    )
                else:
                    errors_by_id = self._state.errors_by_id

                self._state = replace(
                    self._state,
                    is_running_queue=False,
                    should_report_result=True,
                    should_stop=True,
                    errors_by_id=errors_by_id,
                )

        elif isinstance(action, HardwareStoppedAction):
            self._state = replace(
                self._state,
                is_running_queue=False,
                is_hardware_stopped=True,
                should_stop=True,
            )


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

    def get_all_errors(self) -> List[ErrorOccurrence]:
        """Get a list of all errors that have occurred."""
        return list(self._state.errors_by_id.values())

    def get_next_queued(self) -> Optional[str]:
        """Return the next request in line to be executed.

        Returns:
            The ID of the earliest queued command, if any.

        Raises:
            EngineStoppedError:
        """
        if self._state.should_stop:
            raise ProtocolEngineStoppedError("Engine was stopped")

        if not self._state.is_running_queue:
            return None

        for command_id, command in self._state.commands_by_id.items():
            if command.status == CommandStatus.FAILED:
                raise ProtocolEngineStoppedError("Previous command failed.")
            elif command.status == CommandStatus.QUEUED:
                return command_id

        return None

    def get_is_running(self) -> bool:
        """Get whether the engine is running and queued commands should be executed."""
        return self._state.is_running_queue

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
        return self._state.should_stop

    def get_is_stopped(self) -> bool:
        """Get whether an engine stop has completed."""
        return self._state.is_hardware_stopped

    # TODO(mc, 2021-12-07): reject adding commands to a stopped engine
    def validate_action_allowed(self, action: Union[PlayAction, PauseAction]) -> None:
        """Validate if a PlayAction or PauseAction is allowed, raising if not.

        For safety / reliability reasons, a StopAction is always allowed.

        Raises:
            ProtocolEngineStoppedError: the engine has been stopped.
        """
        if self._state.should_stop:
            action_desc = "play" if isinstance(action, PlayAction) else "pause"
            raise ProtocolEngineStoppedError(f"Cannot {action_desc} a stopped engine.")

    def get_status(self) -> EngineStatus:
        """Get the current execution status of the engine."""
        all_commands = self._state.commands_by_id.values()
        all_errors = self._state.errors_by_id.values()
        all_statuses = [c.status for c in all_commands]

        if self._state.should_report_result:
            if not self._state.is_hardware_stopped:
                return EngineStatus.RUNNING
            elif any(all_errors):
                return EngineStatus.FAILED
            else:
                return EngineStatus.SUCCEEDED

        elif self._state.should_stop:
            if not self._state.is_hardware_stopped:
                return EngineStatus.STOP_REQUESTED
            else:
                return EngineStatus.STOPPED

        elif self._state.is_running_queue:
            any_running = any(s == CommandStatus.RUNNING for s in all_statuses)
            any_queued = any(s == CommandStatus.QUEUED for s in all_statuses)

            if any_running or any_queued:
                return EngineStatus.RUNNING

            else:
                return EngineStatus.IDLE

        else:
            return EngineStatus.PAUSED
