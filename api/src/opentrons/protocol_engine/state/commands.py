"""Protocol engine commands sub-state."""
from __future__ import annotations
from collections import OrderedDict
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Mapping, Optional, Union

from opentrons.ordered_set import OrderedSet

from opentrons.hardware_control.types import DoorState

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
    DoorChangeAction,
)

from ..commands import Command, CommandStatus, CommandIntent
from ..errors import (
    CommandDoesNotExistError,
    RunStoppedError,
    ErrorOccurrence,
    RobotDoorOpenError,
    SetupCommandNotAllowedError,
    PauseNotAllowedError,
    ProtocolCommandFailedError,
)
from ..types import EngineStatus
from .abstract_store import HasState, HandlesActions
from .config import Config


class QueueStatus(str, Enum):
    """Execution status of the command queue.

    Properties:
        SETUP: The engine has been created, but the run has not yet started.
            New protocol commands may be enqueued but will wait to execute.
            New setup commands may be enqueued and will execute immediately.
        RUNNING: The queue is running though protocol commands.
            New protocol commands may be enqueued and will execute immediately.
            New setup commands may not be enqueued.
        PAUSED: Execution of protocol commands has been paused.
            New protocol commands may be enqueued but wait to execute.
            New setup commands may not be enqueued.
    """

    SETUP = "setup"
    RUNNING = "running"
    PAUSED = "paused"


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

    queued_setup_command_ids: OrderedSet[str]
    """The IDs of queued setup commands, in FIFO order"""

    running_command_id: Optional[str]
    """The ID of the currently running command, if any"""

    commands_by_id: Dict[str, CommandEntry]
    """All command resources, in insertion order, mapped by their unique IDs."""

    queue_status: QueueStatus
    """Whether the engine is currently pulling new commands off the queue to execute.

    A command may still be executing, and the robot may still be in motion,
    even if INACTIVE.
    """

    run_started_at: Optional[datetime]
    """The time the run was started.

    Set when the first `PlayAction` is dispatched.
    """

    run_completed_at: Optional[datetime]
    """The time the run has completed.

    Set when 'HardwareStoppedAction' is dispatched.
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

    def __init__(
        self,
        *,
        config: Config,
        is_door_open: bool,
    ) -> None:
        """Initialize a CommandStore and its state."""
        self._config = config
        self._state = CommandState(
            queue_status=QueueStatus.SETUP,
            is_door_blocking=is_door_open and config.block_on_door_open,
            run_result=None,
            running_command_id=None,
            all_command_ids=[],
            queued_command_ids=OrderedSet(),
            queued_setup_command_ids=OrderedSet(),
            commands_by_id=OrderedDict(),
            errors_by_id={},
            run_completed_at=None,
            run_started_at=None,
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
                key=(
                    action.request.key
                    if action.request.key is not None
                    # TODO(mc, 2021-12-13): generate a command key from params and state
                    # https://github.com/Opentrons/opentrons/issues/8986
                    else action.command_id
                ),
                createdAt=action.created_at,
                params=action.request.params,  # type: ignore[arg-type]
                intent=action.request.intent,
                status=CommandStatus.QUEUED,
            )

            next_index = len(self._state.all_command_ids)
            self._state.all_command_ids.append(action.command_id)
            self._state.commands_by_id[queued_command.id] = CommandEntry(
                index=next_index,
                command=queued_command,
            )

            if action.request.intent == CommandIntent.SETUP:
                self._state.queued_setup_command_ids.add(queued_command.id)
            else:
                self._state.queued_command_ids.add(queued_command.id)

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

            self._state.queued_command_ids.discard(command.id)
            self._state.queued_setup_command_ids.discard(command.id)

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
                # TODO(mc, 2022-06-06): add new "cancelled" status or similar
                # and don't set `completedAt` in commands other than the
                # specific one that failed
                command=prev_entry.command.copy(
                    update={
                        "error": error_occurrence,
                        "completedAt": action.failed_at,
                        "status": CommandStatus.FAILED,
                    }
                ),
            )

            if prev_entry.command.intent == CommandIntent.SETUP:
                other_command_ids_to_fail = [
                    *[i for i in self._state.queued_setup_command_ids],
                ]
                self._state.queued_setup_command_ids.clear()
            else:
                other_command_ids_to_fail = [
                    *[i for i in self._state.queued_command_ids],
                ]
                self._state.queued_command_ids.clear()

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

        elif isinstance(action, PlayAction):
            if not self._state.run_result:
                self._state.run_started_at = (
                    self._state.run_started_at or action.requested_at
                )
                if self._state.is_door_blocking:
                    # Always inactivate queue when door is blocking
                    self._state.queue_status = QueueStatus.PAUSED
                else:
                    self._state.queue_status = QueueStatus.RUNNING

        elif isinstance(action, PauseAction):
            self._state.queue_status = QueueStatus.PAUSED

        elif isinstance(action, StopAction):
            if not self._state.run_result:
                self._state.queue_status = QueueStatus.PAUSED
                self._state.run_result = RunResult.STOPPED
                self._state.queued_command_ids.clear()

        elif isinstance(action, FinishAction):
            if not self._state.run_result:
                self._state.queue_status = QueueStatus.PAUSED
                if action.set_run_status:
                    self._state.run_result = (
                        RunResult.SUCCEEDED
                        if not action.error_details
                        else RunResult.FAILED
                    )
                else:
                    self._state.run_result = RunResult.STOPPED

                if action.error_details:
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
            self._state.queue_status = QueueStatus.PAUSED
            self._state.run_result = self._state.run_result or RunResult.STOPPED
            self._state.run_completed_at = (
                self._state.run_completed_at or action.completed_at
            )

        elif isinstance(action, DoorChangeAction):
            if self._config.block_on_door_open:
                if action.door_state == DoorState.OPEN:
                    self._state.is_door_blocking = True
                    if self._state.queue_status != QueueStatus.SETUP:
                        self._state.queue_status = QueueStatus.PAUSED
                elif action.door_state == DoorState.CLOSED:
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
            RunStoppedError: The engine is currently stopped, so
                there are not queued commands.
        """
        if self._state.run_result:
            raise RunStoppedError("Engine was stopped")

        # if there is a setup command queued, prioritize it
        next_setup_cmd = next(iter(self._state.queued_setup_command_ids), None)
        if self._state.queue_status != QueueStatus.PAUSED and next_setup_cmd:
            return next_setup_cmd

        # if the queue is running, return the next protocol command
        if self._state.queue_status == QueueStatus.RUNNING:
            return next(iter(self._state.queued_command_ids), None)

        # otherwise we've got nothing to do
        return None

    def get_is_okay_to_clear(self) -> bool:
        """Get whether the engine is stopped or sitting idly so it could be removed."""
        if self.get_is_stopped():
            return True
        elif (
            self.get_status() == EngineStatus.IDLE
            and self._state.running_command_id is None
            and len(self._state.queued_setup_command_ids) == 0
        ):
            return True
        else:
            return False

    def get_is_door_blocking(self) -> bool:
        """Get whether the robot door is open when 'pause on door open' ff is True."""
        return self._state.is_door_blocking

    def get_is_implicitly_active(self) -> bool:
        """Get whether the queue is implicitly active, i.e., never 'played'."""
        return self._state.queue_status == QueueStatus.SETUP

    def get_is_running(self) -> bool:
        """Get whether the protocol is running & queued commands should be executed."""
        return self._state.queue_status == QueueStatus.RUNNING

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

        Raises:
            CommandExecutionFailedError: if any added command failed.
        """
        no_command_running = self._state.running_command_id is None
        no_command_queued = len(self._state.queued_command_ids) == 0

        if no_command_running and no_command_queued:
            for command_id in self._state.all_command_ids:
                command = self._state.commands_by_id[command_id].command
                if command.error and command.intent != CommandIntent.SETUP:
                    raise ProtocolCommandFailedError(command.error.detail)
            return True
        else:
            return False

    def get_stop_requested(self) -> bool:
        """Get whether an engine stop has been requested.

        A command may still be executing while the engine is stopping.
        """
        return self._state.run_result is not None

    def get_is_stopped(self) -> bool:
        """Get whether an engine stop has completed."""
        return self._state.run_completed_at is not None

    def has_been_played(self) -> bool:
        """Get whether engine has started."""
        return self._state.run_started_at is not None

    def validate_action_allowed(
        self,
        action: Union[PlayAction, PauseAction, StopAction, QueueCommandAction],
    ) -> Union[PlayAction, PauseAction, StopAction, QueueCommandAction]:
        """Validate whether a given control action is allowed.

        Returns:
            The action, if valid.

        Raises:
            RunStoppedError: The engine has been stopped.
            RobotDoorOpenError: Cannot resume because the front door is open.
            PauseNotAllowedError: The engine is not running, so cannot be paused.
            SetupCommandNotAllowedError: The engine is running, so a setup command
                may not be added.
        """
        if self.get_stop_requested():
            raise RunStoppedError("The run has already stopped.")

        elif isinstance(action, PlayAction):
            if self.get_status() == EngineStatus.BLOCKED_BY_OPEN_DOOR:
                raise RobotDoorOpenError("Front door or top window is currently open.")

        elif isinstance(action, PauseAction):
            if not self.get_is_running():
                raise PauseNotAllowedError("Cannot pause a run that is not running.")

        elif (
            isinstance(action, QueueCommandAction)
            and action.request.intent == CommandIntent.SETUP
        ):
            if self._state.queue_status != QueueStatus.SETUP:
                raise SetupCommandNotAllowedError(
                    "Setup commands are not allowed after run has started."
                )

        return action

    def get_status(self) -> EngineStatus:
        """Get the current execution status of the engine."""
        if self._state.run_result:
            if not self.get_is_stopped():
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

        elif self._state.queue_status == QueueStatus.RUNNING:
            return EngineStatus.RUNNING

        elif self._state.queue_status == QueueStatus.PAUSED:
            if self._state.is_door_blocking:
                return EngineStatus.BLOCKED_BY_OPEN_DOOR
            else:
                return EngineStatus.PAUSED

        return EngineStatus.IDLE
