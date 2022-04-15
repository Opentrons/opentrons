"""Protocol engine commands sub-state."""
from __future__ import annotations
from collections import OrderedDict
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Mapping, Optional

from opentrons.ordered_set import OrderedSet

from opentrons.hardware_control.types import DoorStateNotification, DoorState

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
    HardwareEventAction,
)

from ..commands import Command, CommandStatus
from ..errors import (
    ProtocolEngineError,
    CommandDoesNotExistError,
    ProtocolEngineStoppedError,
    ErrorOccurrence,
    RobotDoorOpenError,
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


@dataclass(frozen=True)
class CommandSlice:
    """A subset of all commands in state."""

    commands: List[Command]
    cursor: int
    total_length: int


@dataclass(frozen=True)
class CurrentCommand:
    """The "current" command's ID and index in the overall commands list."""

    command_id: str
    command_key: str
    created_at: datetime
    index: int


@dataclass(frozen=True)
class CommandEntry:
    """An command entry in state, including its index in the list."""

    command: Command
    index: int


@dataclass
class CommandState:
    """State of all protocol engine command resources."""

    all_command_ids: List[str]
    """All command IDs, in insertion order."""

    queued_command_ids: OrderedSet[str]
    """The IDs of queued commands, in FIFO order"""

    running_command_id: Optional[str]
    """The ID of the currently running command, if any"""

    commands_by_id: Dict[str, CommandEntry]
    """All command resources, in insertion order, mapped by their unique IDs."""

    queue_status: QueueStatus
    """Whether the engine is currently pulling new commands off the queue to execute.

    A command may still be executing, and the robot may still be in motion,
    even if INACTIVE.
    """

    is_hardware_stopped: bool
    """Whether the engine's hardware has ceased motion.

    Once set, this flag cannot be unset.
    """

    is_door_blocking: bool
    """Whether the door is open when enable_door_safety_switch feature flag is ON."""

    run_result: Optional[RunResult]
    """Whether the run is done and succeeded, failed, or stopped.

    Once set, this status cannot be unset.
    """

    errors_by_id: Dict[str, ErrorOccurrence]
    """All fatal error occurrences, mapped by their unique IDs.

    Individual command errors, which may or may not be fatal,
    are stored on the individual commands themselves.
    """


class CommandStore(HasState[CommandState], HandlesActions):
    """Command state container."""

    _state: CommandState

    def __init__(self, is_door_blocking: bool = False) -> None:
        """Initialize a CommandStore and its state."""
        self._state = CommandState(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            is_hardware_stopped=False,
            is_door_blocking=is_door_blocking,
            run_result=None,
            running_command_id=None,
            all_command_ids=[],
            queued_command_ids=OrderedSet(),
            commands_by_id=OrderedDict(),
            errors_by_id={},
        )

    def handle_action(self, action: Action) -> None:  # noqa: C901
        """Modify state in reaction to an action."""
        errors_by_id: Mapping[str, ErrorOccurrence]

        if isinstance(action, QueueCommandAction):
            assert action.command_id not in self._state.commands_by_id

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

            next_index = len(self._state.all_command_ids)
            self._state.all_command_ids.append(action.command_id)
            self._state.queued_command_ids.add(queued_command.id)
            self._state.commands_by_id[queued_command.id] = CommandEntry(
                index=next_index,
                command=queued_command,
            )

        # TODO(mc, 2021-12-28): replace "UpdateCommandAction" with explicit
        # state change actions (e.g. RunCommandAction, SucceedCommandAction)
        # to make a command's queue transition logic easier to follow
        elif isinstance(action, UpdateCommandAction):
            command = action.command
            prev_entry = self._state.commands_by_id.get(command.id)

            if prev_entry is None:
                index = len(self._state.all_command_ids)
                self._state.all_command_ids.append(command.id)
                self._state.commands_by_id[command.id] = CommandEntry(
                    index=index,
                    command=command,
                )
            else:
                self._state.commands_by_id[command.id] = CommandEntry(
                    index=prev_entry.index,
                    command=command,
                )

            try:
                self._state.queued_command_ids.remove(command.id)
            except KeyError:
                pass

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

            prev_entry = self._state.commands_by_id[action.command_id]
            self._state.commands_by_id[action.command_id] = CommandEntry(
                index=prev_entry.index,
                command=prev_entry.command.copy(
                    update={
                        "error": error_occurrence,
                        "completedAt": action.failed_at,
                        "status": CommandStatus.FAILED,
                    }
                ),
            )

            other_command_ids_to_fail = [
                *[i for i in self._state.queued_command_ids],
            ]

            for command_id in other_command_ids_to_fail:
                prev_entry = self._state.commands_by_id[command_id]

                self._state.commands_by_id[command_id] = CommandEntry(
                    index=prev_entry.index,
                    command=prev_entry.command.copy(
                        update={
                            "completedAt": action.failed_at,
                            "status": CommandStatus.FAILED,
                        }
                    ),
                )

            if self._state.running_command_id == action.command_id:
                self._state.running_command_id = None

            self._state.queued_command_ids.clear()

        elif isinstance(action, PlayAction):
            if not self._state.run_result:
                if self._state.is_door_blocking:
                    # Always inactivate queue when door is blocking
                    self._state.queue_status = QueueStatus.INACTIVE
                else:
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
                if action.set_run_status:
                    self._state.run_result = (
                        RunResult.SUCCEEDED
                        if not action.error_details
                        else RunResult.FAILED
                    )
                else:
                    self._state.run_result = RunResult.STOPPED

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

        elif isinstance(action, HardwareEventAction):
            if isinstance(action.event, DoorStateNotification):
                if action.event.blocking:
                    self._state.is_door_blocking = True
                    if self._state.queue_status != QueueStatus.IMPLICITLY_ACTIVE:
                        self._state.queue_status = QueueStatus.INACTIVE
                elif action.event.new_state == DoorState.CLOSED:
                    self._state.is_door_blocking = False


class CommandView(HasState[CommandState]):
    """Read-only command state view."""

    _state: CommandState

    def __init__(self, state: CommandState) -> None:
        """Initialize the view of command state with its underlying data."""
        self._state = state

    def get(self, command_id: str) -> Command:
        """Get a command by its unique identifier."""
        try:
            return self._state.commands_by_id[command_id].command
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")

    def get_all(self) -> List[Command]:
        """Get a list of all commands in state.

        Entries are returned in the order of first-added command to last-added command.
        Replacing a command (to change its status, for example) keeps its place in the
        ordering.
        """
        return [
            self._state.commands_by_id[cid].command
            for cid in self._state.all_command_ids
        ]

    def get_slice(
        self,
        cursor: Optional[int],
        length: int,
    ) -> CommandSlice:
        """Get a subset of commands around a given cursor.

        If the cursor is omitted, return the tail of `length` of the collection.
        """
        # TODO(mc, 2022-01-31): this is not the most performant way to implement
        # this; if this becomes a problem, change or the underlying data structure
        # to something that isn't just an OrderedDict
        all_command_ids = self._state.all_command_ids
        commands_by_id = self._state.commands_by_id
        total_length = len(all_command_ids)

        if cursor is None:
            cursor = total_length - length

        # start is inclusive, stop is exclusive
        actual_cursor = max(0, min(cursor, total_length - 1))
        stop = min(total_length, actual_cursor + length)
        command_ids = all_command_ids[actual_cursor:stop]
        commands = [commands_by_id[cid].command for cid in command_ids]

        return CommandSlice(
            commands=commands,
            cursor=actual_cursor,
            total_length=total_length,
        )

    def get_all_errors(self) -> List[ErrorOccurrence]:
        """Get a list of all errors that have occurred."""
        return list(self._state.errors_by_id.values())

    def get_current(self) -> Optional[CurrentCommand]:
        """Return the "current" command, if any.

        The "current" command is the command that is currently executing,
        or the most recent command to have completed.
        """
        if self._state.running_command_id:
            entry = self._state.commands_by_id[self._state.running_command_id]
            return CurrentCommand(
                command_id=entry.command.id,
                command_key=entry.command.key,
                created_at=entry.command.createdAt,
                index=entry.index,
            )

        # TODO(mc, 2022-02-07): this is O(n) in the worst case for no good reason.
        # Resolve prior to JSONv6 support, where this will matter.
        for reverse_index, cid in enumerate(reversed(self._state.all_command_ids)):
            if self.get_is_complete(cid):
                entry = self._state.commands_by_id[cid]
                return CurrentCommand(
                    command_id=entry.command.id,
                    command_key=entry.command.key,
                    created_at=entry.command.createdAt,
                    index=len(self._state.all_command_ids) - reverse_index - 1,
                )

        return None

    def get_next_queued(self) -> Optional[str]:
        """Return the next command in line to be executed.

        Returns:
            The ID of the earliest queued command, if any.

        Raises:
            ProtocolEngineStoppedError: The engine is currently stopped, so
                there are not queued commands.
        """
        if self._state.run_result:
            raise ProtocolEngineStoppedError("Engine was stopped")

        if self._state.queue_status == QueueStatus.INACTIVE:
            return None

        return next(iter(self._state.queued_command_ids), None)

    def get_is_okay_to_clear(self) -> bool:
        """Get whether the engine is stopped or unplayed so it could be removed."""
        if self.get_is_stopped() or self.get_status() == EngineStatus.IDLE:
            return True
        else:
            return False

    def get_is_door_blocking(self) -> bool:
        """Get whether the robot door is open when 'pause on door open' ff is True."""
        return self._state.is_door_blocking

    def get_is_implicitly_active(self) -> bool:
        """Get whether the queue is implicitly active, i.e., never 'played'."""
        return self._state.queue_status == QueueStatus.IMPLICITLY_ACTIVE

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

    def get_all_complete(self) -> bool:
        """Get whether all added commands have completed.

        See `get_is_complete()` for what counts as "completed."
        """
        # Since every command is either queued, running, failed, or succeeded,
        # "none running and none queued" == "all succeeded or failed".
        return (
            self._state.running_command_id is None
            and len(self._state.queued_command_ids) == 0
        )

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

    def raise_if_paused_by_blocking_door(self) -> None:
        """Raise if the engine is currently paused by an open door."""
        if self.get_status() == EngineStatus.BLOCKED_BY_OPEN_DOOR:
            raise RobotDoorOpenError("Front door or top window is currently open.")

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
            if self._state.is_door_blocking:
                return EngineStatus.BLOCKED_BY_OPEN_DOOR
            else:
                return EngineStatus.PAUSED

        else:
            any_running = self._state.running_command_id is not None
            any_queued = len(self._state.queued_command_ids) > 0

            if any_running or any_queued:
                return EngineStatus.RUNNING
            else:
                return EngineStatus.IDLE
