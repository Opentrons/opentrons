"""Labware state store tests."""
import pytest
from collections import OrderedDict
from contextlib import nullcontext as does_not_raise
from datetime import datetime
from typing import List, Mapping, NamedTuple, Optional, Sequence, Tuple, Type, Union

from opentrons.protocol_engine import EngineStatus, commands as cmd, errors
from opentrons.protocol_engine.state.commands import CommandState, CommandView
from opentrons.protocol_engine.actions import PlayAction, PauseAction, PauseSource

from .command_fixtures import (
    create_queued_command,
    create_running_command,
    create_failed_command,
    create_succeeded_command,
)


def get_command_view(
    is_running_queue: bool = False,
    should_report_result: bool = False,
    is_hardware_stopped: bool = False,
    should_stop: bool = False,
    commands_by_id: Sequence[Tuple[str, cmd.Command]] = (),
    errors_by_id: Optional[Mapping[str, errors.ErrorOccurrence]] = None,
) -> CommandView:
    """Get a command view test subject."""
    state = CommandState(
        is_running_queue=is_running_queue,
        should_report_result=should_report_result,
        is_hardware_stopped=is_hardware_stopped,
        should_stop=should_stop,
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


def test_get_next_queued_returns_first_pending() -> None:
    """It should return the first command that's pending."""
    pending_command = create_queued_command()
    running_command = create_running_command()
    completed_command = create_succeeded_command()

    subject = get_command_view(
        is_running_queue=True,
        commands_by_id=[
            ("command-id-1", running_command),
            ("command-id-2", completed_command),
            ("command-id-3", pending_command),
            ("command-id-4", pending_command),
        ],
    )

    assert subject.get_next_queued() == "command-id-3"


def test_get_next_queued_returns_none_when_no_pending() -> None:
    """It should return None if there are no pending commands to return."""
    running_command = create_running_command(command_id="command-id-1")
    completed_command = create_succeeded_command(command_id="command-id-2")

    subject = get_command_view(is_running_queue=True)

    assert subject.get_next_queued() is None

    subject = get_command_view(
        is_running_queue=True,
        commands_by_id=[
            ("command-id-1", running_command),
            ("command-id-2", completed_command),
        ],
    )

    assert subject.get_next_queued() is None


def test_get_next_queued_returns_none_if_not_running() -> None:
    """It should return None if the engine is not running."""
    pending_command = create_queued_command()

    subject = get_command_view(
        is_running_queue=False,
        commands_by_id=[("command-id", pending_command)],
    )
    result = subject.get_next_queued()

    assert result is None


def test_get_next_queued_raises_when_earlier_command_failed() -> None:
    """It should raise if any prior-added command is failed."""
    running_command = create_running_command(command_id="command-id-1")
    completed_command = create_succeeded_command(command_id="command-id-2")
    failed_command = create_failed_command(command_id="command-id-3")
    pending_command = create_queued_command(command_id="command-id-4")

    subject = get_command_view(
        is_running_queue=True,
        commands_by_id=[
            ("command-id-1", running_command),
            ("command-id-2", completed_command),
            ("command-id-3", failed_command),
            ("command-id-4", pending_command),
        ],
    )

    with pytest.raises(errors.ProtocolEngineStoppedError):
        subject.get_next_queued()


def test_get_next_queued_raises_if_stopped() -> None:
    """It should raise if an engine stop has been requested."""
    subject = get_command_view(should_stop=True)

    with pytest.raises(errors.ProtocolEngineStoppedError):
        subject.get_next_queued()


def test_get_is_running_queue() -> None:
    """It should be able to get if the engine is running."""
    subject = get_command_view(is_running_queue=False)
    assert subject.get_is_running() is False

    subject = get_command_view(is_running_queue=True)
    assert subject.get_is_running() is True


def test_get_is_complete() -> None:
    """It should be able to tell if a command is complete."""
    completed_command = create_succeeded_command(command_id="command-id-1")
    running_command = create_running_command(command_id="command-id-2")
    pending_command = create_queued_command(command_id="command-id-3")

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", completed_command),
            ("command-id-2", running_command),
            ("command-id-3", pending_command),
        ]
    )

    assert subject.get_is_complete("command-id-1") is True
    assert subject.get_is_complete("command-id-2") is False
    assert subject.get_is_complete("command-id-3") is False


def test_get_is_complete_with_failed_command() -> None:
    """It should return true if a given command will never be executed."""
    failed_command = create_failed_command(command_id="command-id-1")
    pending_command = create_queued_command(command_id="command-id-2")

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", failed_command),
            ("command-id-2", pending_command),
        ]
    )

    assert subject.get_is_complete("command-id-1") is True
    assert subject.get_is_complete("command-id-2") is True


