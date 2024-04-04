"""Tests for the CommandStore+CommandState+CommandView trifecta.

The trifecta is tested here as a single unit, treating CommandState as a private
implementation detail.
"""

from datetime import datetime

from opentrons_shared_data.errors import PythonException

from opentrons.protocol_engine import actions, commands
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryType
from opentrons.protocol_engine.state.commands import CommandStore, CommandView
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.types import DeckType


def _make_config() -> Config:
    return Config(
        # Choice of robot and deck type is arbitrary.
        robot_type="OT-2 Standard",
        deck_type=DeckType.OT2_STANDARD,
    )


def test_error_recovery_type_tracking() -> None:
    """It should keep track of each failed command's error recovery type."""
    subject = CommandStore(config=_make_config(), is_door_open=False)

    subject.handle_action(
        actions.QueueCommandAction(
            command_id="c1",
            created_at=datetime.now(),
            request=commands.CommentCreate(
                params=commands.CommentParams(message="yeehaw"),
            ),
            request_hash=None,
        )
    )
    subject.handle_action(
        actions.QueueCommandAction(
            command_id="c2",
            created_at=datetime.now(),
            request=commands.CommentCreate(
                params=commands.CommentParams(message="yeehaw"),
            ),
            request_hash=None,
        )
    )
    subject.handle_action(
        actions.RunCommandAction(command_id="c1", started_at=datetime.now())
    )
    subject.handle_action(
        actions.FailCommandAction(
            command_id="c1",
            error_id="c1-error",
            failed_at=datetime.now(),
            error=PythonException(RuntimeError("new sheriff in town")),
            notes=[],
            type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
        )
    )
    subject.handle_action(
        actions.RunCommandAction(command_id="c2", started_at=datetime.now())
    )
    subject.handle_action(
        actions.FailCommandAction(
            command_id="c2",
            error_id="c2-error",
            failed_at=datetime.now(),
            error=PythonException(RuntimeError("new sheriff in town")),
            notes=[],
            type=ErrorRecoveryType.FAIL_RUN,
        )
    )

    view = CommandView(subject.state)
    assert view.get_error_recovery_type("c1") == ErrorRecoveryType.WAIT_FOR_RECOVERY
    assert view.get_error_recovery_type("c2") == ErrorRecoveryType.FAIL_RUN
