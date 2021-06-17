"""Labware state store tests."""
from collections import OrderedDict
from pydantic import BaseModel
from typing import Sequence, Tuple, cast

from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.state.commands import CommandState, CommandView


from .command_fixtures import (
    create_pending_command,
    create_running_command,
    create_failed_command,
    create_completed_command,
)


def get_command_view(
    commands_by_id: Sequence[Tuple[str, cmd.CommandType]] = ()
) -> CommandView:
    """Get a command view test subject."""
    state = CommandState(commands_by_id=OrderedDict(commands_by_id))

    return CommandView(state=state)


def test_get_command_bad_id() -> None:
    """get_command_by_id should return None if command ID doesn't exist."""
    subject = get_command_view()

    result = subject.get_command_by_id("asdfghjkl")

    assert result is None


def test_get_command_by_id() -> None:
    """It should add the labware data to the state."""
    command = cast(cmd.CommandType, create_completed_command(BaseModel(), BaseModel()))
    subject = get_command_view(commands_by_id=[("command-id", command)])

    assert subject.get_command_by_id("command-id") == command


def test_get_all_commands() -> None:
    """It should add the labware data to the state."""
    command_1 = cast(
        cmd.CommandType, create_completed_command(BaseModel(), BaseModel())
    )
    command_2 = cast(
        cmd.CommandType, create_completed_command(BaseModel(), BaseModel())
    )
    command_3 = cast(
        cmd.CommandType, create_completed_command(BaseModel(), BaseModel())
    )

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
    pending_command: cmd.PendingCommand = create_pending_command()
    running_command: cmd.RunningCommand = create_running_command()
    completed_command: cmd.CompletedCommand = create_completed_command()

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", running_command),
            ("command-id-2", completed_command),
            ("command-id-3", pending_command),
            ("command-id-4", pending_command),
        ]
    )

    assert subject.get_next_request() == ("command-id-3", pending_command.request)


def test_get_next_request_returns_none_when_no_pending() -> None:
    """It should return None if there are no pending commands to return."""
    running_command: cmd.RunningCommand = create_running_command()
    failed_command: cmd.FailedCommand = create_failed_command()
    completed_command: cmd.CompletedCommand = create_completed_command()

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
    pending_command: cmd.PendingCommand = create_pending_command()
    running_command: cmd.RunningCommand = create_running_command()
    failed_command: cmd.FailedCommand = create_failed_command()
    completed_command: cmd.CompletedCommand = create_completed_command()

    subject = get_command_view(
        commands_by_id=[
            ("command-id-1", running_command),
            ("command-id-2", completed_command),
            ("command-id-3", failed_command),
            ("command-id-4", pending_command),
        ]
    )

    assert subject.get_next_request() is None
