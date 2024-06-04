"""Tests for the CommandStore+CommandState+CommandView trifecta.

The trifecta is tested here as a single unit, treating CommandState as a private
implementation detail.
"""

from datetime import datetime
from unittest.mock import sentinel

import pytest

from opentrons_shared_data.errors import ErrorCodes, PythonException

from opentrons.ordered_set import OrderedSet
from opentrons.protocol_engine import actions, commands, errors
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryType
from opentrons.protocol_engine.errors.error_occurrence import ErrorOccurrence
from opentrons.protocol_engine.errors.exceptions import EStopActivatedError
from opentrons.protocol_engine.notes.notes import CommandNote
from opentrons.protocol_engine.state.commands import (
    CommandStore,
    CommandView,
)
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.types import DeckType, EngineStatus


def _make_config() -> Config:
    return Config(
        # Choice of robot and deck type is arbitrary.
        robot_type="OT-2 Standard",
        deck_type=DeckType.OT2_STANDARD,
    )


@pytest.mark.parametrize("error_recovery_type", ErrorRecoveryType)
def test_command_failure(error_recovery_type: ErrorRecoveryType) -> None:
    """It should store an error and mark the command if it fails."""
    subject = CommandStore(is_door_open=False, config=_make_config())
    subject_view = CommandView(subject.state)

    command_id = "command-id"
    command_key = "command-key"
    created_at = datetime(year=2021, month=1, day=1)
    started_at = datetime(year=2022, month=2, day=2)
    failed_at = datetime(year=2023, month=3, day=3)
    error_id = "error-id"
    notes = [
        CommandNote(
            noteKind="noteKind",
            shortMessage="shortMessage",
            longMessage="longMessage",
            source="source",
        )
    ]

    params = commands.CommentParams(message="No comment.")

    subject.handle_action(
        actions.QueueCommandAction(
            command_id=command_id,
            created_at=created_at,
            request=commands.CommentCreate(params=params, key=command_key),
            request_hash=None,
        )
    )
    subject.handle_action(
        actions.RunCommandAction(command_id=command_id, started_at=started_at)
    )
    subject.handle_action(
        actions.FailCommandAction(
            command_id=command_id,
            running_command=subject_view.get(command_id),
            error_id=error_id,
            failed_at=failed_at,
            error=errors.ProtocolEngineError(message="oh no"),
            notes=notes,
            type=error_recovery_type,
        )
    )

    expected_error_occurrence = errors.ErrorOccurrence(
        id=error_id,
        errorType="ProtocolEngineError",
        createdAt=failed_at,
        detail="oh no",
        errorCode=ErrorCodes.GENERAL_ERROR.value.code,
    )
    expected_failed_command = commands.Comment(
        id=command_id,
        key=command_key,
        commandType="comment",
        createdAt=created_at,
        startedAt=started_at,
        completedAt=failed_at,
        status=commands.CommandStatus.FAILED,
        params=params,
        result=None,
        error=expected_error_occurrence,
        notes=notes,
    )

    assert subject_view.get("command-id") == expected_failed_command


def test_command_failure_clears_queues() -> None:
    """It should clear the command queue on command failure."""
    subject = CommandStore(config=_make_config(), is_door_open=False)
    subject_view = CommandView(subject.state)

    queue_1 = actions.QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(), key="command-key-1"
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
    )
    subject.handle_action(queue_1)
    queue_2 = actions.QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(), key="command-key-2"
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-2",
    )
    subject.handle_action(queue_2)

    run_1 = actions.RunCommandAction(
        command_id="command-id-1",
        started_at=datetime(year=2022, month=2, day=2),
    )
    subject.handle_action(run_1)
    fail_1 = actions.FailCommandAction(
        command_id="command-id-1",
        running_command=subject_view.get("command-id-1"),
        error_id="error-id",
        failed_at=datetime(year=2023, month=3, day=3),
        error=errors.ProtocolEngineError(message="oh no"),
        notes=[
            CommandNote(
                noteKind="noteKind",
                shortMessage="shortMessage",
                longMessage="longMessage",
                source="source",
            )
        ],
        type=ErrorRecoveryType.FAIL_RUN,
    )
    subject.handle_action(fail_1)

    assert [(c.id, c.status) for c in subject_view.get_all()] == [
        ("command-id-1", commands.CommandStatus.FAILED),
        ("command-id-2", commands.CommandStatus.FAILED),
    ]
    assert subject_view.get_running_command_id() is None
    assert subject_view.get_queue_ids() == OrderedSet()
    assert subject_view.get_next_to_execute() is None


