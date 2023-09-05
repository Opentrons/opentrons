"""Labware state store tests."""
import pytest
from contextlib import nullcontext as does_not_raise
from datetime import datetime
from typing import List, NamedTuple, Optional, Sequence, Type, Union

from opentrons.ordered_set import OrderedSet

from opentrons.protocol_engine import EngineStatus, commands as cmd, errors
from opentrons.protocol_engine.actions import (
    PlayAction,
    PauseAction,
    PauseSource,
    StopAction,
    QueueCommandAction,
)

from opentrons.protocol_engine.state.commands import (
    CommandState,
    CommandView,
    CommandSlice,
    CommandEntry,
    CurrentCommand,
    RunResult,
    QueueStatus,
)
from opentrons.protocol_engine.errors import ProtocolCommandFailedError

from .command_fixtures import (
    create_queued_command,
    create_running_command,
    create_failed_command,
    create_succeeded_command,
)


def get_command_view(
    queue_status: QueueStatus = QueueStatus.SETUP,
    run_completed_at: Optional[datetime] = None,
    run_started_at: Optional[datetime] = None,
    is_door_blocking: bool = False,
    run_result: Optional[RunResult] = None,
    running_command_id: Optional[str] = None,
    queued_command_ids: Sequence[str] = (),
    queued_setup_command_ids: Sequence[str] = (),
    run_error: Optional[errors.ErrorOccurrence] = None,
    finish_error: Optional[errors.ErrorOccurrence] = None,
    commands: Sequence[cmd.Command] = (),
    latest_command_hash: Optional[str] = None,
) -> CommandView:
    """Get a command view test subject."""
    all_command_ids = [command.id for command in commands]
    commands_by_id = {
        command.id: CommandEntry(index=index, command=command)
        for index, command in enumerate(commands)
    }

    state = CommandState(
        queue_status=queue_status,
        run_completed_at=run_completed_at,
        is_door_blocking=is_door_blocking,
        run_result=run_result,
        running_command_id=running_command_id,
        queued_command_ids=OrderedSet(queued_command_ids),
        queued_setup_command_ids=OrderedSet(queued_setup_command_ids),
        run_error=run_error,
        finish_error=finish_error,
        all_command_ids=all_command_ids,
        commands_by_id=commands_by_id,
        run_started_at=run_started_at,
        latest_command_hash=latest_command_hash,
        stopped_by_estop=False,
    )

    return CommandView(state=state)


def test_get_by_id() -> None:
    """It should get a command by ID from state."""
    command = create_succeeded_command(command_id="command-id")
    subject = get_command_view(commands=[command])

    assert subject.get("command-id") == command


def test_get_command_bad_id() -> None:
    """It should raise if a requested command ID isn't in state."""
    command = create_succeeded_command(command_id="command-id")
    subject = get_command_view(commands=[command])

    with pytest.raises(errors.CommandDoesNotExistError):
        subject.get("asdfghjkl")


