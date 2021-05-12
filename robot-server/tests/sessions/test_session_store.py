"""Tests for robot_server.sessions.session_store."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine import StateView as EngineState
from robot_server.sessions.engine_store import EngineStore, EngineNotFoundError
from robot_server.sessions.session_type import SessionType
from robot_server.sessions.session_models import Session, CreateSessionData
from robot_server.sessions.session_store import SessionStore, SessionNotFoundError


@pytest.fixture
def decoy() -> Decoy:
    """Get a Decoy state container."""
    return Decoy()


@pytest.fixture
def engine_state(decoy: Decoy) -> EngineState:
    """Get a fake ProtocolEngine state view."""
    return decoy.create_decoy(spec=EngineState)


@pytest.fixture
def engine_store(decoy: Decoy) -> EngineStore:
    """Get a fake EngineStore interface."""
    return decoy.create_decoy(spec=EngineStore)


@pytest.fixture
def subject(engine_store: EngineStore) -> SessionStore:
    """Get a SessionStore test subject with its dependencies mocked out."""
    return SessionStore(engine_store=engine_store)


def test_create_specific_session(subject: SessionStore) -> None:
    """It should be able to create a specific type of session."""
    session_data = CreateSessionData(sessionType=SessionType.BASIC)
    result = subject.create_session(session_data=session_data, session_id="session-id")

    assert result == Session(
        id="session-id",
        sessionType=SessionType.BASIC,
        commands=[],
    )


def test_get_session(
    decoy: Decoy,
    engine_store: EngineStore,
    engine_state: EngineState,
    subject: SessionStore,
) -> None:
    """It can get a created session."""
    decoy.when(engine_store.get_state("session-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get_all_command_ids()).then_return(["foo", "bar"])

    session_data = CreateSessionData(sessionType=SessionType.BASIC)
    subject.create_session(session_data=session_data, session_id="session-id")
    result = subject.get_session(session_id="session-id")

    assert result == Session(
        id="session-id",
        sessionType=SessionType.BASIC,
        commands=["foo", "bar"],
    )


def test_get_session_missing(
    decoy: Decoy,
    engine_store: EngineStore,
    engine_state: EngineState,
    subject: SessionStore,
) -> None:
    """It raises if the session does not exist."""
    with pytest.raises(SessionNotFoundError, match="session-id"):
        subject.get_session(session_id="session-id")


def test_get_session_no_engine(
    decoy: Decoy,
    engine_store: EngineStore,
    engine_state: EngineState,
    subject: SessionStore,
) -> None:
    """It can get a created session even if no engine has been created yet."""
    decoy.when(engine_store.get_state("session-id")).then_raise(
        EngineNotFoundError("session-id")
    )

    session_data = CreateSessionData(sessionType=SessionType.BASIC)
    subject.create_session(session_data=session_data, session_id="session-id")
    result = subject.get_session(session_id="session-id")

    assert result == Session(
        id="session-id",
        sessionType=SessionType.BASIC,
        commands=[],
    )


def test_get_all_sessions(
    decoy: Decoy,
    engine_store: EngineStore,
    engine_state: EngineState,
    subject: SessionStore,
) -> None:
    """It can get all created sessions."""
    decoy.when(engine_store.get_state("session-id-1")).then_return(engine_state)
    decoy.when(engine_store.get_state("session-id-2")).then_raise(
        EngineNotFoundError("session-id-2")
    )

    decoy.when(engine_state.commands.get_all_command_ids()).then_return(["foo", "bar"])

    session_data = CreateSessionData(sessionType=SessionType.BASIC)
    subject.create_session(session_data=session_data, session_id="session-id-1")
    subject.create_session(session_data=session_data, session_id="session-id-2")

    result = subject.get_all_sessions()

    assert result == [
        Session(
            id="session-id-1",
            sessionType=SessionType.BASIC,
            commands=["foo", "bar"],
        ),
        Session(
            id="session-id-2",
            sessionType=SessionType.BASIC,
            commands=[],
        ),
    ]
