"""Tests for base /sessions routes."""
import pytest
from datetime import datetime
from decoy import Decoy
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient

from tests.helpers import verify_response
from robot_server.protocols import (
    ProtocolStore,
    ProtocolResource,
    ProtocolFileType,
    ProtocolNotFoundError,
    ProtocolNotFound,
)

from robot_server.sessions.session_view import SessionView, BasicSessionCreateData

from robot_server.sessions.session_models import (
    SessionStatus,
    BasicSession,
    ProtocolSession,
    ProtocolSessionCreateData,
    ProtocolSessionCreateParams,
)

from robot_server.sessions.engine_store import EngineStore, EngineConflictError

from robot_server.sessions.session_store import (
    SessionStore,
    SessionNotFoundError,
    SessionResource,
)

from robot_server.sessions.router.base_router import (
    base_router,
    SessionNotFound,
    SessionAlreadyActive,
)


@pytest.fixture(autouse=True)
def setup_app(app: FastAPI) -> None:
    """Setup the FastAPI app with /sessions routes."""
    app.include_router(base_router)


async def test_create_session(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should be able to create a basic session."""
    session = SessionResource(
        session_id=unique_id,
        created_at=current_time,
        create_data=BasicSessionCreateData(),
        actions=[],
    )
    expected_response = BasicSession(
        id=unique_id,
        createdAt=current_time,
        status=SessionStatus.READY_TO_START,
        actions=[],
        commands=[],
    )

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])

    decoy.when(engine_store.engine.state_view.commands.get_status()).then_return(
        SessionStatus.READY_TO_START
    )

    decoy.when(
        session_view.as_resource(
            create_data=BasicSessionCreateData(),
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(session)

    decoy.when(
        session_view.as_response(
            session=session,
            commands=[],
            engine_status=SessionStatus.READY_TO_START,
        ),
    ).then_return(expected_response)

    response = await async_client.post(
        "/sessions",
        json={"data": {"sessionType": "basic"}},
    )

    verify_response(response, expected_status=201, expected_data=expected_response)

    # TODO(mc, 2021-05-27): spec the initialize method to return actual data
    decoy.verify(
        await engine_store.create(protocol=None),
        session_store.upsert(session=session),
    )


async def test_create_protocol_session(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    protocol_store: ProtocolStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should be able to create a protocol session."""
    session = SessionResource(
        session_id=unique_id,
        created_at=current_time,
        create_data=ProtocolSessionCreateData(
            createParams=ProtocolSessionCreateParams(protocolId="protocol-id")
        ),
        actions=[],
    )
    protocol = ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        created_at=datetime.now(),
        files=[],
    )
    expected_response = ProtocolSession(
        id=unique_id,
        createdAt=current_time,
        status=SessionStatus.READY_TO_START,
        createParams=ProtocolSessionCreateParams(protocolId="protocol-id"),
        actions=[],
        commands=[],
    )

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_return(protocol)

    decoy.when(
        session_view.as_resource(
            create_data=ProtocolSessionCreateData(
                createParams=ProtocolSessionCreateParams(protocolId="protocol-id")
            ),
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(session)

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.commands.get_status()).then_return(
        SessionStatus.READY_TO_START
    )

    decoy.when(
        session_view.as_response(
            session=session,
            commands=[],
            engine_status=SessionStatus.READY_TO_START,
        ),
    ).then_return(expected_response)

    response = await async_client.post(
        "/sessions",
        json={
            "data": {
                "sessionType": "protocol",
                "createParams": {"protocolId": "protocol-id"},
            }
        },
    )

    verify_response(response, expected_status=201, expected_data=expected_response)

    # TODO(mc, 2021-05-27): spec the initialize method to return actual data
    decoy.verify(
        await engine_store.create(protocol=protocol),
        session_store.upsert(session=session),
    )


async def test_create_protocol_session_missing_protocol(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    protocol_store: ProtocolStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should 404 if a protocol for a session does not exist."""
    error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_raise(error)

    response = await async_client.post(
        "/sessions",
        json={
            "data": {
                "sessionType": "protocol",
                "createParams": {"protocolId": "protocol-id"},
            }
        },
    )

    verify_response(
        response,
        expected_status=404,
        expected_errors=ProtocolNotFound(detail=str(error)),
    )


async def test_create_session_conflict(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should respond with a conflict error if multiple engines are created."""
    session = SessionResource(
        session_id=unique_id,
        create_data=BasicSessionCreateData(),
        created_at=current_time,
        actions=[],
    )

    decoy.when(
        session_view.as_resource(
            create_data=None,
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(session)

    decoy.when(await engine_store.create(protocol=None)).then_raise(
        EngineConflictError("oh no")
    )

    response = await async_client.post("/sessions")

    verify_response(
        response,
        expected_status=409,
        expected_errors=SessionAlreadyActive(detail="oh no"),
    )


def test_get_session(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should be able to get a session by ID."""
    created_at = datetime.now()
    create_data = BasicSessionCreateData()
    session = SessionResource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
        actions=[],
    )
    expected_response = BasicSession(
        id="session-id",
        createdAt=created_at,
        status=SessionStatus.READY_TO_START,
        actions=[],
        commands=[],
    )

    decoy.when(session_store.get(session_id="session-id")).then_return(session)

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.commands.get_status()).then_return(
        SessionStatus.READY_TO_START
    )

    decoy.when(
        session_view.as_response(
            session=session,
            commands=[],
            engine_status=SessionStatus.READY_TO_START,
        ),
    ).then_return(expected_response)

    response = client.get("/sessions/session-id")

    verify_response(response, expected_status=200, expected_data=expected_response)


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
    """It should return an empty collection response when no sessions exist."""
    decoy.when(session_store.get_all()).then_return([])

    response = client.get("/sessions")

    verify_response(response, expected_status=200, expected_data=[])


def test_get_sessions_not_empty(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should return a collection response when a session exists."""
    # TODO(mc, 2021-06-23): add actual multi-session support
    created_at_1 = datetime.now()

    session_1 = SessionResource(
        session_id="unique-id-1",
        create_data=BasicSessionCreateData(),
        created_at=created_at_1,
        actions=[],
    )

    response_1 = BasicSession(
        id="unique-id-1",
        createdAt=created_at_1,
        status=SessionStatus.SUCCEEDED,
        actions=[],
        commands=[],
    )

    decoy.when(session_store.get_all()).then_return([session_1])

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.commands.get_status()).then_return(
        SessionStatus.SUCCEEDED
    )

    decoy.when(
        session_view.as_response(
            session=session_1,
            commands=[],
            engine_status=SessionStatus.SUCCEEDED,
        ),
    ).then_return(response_1)

    response = client.get("/sessions")

    verify_response(response, expected_status=200, expected_data=[response_1])


def test_delete_session_by_id(
    decoy: Decoy,
    session_store: SessionStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should be able to remove a session by ID."""
    response = client.delete("/sessions/unique-id")

    decoy.verify(
        engine_store.clear(),
        session_store.remove(session_id="unique-id"),
    )

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
