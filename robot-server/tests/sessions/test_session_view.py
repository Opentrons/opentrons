"""Tests for the session resource model builder."""
import pytest
from datetime import datetime

from robot_server.sessions.session_store import SessionResource
from robot_server.sessions.session_view import SessionView
from robot_server.sessions.session_models import (
    Session,
    BasicSession,
    BasicSessionCreateData,
    ProtocolSession,
    ProtocolSessionCreateData,
    ProtocolSessionCreateParams,
)

from robot_server.sessions.action_models import (
    SessionAction,
    SessionActionCreateData,
    SessionActionType,
)


def test_create_session_resource_from_none() -> None:
    """It should create a basic session from create_data=None."""
    created_at = datetime.now()
    create_data = None

    subject = SessionView()
    result = subject.as_resource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
    )

    assert result == SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=created_at,
        actions=[],
    )


def test_create_session_resource() -> None:
    """It should create a session with create_data specified."""
    created_at = datetime.now()
    create_data = BasicSessionCreateData()

    subject = SessionView()
    result = subject.as_resource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
    )

    assert result == SessionResource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
        actions=[],
    )


def test_create_protocol_session_resource() -> None:
    """It should create a protocol session resource view."""
    created_at = datetime.now()
    create_data = ProtocolSessionCreateData(
        createParams=ProtocolSessionCreateParams(protocolId="protocol-id")
    )

    subject = SessionView()
    result = subject.as_resource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
    )

    assert result == SessionResource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
        actions=[],
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
                actions=[],
            ),
            BasicSession(
                id="session-id",
                createdAt=current_time,
                actions=[],
            ),
        ),
        (
            SessionResource(
                session_id="session-id",
                create_data=ProtocolSessionCreateData(
                    createParams=ProtocolSessionCreateParams(protocolId="protocol-id")
                ),
                created_at=current_time,
                actions=[],
            ),
            ProtocolSession(
                id="session-id",
                createdAt=current_time,
                createParams=ProtocolSessionCreateParams(protocolId="protocol-id"),
                actions=[],
            ),
        ),
    ),
)
def test_to_response(
    session_resource: SessionResource,
    expected_response: Session,
) -> None:
    """It should create a BasicSession if session_data is None."""
    subject = SessionView()
    assert subject.as_response(session_resource) == expected_response


def test_create_action(current_time: datetime) -> None:
    """It should create a control action and add it to the session."""
    session_created_at = datetime.now()

    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[],
    )

    command_data = SessionActionCreateData(
        actionType=SessionActionType.START,
    )

    subject = SessionView()
    action_result, session_result = subject.with_action(
        session=session,
        action_id="control-command-id",
        action_data=command_data,
        created_at=current_time,
    )

    assert action_result == SessionAction(
        id="control-command-id",
        createdAt=current_time,
        actionType=SessionActionType.START,
    )

    assert session_result == SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[action_result],
    )
