"""Tests for the /sessions router."""
import pytest
from datetime import datetime, timezone
from decoy import Decoy
from fastapi import FastAPI
from fastapi.testclient import TestClient

from robot_server.errors import exception_handlers
from robot_server.sessions.router import sessions_router, SessionNotFound
from robot_server.sessions.session_builder import SessionBuilder, CreateBasicSessionData
from robot_server.sessions.session_models import BasicSession
from robot_server.sessions.session_runner import SessionRunner
from robot_server.sessions.session_store import (
    SessionStore,
    SessionNotFoundError,
    SessionStoreEntry,
)

from robot_server.sessions.session_inputs import (
    SessionInput,
    SessionInputType,
    CreateSessionInputData,
)

from robot_server.sessions.dependencies import (
    get_session_builder,
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
def session_builder(decoy: Decoy) -> SessionBuilder:
    """Get a fake SessionBuilder interface."""
    return decoy.create_decoy(spec=SessionBuilder)


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
    session_builder: SessionBuilder,
    session_runner: SessionRunner,
    unique_id: str,
    current_time: datetime,
) -> TestClient:
    """Get an TestClient for /protocols routes with dependencies mocked out."""
    app = FastAPI(exception_handlers=exception_handlers)
    app.dependency_overrides[get_session_builder] = lambda: session_builder
    app.dependency_overrides[get_session_store] = lambda: session_store
    app.dependency_overrides[get_session_runner] = lambda: session_runner
    app.dependency_overrides[get_unique_id] = lambda: unique_id
    app.dependency_overrides[get_current_time] = lambda: current_time
    app.include_router(sessions_router)

    return TestClient(app)


def test_create_session(
    decoy: Decoy,
    session_builder: SessionBuilder,
    session_store: SessionStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should be able to create a basic session from an empty POST request."""
    session_data = CreateBasicSessionData()
    session_entry = SessionStoreEntry(
        session_id=unique_id,
        session_data=session_data,
        created_at=current_time,
        inputs=[],
    )
    expected_session = BasicSession(id=unique_id, createdAt=current_time, inputs=[])

    decoy.when(
        session_store.create(
            session_data=session_data,
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(session_entry)

    decoy.when(
        session_builder.build(
            session_data=session_data,
            session_id=unique_id,
            created_at=current_time,
            inputs=[],
        )
    ).then_return(expected_session)

    response = client.post("/sessions", json={"data": {"sessionType": "basic"}})

    verify_response(response, expected_status=201, expected_data=expected_session)


def test_get_session(
    decoy: Decoy,
    session_builder: SessionBuilder,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should be able to get a session by ID."""
    created_at = datetime.now()
    session_data = CreateBasicSessionData()
    session_entry = SessionStoreEntry(
        session_id="session-id",
        session_data=session_data,
        created_at=created_at,
        inputs=[],
    )
    expected_session = BasicSession(id="session-id", createdAt=created_at, inputs=[])

    decoy.when(session_store.get(session_id="session-id")).then_return(session_entry)

    decoy.when(
        session_builder.build(
            session_id="session-id",
            session_data=session_data,
            created_at=created_at,
            inputs=[],
        )
    ).then_return(expected_session)

    response = client.get("/sessions/session-id")

    verify_response(response, expected_status=200, expected_data=expected_session)


def test_get_session_with_missing_id(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    not_found_error = SessionNotFoundError(session_id="session-id")

    decoy.when(session_store.get(session_id="session-id")).then_raise(not_found_error)

    response = client.get("/sessions/session-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(not_found_error)),
    )


def test_get_sessions_empty(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should return an empty collection response with no sessions exist."""
    decoy.when(session_store.get_all()).then_return([])

    response = client.get("/sessions")

    verify_response(response, expected_status=200, expected_data=[])


def test_get_sessions_not_empty(
    decoy: Decoy,
    session_builder: SessionBuilder,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should return an empty collection response with no sessions exist."""
    created_at_1 = datetime.now()
    created_at_2 = datetime.now()

    entry_1 = SessionStoreEntry(
        session_id="unique-id-1", session_data=None, created_at=created_at_1, inputs=[]
    )
    entry_2 = SessionStoreEntry(
        session_id="unique-id-2", session_data=None, created_at=created_at_2, inputs=[]
    )

    session_1 = BasicSession(id="unique-id-1", createdAt=created_at_1, inputs=[])
    session_2 = BasicSession(id="unique-id-2", createdAt=created_at_2, inputs=[])

    decoy.when(session_store.get_all()).then_return([entry_1, entry_2])

    decoy.when(
        session_builder.build(
            session_id="unique-id-1",
            session_data=None,
            created_at=created_at_1,
            inputs=[],
        )
    ).then_return(session_1)

    decoy.when(
        session_builder.build(
            session_id="unique-id-2",
            session_data=None,
            created_at=created_at_2,
            inputs=[],
        )
    ).then_return(session_2)

    response = client.get("/sessions")

    verify_response(response, expected_status=200, expected_data=[session_1, session_2])


def test_delete_session_by_id(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should be able to remove a session by ID."""
    response = client.delete("/sessions/unique-id")

    decoy.verify(session_store.remove(session_id="unique-id"))

    assert response.status_code == 200
    assert response.json()["data"] is None


def test_delete_session_with_bad_id(
    decoy: Decoy,
    session_store: SessionStore,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    key_error = SessionNotFoundError(session_id="session-id")

    decoy.when(session_store.remove(session_id="session-id")).then_raise(key_error)

    response = client.delete("/sessions/session-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(key_error)),
    )


def test_create_session_input(
    decoy: Decoy,
    session_store: SessionStore,
    session_runner: SessionRunner,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should handle a start input."""
    expected_input = SessionInput(
        inputType=SessionInputType.START,
        createdAt=current_time,
        id=unique_id,
    )

    decoy.when(
        session_store.create_input(
            session_id="session-id",
            input_id=unique_id,
            input_data=CreateSessionInputData(inputType=SessionInputType.START),
            created_at=current_time,
        ),
    ).then_return(expected_input)

    response = client.post(
        "/sessions/session-id/inputs",
        json={"data": {"inputType": "start"}},
    )

    decoy.verify(session_runner.trigger_input_effects(input=expected_input))

    verify_response(response, expected_status=201, expected_data=expected_input)


def test_create_session_input_with_missing_id(
    decoy: Decoy,
    session_store: SessionStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    not_found_error = SessionNotFoundError(session_id="session-id")

    decoy.when(
        session_store.create_input(
            session_id="session-id",
            input_id=unique_id,
            input_data=CreateSessionInputData(inputType=SessionInputType.START),
            created_at=current_time,
        ),
    ).then_raise(not_found_error)

    response = client.post(
        "/sessions/session-id/inputs",
        json={"data": {"inputType": "start"}},
    )

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(not_found_error)),
    )
