"""Labware state store tests."""
import pytest
from collections import OrderedDict
from contextlib import nullcontext as does_not_raise
from datetime import datetime
from typing import Dict, List, NamedTuple, Optional, Sequence, Tuple, Type, Union

from opentrons.protocol_engine import EngineStatus, commands as cmd, errors
from opentrons.protocol_engine.actions import PlayAction, PauseAction, PauseSource

from opentrons.protocol_engine.state.commands import (
    CommandState,
    CommandView,
    RunResult,
    QueueStatus,
)

from .command_fixtures import (
    create_queued_command,
    create_running_command,
    create_failed_command,
    create_succeeded_command,
)


def get_command_view(
    queue_status: QueueStatus = QueueStatus.IMPLICITLY_ACTIVE,
    is_hardware_stopped: bool = False,
    run_result: Optional[RunResult] = None,
    running_command_id: Optional[str] = None,
    queued_command_ids: Sequence[str] = (),
    commands_by_id: Sequence[Tuple[str, cmd.Command]] = (),
    errors_by_id: Optional[Dict[str, errors.ErrorOccurrence]] = None,
) -> CommandView:
    """Get a command view test subject."""
    state = CommandState(
        queue_status=queue_status,
        is_hardware_stopped=is_hardware_stopped,
        run_result=run_result,
        running_command_id=running_command_id,
        queued_command_ids=OrderedDict((i, True) for i in queued_command_ids),
        commands_by_id=OrderedDict(commands_by_id),
        errors_by_id=errors_by_id or {},
    )

    return CommandView(state=state)


def test_get_by_id() -> None:
    """It should get a command by ID from state."""
    command = create_succeeded_command(command_id="command-id")
    subject = get_command_view(commands_by_id=[("command-id", command)])

    assert subject.get("command-id") == command


def test_get_command_bad_id() -> None:
    """It should raise if a requested command ID isn't in state."""
    command = create_succeeded_command(command_id="command-id")
    subject = get_command_view(commands_by_id=[("command-id", command)])

    with pytest.raises(errors.CommandDoesNotExistError):
        subject.get("asdfghjkl")


def test_get_all() -> None:
    """It should get all the commands from the state."""
    command_1 = create_succeeded_command(command_id="command-id-1")
    command_2 = create_running_command(command_id="command-id-2")
    command_3 = create_queued_command(command_id="command-id-3")

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", command_1),
            ("command-id-2", command_2),
            ("command-id-3", command_3),
        ]
    )

    assert subject.get_all() == [command_1, command_2, command_3]


@pytest.mark.parametrize(
    "queue_status", [QueueStatus.IMPLICITLY_ACTIVE, QueueStatus.ACTIVE]
)
def test_get_next_queued_returns_first_queued(queue_status: QueueStatus) -> None:
    """It should return the next queued command ID."""
    subject = get_command_view(
        queue_status=queue_status,
        queued_command_ids=["command-id-1", "command-id-2"],
    )

    assert subject.get_next_queued() == "command-id-1"


def test_get_next_queued_returns_none_when_no_pending() -> None:
    """It should return None if there are no queued commands."""
    subject = get_command_view(
        queue_status=QueueStatus.ACTIVE,
        queued_command_ids=[],
    )

    assert subject.get_next_queued() is None


def test_get_next_queued_returns_none_if_not_running() -> None:
    """It should return None if the engine is not running."""
    subject = get_command_view(
        queue_status=QueueStatus.INACTIVE,
        queued_command_ids=["command-id-1", "command-id-2"],
    )
    result = subject.get_next_queued()

    assert result is None


@pytest.mark.parametrize("run_result", RunResult)
def test_get_next_queued_raises_if_stopped(run_result: RunResult) -> None:
    """It should raise if an engine stop has been requested."""
    subject = get_command_view(run_result=run_result)

    with pytest.raises(errors.ProtocolEngineStoppedError):
        subject.get_next_queued()


def test_get_is_running_queue() -> None:
    """It should be able to get if the engine is running."""
    subject = get_command_view(queue_status=QueueStatus.INACTIVE)
    assert subject.get_is_running() is False

    subject = get_command_view(queue_status=QueueStatus.ACTIVE)
    assert subject.get_is_running() is True

    subject = get_command_view(queue_status=QueueStatus.IMPLICITLY_ACTIVE)
    assert subject.get_is_running() is True


def test_get_is_complete() -> None:
    """It should be able to tell if a command is complete."""
    completed_command = create_succeeded_command(command_id="command-id-1")
    failed_command = create_failed_command(command_id="command-id-2")
    running_command = create_running_command(command_id="command-id-3")
    pending_command = create_queued_command(command_id="command-id-4")

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", completed_command),
            ("command-id-2", failed_command),
            ("command-id-3", running_command),
            ("command-id-4", pending_command),
        ]
    )

    assert subject.get_is_complete("command-id-1") is True
    assert subject.get_is_complete("command-id-2") is True
    assert subject.get_is_complete("command-id-3") is False
    assert subject.get_is_complete("command-id-4") is False


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_get_all_complete() -> None:
    """It should return true if all commands completed or any failed."""
    running_command = create_running_command(command_id="command-id-2")

    subject = get_command_view(queued_command_ids=[])
    assert subject.get_all_complete() is True

    subject = get_command_view(queued_command_ids=["command-id-1"])
    assert subject.get_all_complete() is False

    subject = get_command_view(
        queued_command_ids=[],
        commands_by_id=[("command-id-1", running_command)],
    )
    assert subject.get_all_complete() is False

    subject = get_command_view(
        queued_command_ids=[],
        is_hardware_stopped=True,
        commands_by_id=[("command-id-1", running_command)],
    )
    assert subject.get_all_complete() is True


