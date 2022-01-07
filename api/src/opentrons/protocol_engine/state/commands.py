"""Protocol engine commands sub-state."""
from __future__ import annotations
from collections import OrderedDict
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Mapping, Optional
from typing_extensions import Literal
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


class QueueStatus(str, Enum):
    """Execution status of the command queue.

    Properties:
        IMPLICITLY_ACTIVE: The queue has been created, and the engine
            should pull commands off the queue to execute, but the queue
            has not yet been told explicitly to run.
        ACTIVE: The queue is running due to an explicit PlayAction.
        INACTIVE: New commands should not be pulled off the queue, though
            the latest command may be running if it was already processed.
    """

    IMPLICITLY_ACTIVE = "implicitly-active"
    ACTIVE = "active"
    INACTIVE = "inactive"


class RunResult(str, Enum):
    """Result of the run."""

    SUCCEEDED = "succeeded"
    FAILED = "failed"
    STOPPED = "stopped"


@dataclass
class CommandState:
    """State of all protocol engine command resources.

    Attributes:
        queue_status: Whether the engine is currently pulling new
            commands off the queue to execute. A command may still be
            executing, and the robot may still be in motion, even if INACTIVE.
        is_hardware_stopped: Whether the engine's hardware has ceased
            motion. Once set, this flag cannot be unset.
        run_result: Whether the run is done and succeeded, failed, or stopped.
            Once set, this status cannot be unset.
        running_command_id: The ID of the currently running command, if any.
        queued_command_ids: The IDs of queued commands in FIFO order.
            Implemented as an OrderedDict to behave like an ordered set.
        commands_by_id: All command resources, in insertion order, mapped
            by their unique IDs.
        errors_by_id: All error occurrences, mapped by their unique IDs.
    """

    queue_status: QueueStatus
    is_hardware_stopped: bool
    run_result: Optional[RunResult]
    running_command_id: Optional[str]
    queued_command_ids: OrderedDict[str, Literal[True]]
    commands_by_id: OrderedDict[str, Command]
    errors_by_id: Dict[str, ErrorOccurrence]


