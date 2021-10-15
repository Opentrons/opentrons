"""Tests for the command lifecycle state."""
from collections import OrderedDict
from datetime import datetime

from opentrons.protocol_engine.state.commands import CommandState, CommandStore

from opentrons.protocol_engine.commands import CommandStatus
from opentrons.protocol_engine.actions import (
    CommandUpdatedAction,
    CommandFailedAction,
    PlayAction,
    PauseAction,
    StopAction,
    StopErrorDetails,
)

from .command_fixtures import (
    create_pending_command,
    create_running_command,
    create_completed_command,
    create_failed_command,
)


def test_command_store_handles_command_updated() -> None:
    """It should add a command to the store."""
    command = create_pending_command(command_id="command-id")

    subject = CommandStore()
    subject.handle_action(CommandUpdatedAction(command=command))

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
    subject.handle_action(CommandUpdatedAction(command=command_a))
    subject.handle_action(CommandUpdatedAction(command=command_b))

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

    subject.handle_action(CommandUpdatedAction(command=command_c))
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


def test_command_store_handles_command_failure_updates() -> None:
    """It should handle a command execution failure."""
    command = create_running_command(command_id="command-id")
    action = CommandFailedAction(
        command_id="command-id",
        error_id="error-id",
        error=RuntimeError("oh no"),
        completed_at=datetime(year=2022, month=2, day=2),
    )

    subject = CommandStore()
    subject.handle_action(CommandUpdatedAction(command=command))
    subject.handle_action(action)

    assert subject.state.commands_by_id[command.id] == create_failed_command(
        command_id="command-id",
        completed_at=datetime(year=2022, month=2, day=2),
        error="error-id",
    )


def test_command_store_handles_command_failure_update_no_command() -> None:
    """It should survive invalid CommandFailure actions."""
    action = CommandFailedAction(
        command_id="command-id",
        error_id="error-id",
        error=RuntimeError("oh no"),
        completed_at=datetime(year=2022, month=2, day=2),
    )

    subject = CommandStore()
    subject.handle_action(action)

    assert subject.state.commands_by_id.get("command-id") is None


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


def test_command_store_handles_stop_with_error() -> None:
    """It should stop and mark running command as failed on stop with error."""
    completed_command = create_completed_command(command_id="command-id-1")
    running_command = create_running_command(command_id="command-id-2")
    queued_command = create_pending_command(command_id="command-id-3")

    subject = CommandStore()
    subject.handle_action(CommandUpdatedAction(command=completed_command))
    subject.handle_action(CommandUpdatedAction(command=running_command))
    subject.handle_action(CommandUpdatedAction(command=queued_command))

    completed_at = datetime(year=2021, month=1, day=1)

    subject.handle_action(
        StopAction(
            error_details=StopErrorDetails(
                error=RuntimeError("oh no"),
                error_id="error-id",
                created_at=completed_at,
            )
        )
    )

    assert subject.state == CommandState(
        is_running=False,
        stop_requested=True,
        commands_by_id=OrderedDict(
            [
                ("command-id-1", completed_command),
                (
                    "command-id-2",
                    running_command.copy(
                        update={
                            "error": "error-id",
                            "status": CommandStatus.FAILED,
                            "completedAt": completed_at,
                        }
                    ),
                ),
                ("command-id-3", queued_command),
            ]
        ),
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
