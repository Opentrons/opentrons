"""Tests for the session resource model builder."""
import pytest
from datetime import datetime

from robot_server.sessions.session_store import SessionResource
from robot_server.sessions.session_builder import SessionBuilder
from robot_server.sessions.session_models import (
    Session,
    BasicSession,
    BasicSessionCreateData,
)

from robot_server.sessions.control_commands import (
    SessionControlCommand,
    SessionControlCommandCreateData,
    SessionControlType,
)


@pytest.fixture
def subject() -> SessionBuilder:
    """Get an instance of the SessionBuilder test subject."""
    return SessionBuilder()


def test_create_session_resource_from_none(subject: SessionBuilder) -> None:
    """It should create a basic session from create_data=None."""
    created_at = datetime.now()
    create_data = None

    result = subject.create(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
    )

    assert result == SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=created_at,
        control_commands=[],
    )


def test_create_session_resource(subject: SessionBuilder) -> None:
    """It should create a session with create_data specified."""
    created_at = datetime.now()
    create_data = BasicSessionCreateData()

    result = subject.create(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
    )

    assert result == SessionResource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
        control_commands=[],
    )


current_time = datetime.now()


@pytest.mark.parametrize(
    ("session_resource", "expected_response"),
    (
        (
            SessionResource(
                session_id="session-id",
                create_data=BasicSessionCreateData(),
                created_at=current_time,
                control_commands=[],
            ),
            BasicSession(
                id="session-id",
                createdAt=current_time,
                controlCommands=[],
            ),
        ),
    ),
)
def test_to_response(
    session_resource: SessionResource,
    expected_response: Session,
    subject: SessionBuilder,
) -> None:
    """It should create a BasicSession if session_data is None."""
    assert subject.to_response(session_resource) == expected_response


def test_create_control_command(
    current_time: datetime,
    subject: SessionBuilder,
) -> None:
    """It should create a control command and add it to the session."""
    session_created_at = datetime.now()

    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        control_commands=[],
    )

    command_data = SessionControlCommandCreateData(
        controlType=SessionControlType.START,
    )

    control_command_result, session_result = subject.create_control_command(
        session=session,
        control_command_id="control-command-id",
        control_command_data=command_data,
        created_at=current_time,
    )

    assert control_command_result == SessionControlCommand(
        id="control-command-id",
        createdAt=current_time,
        controlType=SessionControlType.START,
    )

    assert session_result == SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        control_commands=[control_command_result],
    )