def test_setup_command_failure_only_clears_setup_command_queue() -> None:
    """It should clear only the setup command queue for a failed setup command.

    This test queues up a non-setup command followed by two setup commands,
    then runs and fails the first setup command.
    """
    subject = CommandStore(is_door_open=False, config=_make_config())
    subject_view = CommandView(subject.state)

    queue_1 = actions.QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(), key="command-key-1"
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
    )
    subject.handle_action(queue_1)
    queue_2_setup = actions.QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(),
            intent=commands.CommandIntent.SETUP,
            key="command-key-2",
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-2",
    )
    subject.handle_action(queue_2_setup)
    queue_3_setup = actions.QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(),
            intent=commands.CommandIntent.SETUP,
            key="command-key-3",
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-3",
    )
    subject.handle_action(queue_3_setup)

    run_2_setup = actions.RunCommandAction(
        command_id="command-id-2",
        started_at=datetime(year=2022, month=2, day=2),
    )
    subject.handle_action(run_2_setup)
    fail_2_setup = actions.FailCommandAction(
        command_id="command-id-2",
        running_command=subject_view.get("command-id-2"),
        error_id="error-id",
        failed_at=datetime(year=2023, month=3, day=3),
        error=errors.ProtocolEngineError(message="oh no"),
        notes=[
            CommandNote(
                noteKind="noteKind",
                shortMessage="shortMessage",
                longMessage="longMessage",
                source="source",
            )
        ],
        type=ErrorRecoveryType.FAIL_RUN,
    )
    subject.handle_action(fail_2_setup)

    assert [(c.id, c.status) for c in subject_view.get_all()] == [
        ("command-id-1", commands.CommandStatus.QUEUED),
        ("command-id-2", commands.CommandStatus.FAILED),
        ("command-id-3", commands.CommandStatus.FAILED),
    ]
    assert subject_view.get_running_command_id() is None

    subject.handle_action(
        actions.PlayAction(requested_at=datetime.now(), deck_configuration=None)
    )
    assert subject_view.get_next_to_execute() == "command-id-1"


