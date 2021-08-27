"""Labware state store tests."""
import pytest
from collections import OrderedDict
from contextlib import nullcontext as does_not_raise
from typing import List, NamedTuple, Optional, Sequence, Tuple, Type, Union

from opentrons.protocol_engine import EngineStatus, commands as cmd, errors
from opentrons.protocol_engine.state.commands import CommandState, CommandView
from opentrons.protocol_engine.state.actions import PlayAction, PauseAction

from .command_fixtures import (
    create_pending_command,
    create_running_command,
    create_failed_command,
    create_completed_command,
)


def get_command_view(
    is_running: bool = False,
    stop_requested: bool = False,
    commands_by_id: Sequence[Tuple[str, cmd.Command]] = (),
) -> CommandView:
    """Get a command view test subject."""
    state = CommandState(
        is_running=is_running,
        stop_requested=stop_requested,
        commands_by_id=OrderedDict(commands_by_id),
    )

    return CommandView(state=state)


def test_get_by_id() -> None:
    """It should get a command by ID from state."""
    command = create_completed_command(command_id="command-id")
    subject = get_command_view(commands_by_id=[("command-id", command)])

    assert subject.get("command-id") == command


def test_get_command_bad_id() -> None:
    """It should raise if a requested command ID isn't in state."""
    command = create_completed_command(command_id="command-id")
    subject = get_command_view(commands_by_id=[("command-id", command)])

    with pytest.raises(errors.CommandDoesNotExistError):
        subject.get("asdfghjkl")


def test_get_all() -> None:
    """It should get all the commands from the state."""
    command_1 = create_completed_command(command_id="command-id-1")
    command_2 = create_running_command(command_id="command-id-2")
    command_3 = create_pending_command(command_id="command-id-3")

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
    pending_command = create_pending_command()
    running_command = create_running_command()
    completed_command = create_completed_command()

    subject = get_command_view(
        is_running=True,
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
    completed_command = create_completed_command(command_id="command-id-2")

    subject = get_command_view(is_running=True)

    assert subject.get_next_queued() is None

    subject = get_command_view(
        is_running=True,
        commands_by_id=[
            ("command-id-1", running_command),
            ("command-id-2", completed_command),
        ],
    )

    assert subject.get_next_queued() is None


def test_get_next_queued_returns_none_if_not_running() -> None:
    """It should return None if the engine is not running."""
    pending_command = create_pending_command()

    subject = get_command_view(
        is_running=False,
        commands_by_id=[("command-id", pending_command)],
    )
    result = subject.get_next_queued()

    assert result is None


def test_get_next_queued_raises_when_earlier_command_failed() -> None:
    """It should raise if any prior-added command is failed."""
    running_command = create_running_command(command_id="command-id-1")
    completed_command = create_completed_command(command_id="command-id-2")
    failed_command = create_failed_command(command_id="command-id-3")
    pending_command = create_pending_command(command_id="command-id-4")

    subject = get_command_view(
        is_running=True,
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
    subject = get_command_view(stop_requested=True)

    with pytest.raises(errors.ProtocolEngineStoppedError):
        subject.get_next_queued()


def test_get_is_running() -> None:
    """It should be able to get if the engine is running."""
    subject = get_command_view(is_running=False)
    assert subject.get_is_running() is False

    subject = get_command_view(is_running=True)
    assert subject.get_is_running() is True


def test_get_is_complete() -> None:
    """It should be able to tell if a command is complete."""
    completed_command = create_completed_command(command_id="command-id-1")
    running_command = create_running_command(command_id="command-id-2")
    pending_command = create_pending_command(command_id="command-id-3")

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
    pending_command = create_pending_command(command_id="command-id-2")

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
    completed_command = create_completed_command(command_id="command-id-1")
    running_command = create_running_command(command_id="command-id-2")
    pending_command = create_pending_command(command_id="command-id-3")
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


def test_get_stop_requested() -> None:
    """It should return true if the stop_requested flag is set."""
    subject = get_command_view(stop_requested=True)
    assert subject.get_stop_requested() is True

    subject = get_command_view(stop_requested=False)
    assert subject.get_stop_requested() is False


class ActionAllowedSpec(NamedTuple):
    """Spec data to test CommandView.validate_action_allowed."""

    subject: CommandView
    action: Union[PlayAction, PauseAction]
    expected_error: Optional[Type[errors.ProtocolEngineError]]


action_allowed_specs: List[ActionAllowedSpec] = [
    ActionAllowedSpec(
        subject=get_command_view(stop_requested=False, is_running=False),
        action=PlayAction(),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(stop_requested=False, is_running=True),
        action=PlayAction(),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(stop_requested=True, is_running=False),
        action=PlayAction(),
        expected_error=errors.ProtocolEngineStoppedError,
    ),
    ActionAllowedSpec(
        subject=get_command_view(stop_requested=False, is_running=False),
        action=PauseAction(),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(stop_requested=False, is_running=True),
        action=PauseAction(),
        expected_error=None,
    ),
    ActionAllowedSpec(
        subject=get_command_view(stop_requested=True, is_running=False),
        action=PauseAction(),
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


class GetStatusSpec(NamedTuple):
    """Spec data for get_status tests."""

    subject: CommandView
    expected_status: EngineStatus


get_status_specs: List[GetStatusSpec] = [
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=False,
            commands_by_id=[],
        ),
        expected_status=EngineStatus.READY_TO_RUN,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=False,
            commands_by_id=[("command-id", create_pending_command())],
        ),
        expected_status=EngineStatus.READY_TO_RUN,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=False,
            commands_by_id=[("command-id", create_running_command())],
        ),
        expected_status=EngineStatus.PAUSE_REQUESTED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=False,
            commands_by_id=[
                ("command-id-1", create_completed_command()),
                ("command-id-2", create_pending_command()),
            ],
        ),
        expected_status=EngineStatus.PAUSED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=True,
            stop_requested=False,
            commands_by_id=[],
        ),
        expected_status=EngineStatus.RUNNING,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=True,
            stop_requested=False,
            commands_by_id=[("command-id", create_failed_command())],
        ),
        expected_status=EngineStatus.FAILED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=False,
            commands_by_id=[("command-id", create_failed_command())],
        ),
        expected_status=EngineStatus.FAILED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=True,
            commands_by_id=[("command-id", create_failed_command())],
        ),
        expected_status=EngineStatus.FAILED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=True,
            commands_by_id=[],
        ),
        expected_status=EngineStatus.SUCCEEDED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=True,
            commands_by_id=[("command-id", create_completed_command())],
        ),
        expected_status=EngineStatus.SUCCEEDED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=True,
            commands_by_id=[("command-id", create_running_command())],
        ),
        expected_status=EngineStatus.STOP_REQUESTED,
    ),
    GetStatusSpec(
        subject=get_command_view(
            is_running=False,
            stop_requested=True,
            commands_by_id=[
                ("command-id", create_completed_command()),
                ("command-id", create_pending_command()),
            ],
        ),
        expected_status=EngineStatus.STOPPED,
    ),
]


@pytest.mark.parametrize(GetStatusSpec._fields, get_status_specs)
def test_get_status(subject: CommandView, expected_status: EngineStatus) -> None:
    """It should set a status according to the command queue and running flag.

    1. Not running, not done, only queued commands: READY_TO_RUN
    2. Not running, not done, with commands: PAUSED
    3. Running, not done, no failed commands: RUNNING
    4. Any failed commands: FAILED
    5. Done, no failed commands: SUCCEEDED
    """
    assert subject.get_status() == expected_status
