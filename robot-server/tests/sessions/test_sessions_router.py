"""Tests for the /sessions router."""
import pytest
from decoy import Decoy
from fastapi import FastAPI
from fastapi.testclient import TestClient

from robot_server.errors import exception_handlers
from robot_server.sessions.router import sessions_router, SessionNotFound
from robot_server.sessions.dependencies import get_session_store, get_unique_id
from robot_server.sessions.session_type import SessionType
from robot_server.sessions.session_models import CreateSessionData
from robot_server.sessions.command_models import SessionCommand
from robot_server.sessions.basic_session import BasicSession
from robot_server.sessions.session_store import SessionStore, SessionNotFoundError


@pytest.fixture
def decoy() -> Decoy:
    """Get a Decoy state container."""
    return Decoy()


@pytest.fixture
def session_store(decoy: Decoy) -> SessionStore:
    """Get a fake SessionStore interface."""
    return decoy.create_decoy(spec=SessionStore)


@pytest.fixture
def unique_id() -> str:
    """Get a fake unique-id."""
    return "session-id"


@pytest.fixture
def client(session_store: SessionStore, unique_id: str) -> TestClient:
    """Get an TestClient for /protocols routes with dependencies mocked out."""
    app = FastAPI(exception_handlers=exception_handlers)
    app.dependency_overrides[get_session_store] = lambda: session_store
    app.dependency_overrides[get_unique_id] = lambda: unique_id
    app.include_router(sessions_router)

    return TestClient(app)


def test_get_sessions_empty(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should return an empty collection response with no sessions exist."""
    decoy.when(session_store.get_all_sessions()).then_return([])

    response = client.get("/sessions")

    assert response.status_code == 200
    assert response.json() == {"data": [], "links": None}


def test_get_sessions_not_empty(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should return an empty collection response with no sessions exist."""
    session1 = BasicSession(id="unique-id-1", commands=[])
    session2 = BasicSession(id="unique-id-2", commands=[])

    decoy.when(session_store.get_all_sessions()).then_return([session1, session2])

    response = client.get("/sessions")

    assert response.status_code == 200
    assert response.json() == {
        "data": [
            session1.dict(),
            session2.dict(),
        ],
        "links": None,
    }


def test_create_basic_session_implicitely(
    decoy: Decoy,
    session_store: SessionStore,
    unique_id: str,
    client: TestClient,
) -> None:
    """It should be able to create a basic session from an empty POST request."""
    session = BasicSession(id=unique_id, commands=[])

    decoy.when(
        session_store.create_session(
            session_data=CreateSessionData(sessionType=SessionType.BASIC),
            session_id=unique_id,
        )
    ).then_return(session)

    response = client.post("/sessions")

    assert response.status_code == 201
    assert response.json() == {
        "data": session.dict(),
        "links": None,
    }


def test_create_session_explicitely(
    decoy: Decoy,
    session_store: SessionStore,
    unique_id: str,
    client: TestClient,
) -> None:
    """It should be able to create a basic session from an empty POST request."""
    session = BasicSession(id=unique_id, commands=[])

    decoy.when(
        session_store.create_session(
            session_data=CreateSessionData(sessionType=SessionType.BASIC),
            session_id=unique_id,
        )
    ).then_return(session)

    response = client.post("/sessions", json={"data": {"sessionType": "basic"}})

    assert response.status_code == 201
    assert response.json() == {
        "data": session.dict(),
        "links": None,
    }


def test_get_session(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should be able to get a session by ID."""
    session = BasicSession(id="unique-id", commands=[])

    decoy.when(session_store.get_session(session_id="unique-id")).then_return(session)

    response = client.get("/sessions/unique-id")

    assert response.status_code == 200
    assert response.json() == {
        "data": session.dict(),
        "links": None,
    }


def test_get_session_with_missing_id(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    key_error = SessionNotFoundError(session_id="unique-id")

    decoy.when(session_store.get_session(session_id="unique-id")).then_raise(key_error)

    response = client.get("/sessions/unique-id")

    assert response.status_code == 404
    assert response.json() == {
        "errors": [SessionNotFound(detail=str(key_error)).dict(exclude_none=True)],
    }


def test_delete_session_by_id(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should be able to remove a session by ID."""
    session = BasicSession(id="unique-id", commands=[])

    decoy.when(session_store.remove_session_by_id(session_id="unique-id")).then_return(
        session
    )

    response = client.delete("/sessions/unique-id")

    assert response.status_code == 200
    assert response.json() == {
        "data": session.dict(),
        "links": None,
    }


def test_delete_session_by_id_with_missing_id(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    key_error = SessionNotFoundError(session_id="unique-id")

    decoy.when(session_store.remove_session_by_id(session_id="unique-id")).then_raise(
        key_error
    )

    response = client.delete("/sessions/unique-id")

    assert response.status_code == 404
    assert response.json() == {
        "errors": [SessionNotFound(detail=str(key_error)).dict(exclude_none=True)],
    }


def test_get_session_commands(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should be able to get a session's full command list."""
    command = SessionCommand(id="command-id")

    decoy.when(session_store.get_session_commands(session_id="session-id")).then_return(
        [command]
    )

    response = client.get("/sessions/session-id/commands")

    assert response.status_code == 200
    assert response.json() == {
        "data": [
            command.dict(),
        ],
        "links": None,
    }