def test_nonfatal_command_failure() -> None:
    """Test the command queue if a command fails recoverably.

    Commands that were after the failed command in the queue should be left in
    the queue.

    The queue status should be "awaiting-recovery."
    """
    subject = CommandStore(is_door_open=False, config=_make_config())
    subject_view = CommandView(subject.state)

    queue_1 = actions.QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(), key="command-key-1"
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-1",
    )
    subject.handle_action(queue_1)
    queue_2 = actions.QueueCommandAction(
        request=commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(), key="command-key-2"
        ),
        request_hash=None,
        created_at=datetime(year=2021, month=1, day=1),
        command_id="command-id-2",
    )
    subject.handle_action(queue_2)

    run_1 = actions.RunCommandAction(
        command_id="command-id-1",
        started_at=datetime(year=2022, month=2, day=2),
    )
    subject.handle_action(run_1)
    fail_1 = actions.FailCommandAction(
        command_id="command-id-1",
        running_command=subject_view.get("command-id-1"),
        error_id="error-id",
        failed_at=datetime(year=2023, month=3, day=3),
        error=errors.ProtocolEngineError(message="oh no"),
        notes=[
            CommandNote(
                noteKind="noteKind",
                shortMessage="shortMessage",
                longMessage="longMessage",
                source="source",
            )
        ],
        type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
    )
    subject.handle_action(fail_1)

    assert [(c.id, c.status) for c in subject_view.get_all()] == [
        ("command-id-1", commands.CommandStatus.FAILED),
        ("command-id-2", commands.CommandStatus.QUEUED),
    ]
    assert subject_view.get_running_command_id() is None


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
    running_command_1 = CommandView(subject.state).get("c1")
    subject.handle_action(
        actions.FailCommandAction(
            command_id="c1",
            running_command=running_command_1,
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
    running_command_2 = CommandView(subject.state).get("c2")
    subject.handle_action(
        actions.FailCommandAction(
            command_id="c2",
            running_command=running_command_2,
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


def test_recovery_target_tracking() -> None:
    """It should keep track of the command currently undergoing error recovery."""
    subject = CommandStore(config=_make_config(), is_door_open=False)
    subject_view = CommandView(subject.state)

    queue_1 = actions.QueueCommandAction(
        "c1",
        created_at=datetime.now(),
        request=commands.CommentCreate(params=commands.CommentParams(message="")),
        request_hash=None,
    )
    subject.handle_action(queue_1)
    run_1 = actions.RunCommandAction(command_id="c1", started_at=datetime.now())
    subject.handle_action(run_1)
    fail_1 = actions.FailCommandAction(
        command_id="c1",
        error_id="c1-error",
        failed_at=datetime.now(),
        error=PythonException(RuntimeError()),
        notes=[],
        type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
        running_command=subject_view.get("c1"),
    )
    subject.handle_action(fail_1)

    # c1 failed recoverably and we're currently recovering from it.
    recovery_target = subject_view.get_recovery_target()
    assert recovery_target is not None
    assert recovery_target.command_id == "c1"
    assert subject_view.get_recovery_in_progress_for_command("c1")

    resume_from_1_recovery = actions.ResumeFromRecoveryAction()
    subject.handle_action(resume_from_1_recovery)

    # c1 failed recoverably, but we've already completed its recovery.
    assert subject_view.get_recovery_target() is None
    assert not subject_view.get_recovery_in_progress_for_command("c1")

    queue_2 = actions.QueueCommandAction(
        "c2",
        created_at=datetime.now(),
        request=commands.CommentCreate(params=commands.CommentParams(message="")),
        request_hash=None,
    )
    subject.handle_action(queue_2)
    run_2 = actions.RunCommandAction(command_id="c2", started_at=datetime.now())
    subject.handle_action(run_2)
    fail_2 = actions.FailCommandAction(
        command_id="c2",
        error_id="c2-error",
        failed_at=datetime.now(),
        error=PythonException(RuntimeError()),
        notes=[],
        type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
        running_command=subject_view.get("c2"),
    )
    subject.handle_action(fail_2)

    # c2 failed recoverably and we're currently recovering from it.
    recovery_target = subject_view.get_recovery_target()
    assert recovery_target is not None
    assert recovery_target.command_id == "c2"
    assert subject_view.get_recovery_in_progress_for_command("c2")
    # ...and that means we're *not* currently recovering from c1,
    # even though it failed recoverably before.
    assert not subject_view.get_recovery_in_progress_for_command("c1")

    resume_from_2_recovery = actions.ResumeFromRecoveryAction()
    subject.handle_action(resume_from_2_recovery)
    queue_3 = actions.QueueCommandAction(
        "c3",
        created_at=datetime.now(),
        request=commands.CommentCreate(params=commands.CommentParams(message="")),
        request_hash=None,
    )
    subject.handle_action(queue_3)
    run_3 = actions.RunCommandAction(command_id="c3", started_at=datetime.now())
    subject.handle_action(run_3)
    fail_3 = actions.FailCommandAction(
        command_id="c3",
        error_id="c3-error",
        failed_at=datetime.now(),
        error=PythonException(RuntimeError()),
        notes=[],
        type=ErrorRecoveryType.FAIL_RUN,
        running_command=subject_view.get("c3"),
    )
    subject.handle_action(fail_3)

    # c3 failed, but not recoverably.
    assert subject_view.get_recovery_target() is None
    assert not subject_view.get_recovery_in_progress_for_command("c3")


def test_final_state_after_estop() -> None:
    """Test the final state of the run after it's E-stopped."""
    subject = CommandStore(config=_make_config(), is_door_open=False)
    subject_view = CommandView(subject.state)

    error_details = actions.FinishErrorDetails(
        error=EStopActivatedError(), error_id="error-id", created_at=datetime.now()
    )
    expected_error_occurrence = ErrorOccurrence(
        id=error_details.error_id,
        createdAt=error_details.created_at,
        errorCode=ErrorCodes.E_STOP_ACTIVATED.value.code,
        errorType="EStopActivatedError",
        detail="E-stop activated.",
    )

    subject.handle_action(actions.StopAction(from_estop=True))
    subject.handle_action(actions.FinishAction(error_details=error_details))
    subject.handle_action(
        actions.HardwareStoppedAction(
            completed_at=sentinel.hardware_stopped_action_completed_at,
            finish_error_details=None,
        )
    )

    assert subject_view.get_status() == EngineStatus.FAILED
    assert subject_view.get_error() == expected_error_occurrence


def test_final_state_after_stop() -> None:
    """Test the final state of the run after it's stopped."""
    subject = CommandStore(config=_make_config(), is_door_open=False)
    subject_view = CommandView(subject.state)

    subject.handle_action(actions.StopAction())
    subject.handle_action(
        actions.FinishAction(
            error_details=actions.FinishErrorDetails(
                error=RuntimeError(
                    "uh oh I was a command and then I got cancelled because someone"
                    " stopped the run, and now I'm raising this exception because"
                    " of that. Woe is me"
                ),
                error_id="error-id",
                created_at=datetime.now(),
            )
        )
    )
    subject.handle_action(
        actions.HardwareStoppedAction(
            completed_at=sentinel.hardware_stopped_action_completed_at,
            finish_error_details=None,
        )
    )

    assert subject_view.get_status() == EngineStatus.STOPPED
    assert subject_view.get_error() is None
