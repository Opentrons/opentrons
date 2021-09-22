"""Tests for the command lifecycle state."""
from collections import OrderedDict

from opentrons.protocol_engine.state.commands import CommandState, CommandStore

from opentrons.protocol_engine.actions import (
    UpdateCommandAction,
    PlayAction,
    PauseAction,
    StopAction,
)

from .command_fixtures import (
    create_pending_command,
    create_running_command,
    create_completed_command,
)


def test_command_store_handles_command() -> None:
    """It should add a command to the store."""
    command = create_pending_command(command_id="command-id")

    subject = CommandStore()
    subject.handle_action(UpdateCommandAction(command=command))

    assert subject.state == CommandState(
        is_running=False,
        stop_requested=False,
        commands_by_id=OrderedDict({"command-id": command}),
    )


def test_command_store_preserves_handle_order() -> None:
    """It should store commands in the order they are handled."""
    # Any arbitrary 3 commands that compare non-equal (!=) to each other.
    command_a = create_pending_command(command_id="command-id-1")
    command_b = create_running_command(command_id="command-id-2")
    command_c = create_completed_command(command_id="command-id-1")

    subject = CommandStore()
    subject.handle_action(UpdateCommandAction(command=command_a))
    subject.handle_action(UpdateCommandAction(command=command_b))

    assert subject.state == CommandState(
        is_running=False,
        stop_requested=False,
        commands_by_id=OrderedDict(
            [
                ("command-id-1", command_a),
                ("command-id-2", command_b),
            ]
        ),
    )

    subject.handle_action(UpdateCommandAction(command=command_c))
    assert subject.state == CommandState(
        is_running=False,
        stop_requested=False,
        commands_by_id=OrderedDict(
            [
                ("command-id-1", command_c),
                ("command-id-2", command_b),
            ]
        ),
    )


def test_command_store_handles_play_action() -> None:
    """It should set the running flag on play."""
    subject = CommandStore()
    subject.handle_action(PlayAction())

    assert subject.state == CommandState(
        is_running=True,
        stop_requested=False,
        commands_by_id=OrderedDict(),
    )


def test_command_store_handles_pause_action() -> None:
    """It should clear the running flag on pause."""
    subject = CommandStore()
    subject.handle_action(PauseAction())

    assert subject.state == CommandState(
        is_running=False,
        stop_requested=False,
        commands_by_id=OrderedDict(),
    )


def test_command_store_handles_stop_action() -> None:
    """It should clear the running flag and set the done flag on stop."""
    subject = CommandStore()

    subject.handle_action(PlayAction())
    subject.handle_action(StopAction())

    assert subject.state == CommandState(
        is_running=False,
        stop_requested=True,
        commands_by_id=OrderedDict(),
    )


def test_command_store_cannot_restart_after_stop() -> None:
    """It should reject a play action after a stop action."""
    subject = CommandStore()
    subject.handle_action(StopAction())
    subject.handle_action(PlayAction())

    assert subject.state == CommandState(
        is_running=False,
        stop_requested=True,
        commands_by_id=OrderedDict(),
    )
