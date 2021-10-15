"""Tests for the command lifecycle state."""
from datetime import datetime

from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.actions import (
    CommandFailedAction,
    StopAction,
    StopErrorDetails,
)

from opentrons.protocol_engine.state.errors import ErrorState, ErrorStore


def test_error_store_handles_command_failed() -> None:
    """It should add an error from a failed command to the store."""
    subject = ErrorStore()

    subject.handle_action(
        CommandFailedAction(
            command_id="command-id",
            error_id="error-id",
            error=RuntimeError("oh no"),
            completed_at=datetime(year=2021, month=1, day=1),
        )
    )

    assert subject.state == ErrorState(
        errors_by_id={
            "error-id": ErrorOccurrence(
                id="error-id",
                errorType="RuntimeError",
                createdAt=datetime(year=2021, month=1, day=1),
                detail="oh no",
            )
        },
    )


def test_error_store_handles_stop_with_error() -> None:
    """It should add an error from a stop with error."""
    subject = ErrorStore()

    subject.handle_action(
        StopAction(
            error_details=StopErrorDetails(
                error_id="error-id",
                error=RuntimeError("oh no"),
                created_at=datetime(year=2021, month=1, day=1),
            )
        )
    )

    assert subject.state == ErrorState(
        errors_by_id={
            "error-id": ErrorOccurrence(
                id="error-id",
                errorType="RuntimeError",
                createdAt=datetime(year=2021, month=1, day=1),
                detail="oh no",
            )
        },
    )