def test_get_all_complete() -> None:
    """It should return true if all commands completed or any failed."""
    completed_command = create_succeeded_command(command_id="command-id-1")
    running_command = create_running_command(command_id="command-id-2")
    pending_command = create_queued_command(command_id="command-id-3")
    failed_command = create_failed_command(command_id="command-id-4")

    subject = get_command_view(
        commands_by_id=[
            ("command-id-4", failed_command),
            ("command-id-3", pending_command),
        ],
    )

    assert subject.get_all_complete() is True

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", completed_command),
            ("command-id-2", running_command),
            ("command-id-3", pending_command),
        ],
    )

    assert subject.get_all_complete() is False

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", completed_command),
            ("command-id-2", completed_command),
        ],
    )

    assert subject.get_all_complete() is True


def test_get_should_stop() -> None:
    """It should return true if the should_stop flag is set."""
    subject = get_command_view(should_stop=True)
    assert subject.get_stop_requested() is True

    subject = get_command_view(should_stop=False)
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
        subject=get_command_view(should_stop=False, is_running_queue=False),
        action=PlayAction(),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(should_stop=False, is_running_queue=True),
        action=PlayAction(),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(should_stop=True, is_running_queue=False),
        action=PlayAction(),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
    ActionAllowedSpec(
        subject=get_command_view(should_stop=False, is_running_queue=False),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(should_stop=False, is_running_queue=True),
        action=PauseAction(source=PauseSource.CLIENT),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(should_stop=True, is_running_queue=False),
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

    subject = get_command_view(
        should_stop=False,
        commands_by_id=(),
        errors_by_id={"error-1": error_1, "error-2": error_2},
    )

    assert subject.get_all_errors() == [error_1, error_2]


class GetStatusSpec(NamedTuple):
    """Spec data for get_status tests."""

    subject: CommandView
    expected_status: EngineStatus


get_status_specs: List[GetStatusSpec] = [
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=True,
            should_report_result=False,
            should_stop=False,
            commands_by_id=[],
        ),
        expected_status=EngineStatus.IDLE,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=True,
            should_report_result=False,
            should_stop=False,
            commands_by_id=[("command-id", create_queued_command())],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=True,
            should_report_result=False,
            should_stop=False,
            commands_by_id=[("command-id", create_running_command())],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_report_result=True,
            is_hardware_stopped=False,
            should_stop=True,
            commands_by_id=[],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_report_result=False,
            should_stop=False,
            commands_by_id=[("command-id", create_running_command())],
        ),
        expected_status=EngineStatus.PAUSED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_stop=False,
            commands_by_id=[
                ("command-id-1", create_succeeded_command()),
                ("command-id-2", create_queued_command()),
            ],
        ),
        expected_status=EngineStatus.PAUSED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_report_result=False,
            should_stop=False,
            commands_by_id=[],
        ),
        expected_status=EngineStatus.PAUSED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=True,
            should_report_result=False,
            should_stop=False,
            commands_by_id=[("command-id", create_failed_command())],
        ),
        expected_status=EngineStatus.IDLE,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_report_result=False,
            should_stop=False,
            commands_by_id=[("command-id", create_failed_command())],
        ),
        expected_status=EngineStatus.PAUSED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_report_result=True,
            is_hardware_stopped=True,
            should_stop=True,
            errors_by_id={
                "error-id": errors.ErrorOccurrence(
                    id="error-id",
                    createdAt=datetime(year=2021, month=1, day=1),
                    errorType="BadError",
                    detail="oh no",
                )
            },
        ),
        expected_status=EngineStatus.FAILED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_report_result=True,
            is_hardware_stopped=True,
            should_stop=True,
            commands_by_id=[],
        ),
        expected_status=EngineStatus.SUCCEEDED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_report_result=True,
            is_hardware_stopped=True,
            should_stop=True,
            commands_by_id=[("command-id", create_succeeded_command())],
        ),
        expected_status=EngineStatus.SUCCEEDED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_report_result=False,
            is_hardware_stopped=False,
            should_stop=True,
            commands_by_id=[],
        ),
        expected_status=EngineStatus.STOP_REQUESTED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running_queue=False,
            should_report_result=False,
            is_hardware_stopped=True,
            should_stop=True,
            commands_by_id=[],
        ),
        expected_status=EngineStatus.STOPPED,
    ),
]


@pytest.mark.parametrize(GetStatusSpec._fields, get_status_specs)
def test_get_status(subject: CommandView, expected_status: EngineStatus) -> None:
    """It should set a status according to the command queue and running flag.

    1. Worker running, no stop requested, no commands queued: IDLE
    2. Worker running, no stop requested, commands queued: RUNNING
    3. Worker not running, no stop requested, command running: PAUSE_REQUESTED
    4. Worker not running, no stop requested, no running commands: PAUSED
    5. Stop requested, command still running: STOP_REQUESTED
    6. Stop requested, no running commands, with queued commands: STOPPED
    7. Stop requested, all commands succeeded: SUCCEEDED
    8. Stop requested, any errors: FAILED
    """
    assert subject.get_status() == expected_status