def test_get_all() -> None:
    """It should get all the commands from the state."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_running_command(command_id="command-id-2")
    command_3 = create_queued_command(command_id="command-id-3")

    subject = get_command_view(commands=[command_1, command_2, command_3])

    assert subject.get_all() == [command_1, command_2, command_3]


def test_get_next_to_execute_returns_first_queued() -> None:
    """It should return the next queued command ID."""
    subject = get_command_view(
        queue_status=QueueStatus.RUNNING,
        queued_command_ids=["command-id-1", "command-id-2"],
    )

    assert subject.get_next_to_execute() == "command-id-1"


@pytest.mark.parametrize(
    "queue_status",
    [QueueStatus.SETUP, QueueStatus.RUNNING],
)
def test_get_next_to_execute_prioritizes_setup_command_queue(
    queue_status: QueueStatus,
) -> None:
    """It should prioritize setup command queue over protocol command queue."""
    subject = get_command_view(
        queue_status=queue_status,
        queued_command_ids=["command-id-1", "command-id-2"],
        queued_setup_command_ids=["setup-command-id"],
    )

    assert subject.get_next_to_execute() == "setup-command-id"


def test_get_next_to_execute_returns_none_when_no_queued() -> None:
    """It should return None if there are no queued commands."""
    subject = get_command_view(
        queue_status=QueueStatus.RUNNING,
        queued_command_ids=[],
    )

    assert subject.get_next_to_execute() is None


@pytest.mark.parametrize("queue_status", [QueueStatus.SETUP, QueueStatus.PAUSED])
def test_get_next_to_execute_returns_none_if_not_running(
    queue_status: QueueStatus,
) -> None:
    """It should not return protocol commands if the engine is not running."""
    subject = get_command_view(
        queue_status=queue_status,
        queued_setup_command_ids=[],
        queued_command_ids=["command-id-1", "command-id-2"],
    )
    result = subject.get_next_to_execute()

    assert result is None


def test_get_next_to_execute_returns_no_commands_if_paused() -> None:
    """It should not return any type of command if the engine is paused."""
    subject = get_command_view(
        queue_status=QueueStatus.PAUSED,
        queued_setup_command_ids=["setup-id-1", "setup-id-2"],
        queued_command_ids=["command-id-1", "command-id-2"],
    )
    result = subject.get_next_to_execute()

    assert result is None


@pytest.mark.parametrize("run_result", RunResult)
def test_get_next_to_execute_raises_if_stopped(run_result: RunResult) -> None:
    """It should raise if an engine stop has been requested."""
    subject = get_command_view(run_result=run_result)

    with pytest.raises(errors.RunStoppedError):
        subject.get_next_to_execute()


def test_get_is_running_queue() -> None:
    """It should be able to get if the engine is running."""
    subject = get_command_view(queue_status=QueueStatus.PAUSED)
    assert subject.get_is_running() is False

    subject = get_command_view(queue_status=QueueStatus.RUNNING)
    assert subject.get_is_running() is True

    subject = get_command_view(queue_status=QueueStatus.SETUP)
    assert subject.get_is_running() is False


def test_get_command_is_final() -> None:
    """It should be able to tell if a command is complete."""
    completed_command = create_succeeded_command(command_id="completed-command-id")
    failed_command = create_failed_command(command_id="failed-command-id")
    running_command = create_running_command(command_id="running-command-id")
    pending_command = create_queued_command(command_id="queued-command-id")

    subject = get_command_view(
        commands=[completed_command, failed_command, running_command, pending_command]
    )

    assert subject.get_command_is_final("completed-command-id") is True
    assert subject.get_command_is_final("failed-command-id") is True
    assert subject.get_command_is_final("running-command-id") is False
    assert subject.get_command_is_final("queued-command-id") is False


@pytest.mark.parametrize("run_result", RunResult)
def test_get_command_is_final_when_run_has_result(run_result: RunResult) -> None:
    """Queued commands are final when the run will never execute any more commands."""
    completed_command = create_succeeded_command(command_id="completed-command-id")
    failed_command = create_failed_command(command_id="failed-command-id")
    running_command = create_running_command(command_id="running-command-id")
    pending_command = create_queued_command(command_id="queued-command-id")

    subject = get_command_view(
        commands=[completed_command, failed_command, running_command, pending_command],
        run_result=run_result,
    )

    assert subject.get_command_is_final("completed-command-id") is True
    assert subject.get_command_is_final("failed-command-id") is True
    assert subject.get_command_is_final("running-command-id") is False
    assert subject.get_command_is_final("queued-command-id") is True


def test_get_all_commands_final() -> None:
    """It should return True if no commands queued or running."""
    subject = get_command_view(queued_command_ids=[])
    assert subject.get_all_commands_final() is True

    subject = get_command_view(queued_command_ids=["queued-command-id"])
    assert subject.get_all_commands_final() is False

    subject = get_command_view(
        queued_command_ids=[], running_command_id="running-command-id"
    )
    assert subject.get_all_commands_final() is False


def test_get_all_complete_fatal_command_failure() -> None:
    """It should raise an error if any protocol commands failed."""
    completed_command = create_succeeded_command(command_id="command-id-1")
    failed_command = create_failed_command(
        command_id="command-id-2",
        error=errors.ErrorOccurrence(
            id="some-error-id",
            errorType="PrettyBadError",
            createdAt=datetime(year=2021, month=1, day=1),
            detail="Oh no",
            errorCode="4321",
        ),
    )

    subject = get_command_view(
        queued_command_ids=[],
        running_command_id=None,
        commands=[completed_command, failed_command],
    )

    with pytest.raises(ProtocolCommandFailedError):
        subject.get_all_commands_final()


def test_get_all_complete_setup_not_fatal() -> None:
    """It should not call setup command fatal."""
    completed_command = create_succeeded_command(command_id="command-id-1")
    failed_command = create_failed_command(
        command_id="command-id-2",
        intent=cmd.CommandIntent.SETUP,
        error=errors.ErrorOccurrence(
            id="some-error-id",
            errorType="PrettyBadError",
            createdAt=datetime(year=2021, month=1, day=1),
            detail="Oh no",
            errorCode="4321",
        ),
    )

    subject = get_command_view(
        queued_command_ids=[],
        running_command_id=None,
        commands=[completed_command, failed_command],
    )

    result = subject.get_all_commands_final()
    assert result is True


def test_get_is_stopped() -> None:
    """It should return true if stop requested and no command running."""
    subject = get_command_view(run_completed_at=None)
    assert subject.get_is_stopped() is False

    subject = get_command_view(run_completed_at=datetime(year=2021, day=1, month=1))
    assert subject.get_is_stopped() is True


def test_get_is_started() -> None:
    """It should return true if start requested and no command running."""
    subject = get_command_view(run_started_at=None)
    assert subject.has_been_played() is False

    subject = get_command_view(run_started_at=datetime(year=2021, day=1, month=1))
    assert subject.has_been_played() is True


class ActionAllowedSpec(NamedTuple):
    """Spec data to test CommandView.validate_action_allowed."""

    subject: CommandView
    action: Union[PlayAction, PauseAction, StopAction, QueueCommandAction]
    expected_error: Optional[Type[errors.ProtocolEngineError]]


action_allowed_specs: List[ActionAllowedSpec] = [
    # play is allowed if the engine is idle
    ActionAllowedSpec(
        subject=get_command_view(queue_status=QueueStatus.SETUP),
        action=PlayAction(requested_at=datetime(year=2021, month=1, day=1)),
        expected_error=None,
    ),
    # play is allowed if engine is idle, even if door is blocking
    ActionAllowedSpec(
        subject=get_command_view(is_door_blocking=True, queue_status=QueueStatus.SETUP),
        action=PlayAction(requested_at=datetime(year=2021, month=1, day=1)),
        expected_error=None,
    ),
    # play is allowed if the engine is paused
    ActionAllowedSpec(
        subject=get_command_view(queue_status=QueueStatus.PAUSED),
        action=PlayAction(requested_at=datetime(year=2021, month=1, day=1)),
        expected_error=None,
    ),
    # pause is allowed if the engine is running
    ActionAllowedSpec(
        subject=get_command_view(queue_status=QueueStatus.RUNNING),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=None,
    ),
    # stop is usually allowed
    ActionAllowedSpec(
        subject=get_command_view(),
        action=StopAction(),
        expected_error=None,
    ),
    # queue command is allowed during setup
    ActionAllowedSpec(
        subject=get_command_view(queue_status=QueueStatus.SETUP),
        action=QueueCommandAction(
            request=cmd.HomeCreate(params=cmd.HomeParams()),
            request_hash=None,
            command_id="command-id",
            created_at=datetime(year=2021, month=1, day=1),
        ),
        expected_error=None,
    ),
    # play is disallowed if paused and door is blocking
    ActionAllowedSpec(
        subject=get_command_view(
            is_door_blocking=True, queue_status=QueueStatus.PAUSED
        ),
        action=PlayAction(requested_at=datetime(year=2021, month=1, day=1)),
        expected_error=errors.RobotDoorOpenError,
    ),
    # play is disallowed if stop has been requested
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.STOPPED),
        action=PlayAction(requested_at=datetime(year=2021, month=1, day=1)),
        expected_error=errors.RunStoppedError,
    ),
    # pause is disallowed if stop has been requested
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.STOPPED),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=errors.RunStoppedError,
    ),
    # pause is disallowed if engine is not running
    ActionAllowedSpec(
        subject=get_command_view(queue_status=QueueStatus.SETUP),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=errors.PauseNotAllowedError,
    ),
    # pause is disallowed if engine is already paused
    ActionAllowedSpec(
        subject=get_command_view(queue_status=QueueStatus.PAUSED),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=errors.PauseNotAllowedError,
    ),
    # stop is disallowed if stop has already been requested
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.STOPPED),
        action=StopAction(),
        expected_error=errors.RunStoppedError,
    ),
    # queue command action is disallowed if stop has already been requested
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.STOPPED),
        action=QueueCommandAction(
            request=cmd.HomeCreate(params=cmd.HomeParams()),
            request_hash=None,
            command_id="command-id",
            created_at=datetime(year=2021, month=1, day=1),
        ),
        expected_error=errors.RunStoppedError,
    ),
    # queue setup command is disallowed if paused
    ActionAllowedSpec(
        subject=get_command_view(queue_status=QueueStatus.PAUSED),
        action=QueueCommandAction(
            request=cmd.HomeCreate(
                params=cmd.HomeParams(),
                intent=cmd.CommandIntent.SETUP,
            ),
            request_hash=None,
            command_id="command-id",
            created_at=datetime(year=2021, month=1, day=1),
        ),
        expected_error=errors.SetupCommandNotAllowedError,
    ),
    # queue setup command is disallowed if running
    ActionAllowedSpec(
        subject=get_command_view(queue_status=QueueStatus.RUNNING),
        action=QueueCommandAction(
            request=cmd.HomeCreate(
                params=cmd.HomeParams(),
                intent=cmd.CommandIntent.SETUP,
            ),
            request_hash=None,
            command_id="command-id",
            created_at=datetime(year=2021, month=1, day=1),
        ),
        expected_error=errors.SetupCommandNotAllowedError,
    ),
]


@pytest.mark.parametrize(ActionAllowedSpec._fields, action_allowed_specs)
def test_validate_action_allowed(
    subject: CommandView,
    action: Union[PlayAction, PauseAction, StopAction],
    expected_error: Optional[Type[errors.ProtocolEngineError]],
) -> None:
    """It should validate allowed play/pause/stop actions."""
    expectation = pytest.raises(expected_error) if expected_error else does_not_raise()

    with expectation:  # type: ignore[attr-defined]
        result = subject.validate_action_allowed(action)

    if expected_error is None:
        assert result == action


def test_get_errors() -> None:
    """It should be able to pull all ErrorOccurrences from the store."""
    run_error = errors.ErrorOccurrence(
        id="error-1",
        createdAt=datetime(year=2021, month=1, day=1),
        errorType="ReallyBadError",
        detail="things could not get worse",
        errorCode="4321",
    )
    finish_error = errors.ErrorOccurrence(
        id="error-2",
        createdAt=datetime(year=2022, month=2, day=2),
        errorType="EvenWorseError",
        detail="things got worse",
        errorCode="1234",
    )

    no_error_subject = get_command_view()
    assert no_error_subject.get_error() is None

    just_run_error_subject = get_command_view(run_error=run_error)
    assert just_run_error_subject.get_error() == run_error

    just_finish_error_subject = get_command_view(finish_error=finish_error)
    assert just_finish_error_subject.get_error() == finish_error

    both_errors_subject = get_command_view(
        run_error=run_error, finish_error=finish_error
    )
    both_errors_result = both_errors_subject.get_error()
    assert both_errors_result is not None
    assert both_errors_result.wrappedErrors == [run_error, finish_error]


class GetStatusSpec(NamedTuple):
    """Spec data for get_status tests."""

    subject: CommandView
    expected_status: EngineStatus


get_status_specs: List[GetStatusSpec] = [
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.RUNNING,
            running_command_id=None,
            queued_command_ids=[],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.PAUSED,
            run_result=RunResult.SUCCEEDED,
            run_completed_at=None,
        ),
        expected_status=EngineStatus.FINISHING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.PAUSED,
            run_result=RunResult.FAILED,
            run_completed_at=None,
        ),
        expected_status=EngineStatus.FINISHING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.PAUSED,
        ),
        expected_status=EngineStatus.PAUSED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.FAILED,
            run_completed_at=datetime(year=2021, day=1, month=1),
        ),
        expected_status=EngineStatus.FAILED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.SUCCEEDED,
            run_completed_at=datetime(year=2021, day=1, month=1),
            finish_error=errors.ErrorOccurrence(
                id="finish-error-id",
                errorType="finish-error-type",
                createdAt=datetime(year=2021, day=1, month=1),
                detail="finish-error-detail",
            ),
        ),
        expected_status=EngineStatus.FAILED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.SUCCEEDED,
            run_completed_at=datetime(year=2021, day=1, month=1),
        ),
        expected_status=EngineStatus.SUCCEEDED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.STOPPED,
            run_completed_at=None,
        ),
        expected_status=EngineStatus.STOP_REQUESTED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.STOPPED,
            run_completed_at=datetime(year=2021, day=1, month=1),
        ),
        expected_status=EngineStatus.STOPPED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.PAUSED,
            is_door_blocking=True,
        ),
        expected_status=EngineStatus.BLOCKED_BY_OPEN_DOOR,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.SETUP,
            is_door_blocking=True,
        ),
        expected_status=EngineStatus.IDLE,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.PAUSED,
            is_door_blocking=False,
            run_completed_at=datetime(year=2021, day=1, month=1),
        ),
        expected_status=EngineStatus.PAUSED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.SETUP,
            running_command_id="command-id",
            queued_command_ids=["command-id-1"],
            queued_setup_command_ids=["command-id-2"],
        ),
        expected_status=EngineStatus.IDLE,
    ),
]


@pytest.mark.parametrize(GetStatusSpec._fields, get_status_specs)
def test_get_status(subject: CommandView, expected_status: EngineStatus) -> None:
    """It should set a status according to the command queue and running flag."""
    assert subject.get_status() == expected_status


class GetOkayToClearSpec(NamedTuple):
    """Spec data for get_status tests."""

    subject: CommandView
    expected_is_okay: bool


get_okay_to_clear_specs: List[GetOkayToClearSpec] = [
    GetOkayToClearSpec(
        # Protocol not played yet, no commands queued or ran yet
        subject=get_command_view(
            queue_status=QueueStatus.SETUP,
            running_command_id=None,
            queued_command_ids=[],
            queued_setup_command_ids=[],
        ),
        expected_is_okay=True,
    ),
    GetOkayToClearSpec(
        # Protocol commands are queued but not played yet,
        # no setup commands queued or running
        subject=get_command_view(
            queue_status=QueueStatus.SETUP,
            running_command_id=None,
            queued_setup_command_ids=[],
            queued_command_ids=["command-id"],
            commands=[create_queued_command(command_id="command-id")],
        ),
        expected_is_okay=True,
    ),
    GetOkayToClearSpec(
        # Protocol not played yet, setup commands are queued
        subject=get_command_view(
            queue_status=QueueStatus.SETUP,
            running_command_id=None,
            queued_setup_command_ids=["command-id"],
            commands=[create_queued_command(command_id="command-id")],
        ),
        expected_is_okay=False,
    ),
    GetOkayToClearSpec(
        # Protocol is stopped
        subject=get_command_view(
            run_completed_at=datetime(year=2021, day=1, month=1),
        ),
        expected_is_okay=True,
    ),
]


@pytest.mark.parametrize(GetOkayToClearSpec._fields, get_okay_to_clear_specs)
def test_get_okay_to_clear(subject: CommandView, expected_is_okay: bool) -> None:
    """It should report whether an engine is ok to clear."""
    assert subject.get_is_okay_to_clear() is expected_is_okay


def test_get_current() -> None:
    """It should return the "current" command."""
    subject = get_command_view(
        running_command_id=None,
        queued_command_ids=[],
    )
    assert subject.get_current() is None

    command = create_running_command(
        "command-id",
        command_key="command-key",
        created_at=datetime(year=2021, month=1, day=1),
    )
    subject = get_command_view(
        running_command_id="command-id",
        queued_command_ids=[],
        commands=[command],
    )
    assert subject.get_current() == CurrentCommand(
        index=0,
        command_id="command-id",
        command_key="command-key",
        created_at=datetime(year=2021, month=1, day=1),
    )

    command_1 = create_succeeded_command(
        "command-id-1",
        command_key="key-1",
        created_at=datetime(year=2021, month=1, day=1),
    )
    command_2 = create_succeeded_command(
        "command-id-2",
        command_key="key-2",
        created_at=datetime(year=2022, month=2, day=2),
    )
    subject = get_command_view(commands=[command_1, command_2])
    assert subject.get_current() == CurrentCommand(
        index=1,
        command_id="command-id-2",
        command_key="key-2",
        created_at=datetime(year=2022, month=2, day=2),
    )

    command_1 = create_succeeded_command(
        "command-id-1",
        command_key="key-1",
        created_at=datetime(year=2021, month=1, day=1),
    )
    command_2 = create_failed_command(
        "command-id-2",
        command_key="key-2",
        created_at=datetime(year=2022, month=2, day=2),
    )
    subject = get_command_view(commands=[command_1, command_2])
    assert subject.get_current() == CurrentCommand(
        index=1,
        command_id="command-id-2",
        command_key="key-2",
        created_at=datetime(year=2022, month=2, day=2),
    )


def test_get_slice_empty() -> None:
    """It should return a slice from the tail if no current command."""
    subject = get_command_view(commands=[])
    result = subject.get_slice(cursor=None, length=2)

    assert result == CommandSlice(commands=[], cursor=0, total_length=0)


def test_get_slice() -> None:
    """It should return a slice of all commands."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_running_command(command_id="command-id-2")
    command_3 = create_queued_command(command_id="command-id-3")
    command_4 = create_queued_command(command_id="command-id-4")

    subject = get_command_view(commands=[command_1, command_2, command_3, command_4])

    result = subject.get_slice(cursor=1, length=3)

    assert result == CommandSlice(
        commands=[command_2, command_3, command_4],
        cursor=1,
        total_length=4,
    )

    result = subject.get_slice(cursor=-3, length=10)

    assert result == CommandSlice(
        commands=[command_1, command_2, command_3, command_4],
        cursor=0,
        total_length=4,
    )


