"""Labware state store tests."""
from collections import OrderedDict
from typing import Sequence, Tuple

from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.state.commands import CommandState, CommandView


from .command_fixtures import (
    create_pending_command,
    create_running_command,
    create_failed_command,
    create_completed_command,
)


def get_command_view(
    commands_by_id: Sequence[Tuple[str, cmd.Command]] = ()
) -> CommandView:
    """Get a command view test subject."""
    state = CommandState(commands_by_id=OrderedDict(commands_by_id))

    return CommandView(state=state)


def test_get_command_by_id() -> None:
    """It should get a command by ID from state."""
    command = create_completed_command(command_id="command-id")
    subject = get_command_view(commands_by_id=[("command-id", command)])

    assert subject.get_command_by_id("command-id") == command


def test_get_command_bad_id() -> None:
    """It should return None if a requested command ID isn't in state."""
    command = create_completed_command(command_id="command-id")
    subject = get_command_view(commands_by_id=[("command-id", command)])

    result = subject.get_command_by_id("asdfghjkl")

    assert result is None


def test_get_all_commands() -> None:
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

    assert subject.get_all_commands() == [
        ("command-id-1", command_1),
        ("command-id-2", command_2),
        ("command-id-3", command_3),
    ]


def test_get_next_request_returns_first_pending() -> None:
    """It should return the first command that's pending."""
    pending_command = create_pending_command()
    running_command = create_running_command()
    completed_command = create_completed_command()

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", running_command),
            ("command-id-2", completed_command),
            ("command-id-3", pending_command),
            ("command-id-4", pending_command),
        ]
    )

    assert subject.get_next_request() == ("command-id-3", pending_command)


def test_get_next_request_returns_none_when_no_pending() -> None:
    """It should return None if there are no pending commands to return."""
    running_command = create_running_command(command_id="command-id-1")
    completed_command = create_completed_command(command_id="command-id-2")
    failed_command = create_failed_command(command_id="command-id-3")

    subject = get_command_view()

    assert subject.get_next_request() is None

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", running_command),
            ("command-id-2", completed_command),
            ("command-id-3", failed_command),
        ]
    )

    assert subject.get_next_request() is None


def test_get_next_request_returns_none_when_earlier_command_failed() -> None:
    """It should return None if any prior-added command is failed."""
    running_command = create_running_command(command_id="command-id-1")
    completed_command = create_completed_command(command_id="command-id-2")
    failed_command = create_failed_command(command_id="command-id-3")
    pending_command = create_pending_command(command_id="command-id-4")

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", running_command),
            ("command-id-2", completed_command),
            ("command-id-3", failed_command),
            ("command-id-4", pending_command),
        ]
    )

    assert subject.get_next_request() is None
