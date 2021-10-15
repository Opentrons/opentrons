"""Labware state store tests."""
from datetime import datetime

from opentrons.protocol_engine.errors import ErrorOccurance
from opentrons.protocol_engine.state.errors import ErrorState, ErrorView


def test_get_all() -> None:
    """It should get all the commands from the state."""
    error_1 = ErrorOccurance(
        id="error-id-1",
        errorType="ErrorType",
        createdAt=datetime(year=2021, month=1, day=1),
        detail="Oh no",
    )

    error_2 = ErrorOccurance(
        id="error-id-2",
        errorType="AnotherErrorType",
        createdAt=datetime(year=2022, month=2, day=2),
        detail="How unfortunate",
    )

    state = ErrorState(errors_by_id={"error-id-1": error_1, "error-id-2": error_2})
    subject = ErrorView(state=state)

    assert subject.get_all() == [error_1, error_2]
