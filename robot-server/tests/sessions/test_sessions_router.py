"""Tests for the /sessions router."""
import pytest
from datetime import datetime, timezone
from decoy import Decoy
from fastapi import FastAPI
from fastapi.testclient import TestClient

from robot_server.errors import exception_handlers
from robot_server.sessions.router import sessions_router, SessionNotFound
from robot_server.sessions.session_models import Session, CreateSessionData, SessionType
from robot_server.sessions.session_store import SessionStore, SessionNotFoundError
from robot_server.sessions.session_runner import SessionRunner

from robot_server.sessions.session_inputs import (
    SessionInput,
    SessionInputType,
    CreateSessionInputData,
)

from robot_server.sessions.dependencies import (
    get_session_store,
    get_session_runner,
    get_unique_id,
    get_current_time,
)

from ..helpers import verify_response


@pytest.fixture
def decoy() -> Decoy:
    """Get a Decoy state container."""
    return Decoy()


@pytest.fixture
def session_store(decoy: Decoy) -> SessionStore:
    """Get a fake SessionStore interface."""
    return decoy.create_decoy(spec=SessionStore)


@pytest.fixture
def session_runner(decoy: Decoy) -> SessionRunner:
    """Get a fake SessionRunner interface."""
    return decoy.create_decoy(spec=SessionRunner)


@pytest.fixture
def unique_id() -> str:
    """Get a fake unique identifier."""
    return "unique-id"


@pytest.fixture
def current_time() -> datetime:
    """Get a fake current time."""
    return datetime(year=2021, month=1, day=1, tzinfo=timezone.utc)


@pytest.fixture
def client(
    session_store: SessionStore,
    session_runner: SessionRunner,
    unique_id: str,
    current_time: datetime,
) -> TestClient:
    """Get an TestClient for /protocols routes with dependencies mocked out."""
    app = FastAPI(exception_handlers=exception_handlers)
    app.dependency_overrides[get_session_store] = lambda: session_store
    app.dependency_overrides[get_session_runner] = lambda: session_runner
    app.dependency_overrides[get_unique_id] = lambda: unique_id
    app.dependency_overrides[get_current_time] = lambda: current_time
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

    verify_response(response, expected_status=200, expected_data=[])


def test_get_sessions_not_empty(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should return an empty collection response with no sessions exist."""
    session1 = Session(id="unique-id-1", createdAt=datetime.now())
    session2 = Session(id="unique-id-2", createdAt=datetime.now())

    decoy.when(session_store.get_all_sessions()).then_return([session1, session2])

    response = client.get("/sessions")

    verify_response(response, expected_status=200, expected_data=[session1, session2])


def test_create_basic_session_implicitely(
    decoy: Decoy,
    session_store: SessionStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should be able to create a basic session from an empty POST request."""
    expected_session = Session(id=unique_id, createdAt=current_time)

    decoy.when(
        session_store.create_session(
            session_data=CreateSessionData(sessionType=SessionType.BASIC),
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(expected_session)

    response = client.post("/sessions")

    verify_response(response, expected_status=201, expected_data=expected_session)


def test_create_session_explicitely(
    decoy: Decoy,
    session_store: SessionStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should be able to create a basic session from an empty POST request."""
    expected_session = Session(id=unique_id, createdAt=current_time)

    decoy.when(
        session_store.create_session(
            session_data=CreateSessionData(sessionType=SessionType.BASIC),
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(expected_session)

    response = client.post("/sessions", json={"data": {"sessionType": "basic"}})

    verify_response(response, expected_status=201, expected_data=expected_session)


def test_get_session(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should be able to get a session by ID."""
    expected_session = Session(id="session-id", createdAt=datetime.now())

    decoy.when(session_store.get_session(session_id="session-id")).then_return(
        expected_session
    )

    response = client.get("/sessions/session-id")

    verify_response(response, expected_status=200, expected_data=expected_session)


def test_get_session_with_missing_id(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    key_error = SessionNotFoundError(session_id="session-id")

    decoy.when(session_store.get_session(session_id="session-id")).then_raise(key_error)

    response = client.get("/sessions/session-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(key_error)),
    )


def test_delete_session_by_id(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should be able to remove a session by ID."""
    expected_session = Session(id="session-id", createdAt=datetime.now())

    decoy.when(session_store.remove_session_by_id(session_id="unique-id")).then_return(
        expected_session
    )

    response = client.delete("/sessions/unique-id")

    verify_response(response, expected_status=200, expected_data=expected_session)


def test_delete_session_by_id_with_missing_id(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    key_error = SessionNotFoundError(session_id="session-id")

    decoy.when(session_store.remove_session_by_id(session_id="session-id")).then_raise(
        key_error
    )

    response = client.delete("/sessions/session-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(key_error)),
    )


def test_create_session_input(
    decoy: Decoy,
    session_runner: SessionRunner,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should handle a pause input."""
    expected_input = SessionInput(
        inputType=SessionInputType.START,
        createdAt=current_time,
        id=unique_id,
    )

    decoy.when(
        session_runner.handle_input(
            session_id="session-id",
            input_id=unique_id,
            input_data=CreateSessionInputData(inputType=SessionInputType.START),
            created_at=current_time,
        )
    ).then_return(expected_input)

    response = client.post(
        "/sessions/session-id/inputs",
        json={"data": {"inputType": "start"}},
    )

    verify_response(response, expected_status=201, expected_data=expected_input)


def test_create_session_input_with_missing_id(
    decoy: Decoy,
    session_runner: SessionRunner,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    key_error = SessionNotFoundError(session_id="session-id")

    decoy.when(
        session_runner.handle_input(
            session_id="session-id",
            input_id=unique_id,
            input_data=CreateSessionInputData(inputType=SessionInputType.START),
            created_at=current_time,
        )
    ).then_raise(key_error)

    response = client.post(
        "/sessions/session-id/inputs",
        json={"data": {"inputType": "start"}},
    )

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(key_error)),
    )
