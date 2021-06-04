"""Tests for the command lifecycle state."""
from collections import OrderedDict

from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.state.commands import CommandState, CommandStore

from .command_fixtures import (
    create_pending_command,
    create_running_command,
    create_completed_command,
)


def test_command_store_handles_command() -> None:
    """It should add a command to the store."""
    command: cmd.PendingCommand = create_pending_command()

    subject = CommandStore()
    subject.handle_command(command=command, command_id="command-id")

    assert subject.state == CommandState(
        commands_by_id=OrderedDict({"command-id": command})
    )


def test_command_store_preserves_handle_order() -> None:
    """It should store commands in the order they are handled."""
    # Any arbitrary 3 commands that compare non-equal (!=) to each other.
    command_a: cmd.PendingCommand = create_pending_command()
    command_b: cmd.RunningCommand = create_running_command()
    command_c: cmd.CompletedCommand = create_completed_command()

    subject = CommandStore()
    subject.handle_command(command_a, "command-id-1")
    subject.handle_command(command_b, "command-id-2")
    assert subject.state == CommandState(
        commands_by_id=OrderedDict(
            [
                ("command-id-1", command_a),
                ("command-id-2", command_b),
            ]
        )
    )

    subject.handle_command(command_c, "command-id-1")
    assert subject.state == CommandState(
        commands_by_id=OrderedDict(
            [
                ("command-id-1", command_c),
                ("command-id-2", command_b),
            ]
        )
    )
