"""Tests for robot_server.sessions.session_store."""
import pytest
from datetime import datetime

from robot_server.sessions.session_models import BasicSessionCreateData

from robot_server.sessions.session_store import (
    SessionStore,
    SessionResource,
    SessionNotFoundError,
)


@pytest.fixture
def subject() -> SessionStore:
    """Get a SessionStore test subject."""
    return SessionStore()


def test_add_session(subject: SessionStore) -> None:
    """It should be able to create a basic session from a None data argument."""
    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        control_commands=[],
    )

    result = subject.add(session)

    assert result == session


def test_get_session(subject: SessionStore) -> None:
    """It can get a previously stored session entry."""
    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        control_commands=[],
    )

    subject.add(session)

    result = subject.get(session_id="session-id")

    assert result == session


def test_get_session_missing(subject: SessionStore) -> None:
    """It raises if the session does not exist."""
    with pytest.raises(SessionNotFoundError, match="session-id"):
        subject.get(session_id="session-id")


def test_get_all_sessions(subject: SessionStore) -> None:
    """It can get all created sessions."""
    session_1 = SessionResource(
        session_id="session-id-1",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        control_commands=[],
    )
    session_2 = SessionResource(
        session_id="session-id-2",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        control_commands=[],
    )

    subject.add(session_1)
    subject.add(session_2)

    result = subject.get_all()

    assert result == [session_1, session_2]


def test_remove_session(subject: SessionStore) -> None:
    """It can get a previously stored session entry."""
    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        control_commands=[],
    )

    subject.add(session)

    result = subject.remove(session_id="session-id")

    assert result == session
    assert subject.get_all() == []


def test_remove_session_missing_id(subject: SessionStore) -> None:
    """It raises if the session does not exist."""
    with pytest.raises(SessionNotFoundError, match="session-id"):
        subject.remove(session_id="session-id")
