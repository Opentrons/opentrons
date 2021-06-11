"""Tests for robot_server.sessions.session_store."""
import pytest
from datetime import datetime

from robot_server.sessions.session_models import BasicSessionCreateData

from robot_server.sessions.session_store import (
    SessionStore,
    SessionResource,
    SessionNotFoundError,
)


def test_add_session() -> None:
    """It should be able to create a basic session from a None data argument."""
    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        actions=[],
    )

    subject = SessionStore()
    result = subject.upsert(session)

    assert result == session


def test_update_session() -> None:
    """It should be able to update a session in the store."""
    session = SessionResource(
        session_id="identical-session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime(year=2021, month=1, day=1, hour=1, minute=1, second=1),
        actions=[],
    )
    updated_session = SessionResource(
        session_id="identical-session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime(year=2022, month=2, day=2, hour=2, minute=2, second=2),
        actions=[],
    )

    subject = SessionStore()
    subject.upsert(session)

    result = subject.upsert(updated_session)

    assert result == updated_session


def test_get_session() -> None:
    """It can get a previously stored session entry."""
    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        actions=[],
    )

    subject = SessionStore()
    subject.upsert(session)

    result = subject.get(session_id="session-id")

    assert result == session


def test_get_session_missing() -> None:
    """It raises if the session does not exist."""
    subject = SessionStore()

    with pytest.raises(SessionNotFoundError, match="session-id"):
        subject.get(session_id="session-id")


def test_get_all_sessions() -> None:
    """It can get all created sessions."""
    session_1 = SessionResource(
        session_id="session-id-1",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        actions=[],
    )
    session_2 = SessionResource(
        session_id="session-id-2",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        actions=[],
    )

    subject = SessionStore()
    subject.upsert(session_1)
    subject.upsert(session_2)

    result = subject.get_all()

    assert result == [session_1, session_2]


def test_remove_session() -> None:
    """It can get a previously stored session entry."""
    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime.now(),
        actions=[],
    )

    subject = SessionStore()
    subject.upsert(session)

    result = subject.remove(session_id="session-id")

    assert result == session
    assert subject.get_all() == []


def test_remove_session_missing_id() -> None:
    """It raises if the session does not exist."""
    subject = SessionStore()

    with pytest.raises(SessionNotFoundError, match="session-id"):
        subject.remove(session_id="session-id")