def test_get_slice_default_cursor_no_current() -> None:
    """It should return a slice from the tail if no current command."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_succeeded_command(command_id="command-id-2")
    command_3 = create_succeeded_command(command_id="command-id-3")
    command_4 = create_succeeded_command(command_id="command-id-4")

    subject = get_command_view(commands=[command_1, command_2, command_3, command_4])

    result = subject.get_slice(cursor=None, length=3)

    assert result == CommandSlice(
        commands=[command_2, command_3, command_4],
        cursor=1,
        total_length=4,
    )


def test_get_slice_default_cursor_running() -> None:
    """It should select a cursor based on the running command, if present."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_succeeded_command(command_id="command-id-2")
    command_3 = create_running_command(command_id="command-id-3")
    command_4 = create_queued_command(command_id="command-id-4")
    command_5 = create_queued_command(command_id="command-id-5")

    subject = get_command_view(
        commands=[command_1, command_2, command_3, command_4, command_5],
        running_command_id="command-id-3",
    )

    result = subject.get_slice(cursor=None, length=2)

    assert result == CommandSlice(
        commands=[command_3, command_4],
        cursor=2,
        total_length=5,
    )


def test_get_slice_default_cursor_queued() -> None:
    """It should select a cursor based on the next queued command, if present."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_succeeded_command(command_id="command-id-2")
    command_3 = create_succeeded_command(command_id="command-id-3")
    command_4 = create_queued_command(command_id="command-id-4")
    command_5 = create_queued_command(command_id="command-id-5")

    subject = get_command_view(
        commands=[command_1, command_2, command_3, command_4, command_5],
        running_command_id=None,
        queued_command_ids=["command-id-4", "command-id-4", "command-id-5"],
    )

    result = subject.get_slice(cursor=None, length=2)

    assert result == CommandSlice(
        commands=[command_3, command_4],
        cursor=2,
        total_length=5,
    )


def test_get_latest_command_hash() -> None:
    """It should get the latest command hash from state, if set."""
    subject = get_command_view(latest_command_hash="abc123")
    assert subject.get_latest_command_hash() == "abc123"