class CommandStore(HasState[CommandState], HandlesActions):
    """Command state container."""

    _state: CommandState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            is_hardware_stopped=False,
            run_result=None,
            running_command_id=None,
            queued_command_ids=OrderedDict(),
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
            queued_command = action.request._CommandCls.construct(
                id=action.command_id,
                key=action.command_key,
                createdAt=action.created_at,
                params=action.request.params,  # type: ignore[arg-type]
                status=CommandStatus.QUEUED,
            )

            self._state.commands_by_id[queued_command.id] = queued_command
            self._state.queued_command_ids[queued_command.id] = True

        # TODO(mc, 2021-12-28): replace "UpdateCommandAction" with explicit
        # state change actions (e.g. RunCommandAction, SucceedCommandAction)
        # to make a command's queue transition logic easier to follow
        elif isinstance(action, UpdateCommandAction):
            command = action.command

            self._state.commands_by_id[command.id] = command
            self._state.queued_command_ids.pop(command.id, None)

            if command.status == CommandStatus.RUNNING:
                self._state.running_command_id = command.id
            elif self._state.running_command_id == command.id:
                self._state.running_command_id = None

        elif isinstance(action, FailCommandAction):
            error_occurrence = ErrorOccurrence.construct(
                id=action.error_id,
                createdAt=action.failed_at,
                errorType=type(action.error).__name__,
                detail=str(action.error),
            )

            command_ids_to_fail = [
                action.command_id,
                *[i for i in self._state.queued_command_ids.keys()],
            ]

            for command_id in command_ids_to_fail:
                prev_command = self._state.commands_by_id[command_id]
                self._state.commands_by_id[command_id] = prev_command.copy(
                    update={
                        "errorId": action.error_id,
                        "completedAt": action.failed_at,
                        "status": CommandStatus.FAILED,
                    }
                )

            if self._state.running_command_id == action.command_id:
                self._state.running_command_id = None

            self._state.errors_by_id[action.error_id] = error_occurrence
            self._state.queued_command_ids.clear()

        elif isinstance(action, PlayAction):
            if not self._state.run_result:
                self._state.queue_status = QueueStatus.ACTIVE

        elif isinstance(action, PauseAction):
            self._state.queue_status = QueueStatus.INACTIVE

        elif isinstance(action, StopAction):
            if not self._state.run_result:
                self._state.queue_status = QueueStatus.INACTIVE
                self._state.run_result = RunResult.STOPPED

        elif isinstance(action, FinishAction):
            if not self._state.run_result:
                self._state.queue_status = QueueStatus.INACTIVE
                self._state.run_result = (
                    RunResult.SUCCEEDED
                    if not action.error_details
                    else RunResult.FAILED
                )

                # any `ProtocolEngineError`'s will be captured by `FailCommandAction`,
                # so only capture unknown errors here
                if action.error_details and not isinstance(
                    action.error_details.error,
                    ProtocolEngineError,
                ):
                    error_id = action.error_details.error_id
                    created_at = action.error_details.created_at
                    error = action.error_details.error

                    self._state.errors_by_id[error_id] = ErrorOccurrence.construct(
                        id=error_id,
                        createdAt=created_at,
                        errorType=type(error).__name__,
                        detail=str(error),
                    )

        elif isinstance(action, HardwareStoppedAction):
            self._state.queue_status = QueueStatus.INACTIVE
            self._state.run_result = self._state.run_result or RunResult.STOPPED
            self._state.is_hardware_stopped = True


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
        if self._state.run_result:
            raise ProtocolEngineStoppedError("Engine was stopped")

        if self._state.queue_status == QueueStatus.INACTIVE:
            return None

        return next(iter(self._state.queued_command_ids.keys()), None)

    def get_is_okay_to_clear(self) -> bool:
        """Get whether the engine is stopped or unplayed so it could be removed."""
        if self.get_is_stopped() or self.get_status() == EngineStatus.IDLE:
            return True

        return False

    def get_is_running(self) -> bool:
        """Get whether the engine is running and queued commands should be executed."""
        queue_status = self._state.queue_status
        return (
            queue_status == QueueStatus.IMPLICITLY_ACTIVE
            or queue_status == QueueStatus.ACTIVE
        )

    def get_is_complete(self, command_id: str) -> bool:
        """Get whether a given command is completed.

        A command is "completed" if one of the following is true:

        - Its status is CommandStatus.SUCCEEDED
        - Its status is CommandStatus.FAILED

        Arguments:
            command_id: Command to check.
        """
        status = self.get(command_id).status

        return status == CommandStatus.SUCCEEDED or status == CommandStatus.FAILED

    # TODO(mc, 2021-12-28): the method needs to be re-implemented prior to PAPIv3 prod
    # Implementation should take care to remain O(1)
    def get_all_complete(self) -> bool:
        """Get whether all commands have completed.

        All commands have "completed" if one of the following is true:

        - The hardware has been stopped
        - There are no queued nor running commands
        """
        raise NotImplementedError("CommandView.get_all_complete not yet implemented")

    def get_stop_requested(self) -> bool:
        """Get whether an engine stop has been requested.

        A command may still be executing while the engine is stopping.
        """
        return self._state.run_result is not None

    def get_is_stopped(self) -> bool:
        """Get whether an engine stop has completed."""
        return self._state.is_hardware_stopped

    # TODO(mc, 2021-12-07): reject adding commands to a stopped engine
    def raise_if_stop_requested(self) -> None:
        """Raise if a stop has already been requested.

        Mainly used to validate if an Action is allowed, raising if not.

        Raises:
            ProtocolEngineStoppedError: the engine has been stopped.
        """
        if self.get_stop_requested():
            raise ProtocolEngineStoppedError("Cannot modify a stopped engine.")

    def get_status(self) -> EngineStatus:
        """Get the current execution status of the engine."""
        if self._state.run_result:
            if not self._state.is_hardware_stopped:
                return (
                    EngineStatus.STOP_REQUESTED
                    if self._state.run_result == RunResult.STOPPED
                    else EngineStatus.FINISHING
                )
            elif self._state.run_result == RunResult.FAILED:
                return EngineStatus.FAILED
            elif self._state.run_result == RunResult.SUCCEEDED:
                return EngineStatus.SUCCEEDED
            else:
                return EngineStatus.STOPPED

        elif self._state.queue_status == QueueStatus.ACTIVE:
            return EngineStatus.RUNNING

        elif self._state.queue_status == QueueStatus.INACTIVE:
            return EngineStatus.PAUSED

        else:
            any_running = self._state.running_command_id is not None
            any_queued = len(self._state.queued_command_ids) > 0

            if any_running or any_queued:
                return EngineStatus.RUNNING

            else:
                return EngineStatus.IDLE