def test_get_should_stop() -> None:
    """It should return true if the run_result status is set."""
    subject = get_command_view(run_result=RunResult.SUCCEEDED)
    assert subject.get_stop_requested() is True

    subject = get_command_view(run_result=RunResult.FAILED)
    assert subject.get_stop_requested() is True

    subject = get_command_view(run_result=RunResult.STOPPED)
    assert subject.get_stop_requested() is True

    subject = get_command_view(run_result=None)
    assert subject.get_stop_requested() is False


def test_get_is_stopped() -> None:
    """It should return true if stop requested and no command running."""
    subject = get_command_view(is_hardware_stopped=False)
    assert subject.get_is_stopped() is False

    subject = get_command_view(is_hardware_stopped=True)
    assert subject.get_is_stopped() is True


class ActionAllowedSpec(NamedTuple):
    """Spec data to test CommandView.validate_action_allowed."""

    subject: CommandView
    action: Union[PlayAction, PauseAction]
    expected_error: Optional[Type[errors.ProtocolEngineError]]


action_allowed_specs: List[ActionAllowedSpec] = [
    ActionAllowedSpec(
        subject=get_command_view(run_result=None),
        action=PlayAction(),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.STOPPED),
        action=PlayAction(),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.SUCCEEDED),
        action=PlayAction(),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.FAILED),
        action=PlayAction(),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=None),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.STOPPED),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.SUCCEEDED),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
    ActionAllowedSpec(
        subject=get_command_view(run_result=RunResult.FAILED),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
]


@pytest.mark.parametrize(ActionAllowedSpec._fields, action_allowed_specs)
def test_validate_action_allowed(
    subject: CommandView,
    action: Union[PlayAction, PauseAction],
    expected_error: Optional[Type[errors.ProtocolEngineError]],
) -> None:
    """It should validate allowed play/pause actions."""
    expectation = pytest.raises(expected_error) if expected_error else does_not_raise()

    with expectation:  # type: ignore[attr-defined]
        subject.validate_action_allowed(action)


def test_get_errors() -> None:
    """It should be able to pull all ErrorOccurrences from the store."""
    error_1 = errors.ErrorOccurrence(
        id="error-1",
        createdAt=datetime(year=2021, month=1, day=1),
        errorType="ReallyBadError",
        detail="things could not get worse",
    )
    error_2 = errors.ErrorOccurrence(
        id="error-2",
        createdAt=datetime(year=2022, month=2, day=2),
        errorType="EvenWorseError",
        detail="things got worse",
    )

    subject = get_command_view(errors_by_id={"error-1": error_1, "error-2": error_2})

    assert subject.get_all_errors() == [error_1, error_2]


class GetStatusSpec(NamedTuple):
    """Spec data for get_status tests."""

    subject: CommandView
    expected_status: EngineStatus


get_status_specs: List[GetStatusSpec] = [
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.ACTIVE,
            running_command_id=None,
            queued_command_ids=[],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id="command-id",
            queued_command_ids=[],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id=None,
            queued_command_ids=["command-id"],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id=None,
            queued_command_ids=[],
        ),
        expected_status=EngineStatus.IDLE,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.INACTIVE,
            run_result=RunResult.SUCCEEDED,
            is_hardware_stopped=False,
        ),
        expected_status=EngineStatus.FINISHING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.INACTIVE,
            run_result=RunResult.FAILED,
            is_hardware_stopped=False,
        ),
        expected_status=EngineStatus.FINISHING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            queue_status=QueueStatus.INACTIVE,
        ),
        expected_status=EngineStatus.PAUSED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.FAILED,
            is_hardware_stopped=True,
        ),
        expected_status=EngineStatus.FAILED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.SUCCEEDED,
            is_hardware_stopped=True,
        ),
        expected_status=EngineStatus.SUCCEEDED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.STOPPED,
            is_hardware_stopped=False,
        ),
        expected_status=EngineStatus.STOP_REQUESTED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            run_result=RunResult.STOPPED,
            is_hardware_stopped=True,
        ),
        expected_status=EngineStatus.STOPPED,
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
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id=None,
            queued_command_ids=[],
        ),
        expected_is_okay=True,
    ),
    # TODO (spp: This should be True for v6 JSON protocols)
    GetOkayToClearSpec(
        subject=get_command_view(
            queue_status=QueueStatus.IMPLICITLY_ACTIVE,
            running_command_id=None,
            queued_command_ids=["command-id"],
            commands_by_id=[
                ("command-id", create_queued_command(command_id="command-id"))
            ],
        ),
        expected_is_okay=False,
    ),
    GetOkayToClearSpec(
        subject=get_command_view(
            running_command_id=None,
            queued_command_ids=[],
            commands_by_id=[
                ("command-id", create_queued_command(command_id="command-id"))
            ],
        ),
        expected_is_okay=False,
    ),
    GetOkayToClearSpec(
        subject=get_command_view(
            is_hardware_stopped=True,
        ),
        expected_is_okay=True,
    ),
]


@pytest.mark.parametrize(GetOkayToClearSpec._fields, get_okay_to_clear_specs)
def test_get_okay_to_clear(subject: CommandView, expected_is_okay: bool) -> None:
    """It should okay only an unstarted or stopped engine to clear."""
    assert subject.get_is_okay_to_clear() is expected_is_okay
