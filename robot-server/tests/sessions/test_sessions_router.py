"""Tests for the /sessions router."""
import pytest
from asyncio import AbstractEventLoop
from datetime import datetime
from decoy import Decoy
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient
from typing import AsyncIterator

from opentrons.protocol_engine import (
    CommandStatus,
    commands as pe_commands,
    errors as pe_errors,
)

from robot_server.errors import exception_handlers
from robot_server.protocols import (
    ProtocolStore,
    ProtocolResource,
    ProtocolFileType,
    ProtocolNotFoundError,
    ProtocolNotFound,
)
from robot_server.sessions.session_view import (
    SessionView,
    BasicSessionCreateData,
)
from robot_server.sessions.session_models import (
    BasicSession,
    ProtocolSession,
    ProtocolSessionCreateData,
    ProtocolSessionCreateParams,
    SessionCommandSummary,
)

from robot_server.sessions.engine_store import (
    EngineStore,
    EngineConflictError,
    EngineMissingError,
)

from robot_server.sessions.session_store import (
    SessionStore,
    SessionNotFoundError,
    SessionResource,
)

from robot_server.sessions.action_models import (
    SessionAction,
    SessionActionType,
    SessionActionCreateData,
)

from robot_server.sessions.router import (
    sessions_router,
    SessionNotFound,
    SessionAlreadyActive,
    SessionActionNotAllowed,
    CommandNotFound,
    get_session_store,
    get_engine_store,
    get_protocol_store,
    get_unique_id,
    get_current_time,
)

from ..helpers import verify_response


@pytest.fixture
def app(
    session_store: SessionStore,
    session_view: SessionView,
    engine_store: EngineStore,
    protocol_store: ProtocolStore,
    unique_id: str,
    current_time: datetime,
) -> FastAPI:
    """Get a FastAPI app with /sessions routes and mocked-out dependencies."""
    app = FastAPI(exception_handlers=exception_handlers)
    app.dependency_overrides[SessionView] = lambda: session_view
    app.dependency_overrides[get_session_store] = lambda: session_store
    app.dependency_overrides[get_engine_store] = lambda: engine_store
    app.dependency_overrides[get_protocol_store] = lambda: protocol_store
    app.dependency_overrides[get_unique_id] = lambda: unique_id
    app.dependency_overrides[get_current_time] = lambda: current_time
    app.include_router(sessions_router)

    return app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    """Get an TestClient for /sessions route testing."""
    return TestClient(app)


@pytest.fixture
async def async_client(
    loop: AbstractEventLoop,
    app: FastAPI,
) -> AsyncIterator[AsyncClient]:
    """Get an asynchronous client for /sessions route testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


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
        actions=[],
        commands=[],
    )

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])

    decoy.when(
        session_view.as_resource(
            create_data=BasicSessionCreateData(),
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(session)

    decoy.when(
        session_view.as_response(session=session, commands=[]),
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

    decoy.when(
        session_view.as_response(session=session, commands=[]),
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
        actions=[],
        commands=[],
    )

    decoy.when(session_store.get(session_id="session-id")).then_return(session)

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])

    decoy.when(
        session_view.as_response(session=session, commands=[]),
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
        actions=[],
        commands=[],
    )

    decoy.when(session_store.get_all()).then_return([session_1])

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])

    decoy.when(
        session_view.as_response(session=session_1, commands=[]),
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


def test_create_session_action(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should handle a start input."""
    session_created_at = datetime.now()

    actions = SessionAction(
        actionType=SessionActionType.START,
        createdAt=current_time,
        id=unique_id,
    )

    prev_session = SessionResource(
        session_id="unique-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[],
    )

    next_session = SessionResource(
        session_id="unique-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[actions],
    )

    decoy.when(session_store.get(session_id="session-id")).then_return(prev_session)

    decoy.when(
        session_view.with_action(
            session=prev_session,
            action_id=unique_id,
            action_data=SessionActionCreateData(actionType=SessionActionType.START),
            created_at=current_time,
        ),
    ).then_return((actions, next_session))

    response = client.post(
        "/sessions/session-id/actions",
        json={"data": {"actionType": "start"}},
    )

    verify_response(response, expected_status=201, expected_data=actions)
    decoy.verify(engine_store.runner.play())


def test_create_session_action_with_missing_id(
    decoy: Decoy,
    session_store: SessionStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    not_found_error = SessionNotFoundError(session_id="session-id")

    decoy.when(session_store.get(session_id="session-id")).then_raise(not_found_error)

    response = client.post(
        "/sessions/session-id/actions",
        json={"data": {"actionType": "start"}},
    )

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(not_found_error)),
    )


def test_create_session_action_without_runner(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should handle a start input."""
    session_created_at = datetime.now()

    actions = SessionAction(
        actionType=SessionActionType.START,
        createdAt=current_time,
        id=unique_id,
    )

    prev_session = SessionResource(
        session_id="unique-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[],
    )

    next_session = SessionResource(
        session_id="unique-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[actions],
    )

    decoy.when(session_store.get(session_id="session-id")).then_return(prev_session)

    decoy.when(
        session_view.with_action(
            session=prev_session,
            action_id=unique_id,
            action_data=SessionActionCreateData(actionType=SessionActionType.START),
            created_at=current_time,
        ),
    ).then_return((actions, next_session))

    decoy.when(engine_store.runner.play()).then_raise(EngineMissingError("oh no"))

    response = client.post(
        "/sessions/session-id/actions",
        json={"data": {"actionType": "start"}},
    )

    verify_response(
        response,
        expected_status=400,
        expected_errors=SessionActionNotAllowed(detail="oh no"),
    )


def test_get_session_commands(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should return a list of all commands in a session."""
    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
    )

    command = pe_commands.MoveToWell(
        id="command-id",
        status=CommandStatus.RUNNING,
        createdAt=datetime(year=2022, month=2, day=2),
        data=pe_commands.MoveToWellData(pipetteId="a", labwareId="b", wellName="c"),
    )

    command_summary = SessionCommandSummary(
        id="command-id",
        commandType="moveToWell",
        status=CommandStatus.RUNNING,
    )

    session_response = BasicSession(
        id="session-id",
        createdAt=datetime(year=2021, month=1, day=1),
        actions=[],
        commands=[command_summary],
    )

    decoy.when(session_store.get(session_id="session-id")).then_return(session)

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([command])

    decoy.when(
        session_view.as_response(session=session, commands=[command]),
    ).then_return(session_response)

    response = client.get("/sessions/session-id/commands")

    verify_response(response, expected_status=200, expected_data=[command_summary])


def test_get_session_commands_missing_session(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should 404 if you attempt to get the commands for a non-existent session."""
    key_error = SessionNotFoundError(session_id="session-id")

    decoy.when(session_store.get(session_id="session-id")).then_raise(key_error)

    response = client.get("/sessions/session-id/commands")

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(key_error)),
    )


def test_get_session_command_by_id(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should return full details about a command by ID."""
    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
    )

    session_response = BasicSession(
        id="session-id",
        createdAt=datetime(year=2021, month=1, day=1),
        actions=[],
        commands=[],
    )

    command = pe_commands.MoveToWell(
        id="command-id",
        status=CommandStatus.RUNNING,
        createdAt=datetime(year=2022, month=2, day=2),
        data=pe_commands.MoveToWellData(pipetteId="a", labwareId="b", wellName="c"),
    )

    decoy.when(session_store.get(session_id="session-id")).then_return(session)

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([command])

    decoy.when(
        session_view.as_response(session=session, commands=[command]),
    ).then_return(session_response)

    decoy.when(engine_store.engine.state_view.commands.get("command-id")).then_return(
        command
    )

    response = client.get("/sessions/session-id/commands/command-id")

    verify_response(response, expected_status=200, expected_data=command)


def test_get_session_command_missing_session(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should 404 if you attempt to get a command for a non-existent session."""
    key_error = SessionNotFoundError(session_id="session-id")

    decoy.when(session_store.get(session_id="session-id")).then_raise(key_error)

    response = client.get("/sessions/session-id/commands/command-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(key_error)),
    )


def test_get_session_command_missing_command(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should 404 if you attempt to get a non-existent command."""
    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
    )

    session_response = BasicSession(
        id="session-id",
        createdAt=datetime(year=2021, month=1, day=1),
        actions=[],
        commands=[],
    )

    key_error = pe_errors.CommandDoesNotExistError("oh no")

    decoy.when(session_store.get(session_id="session-id")).then_return(session)

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])

    decoy.when(
        session_view.as_response(session=session, commands=[]),
    ).then_return(session_response)

    decoy.when(engine_store.engine.state_view.commands.get("command-id")).then_raise(
        key_error
    )

    response = client.get("/sessions/session-id/commands/command-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=CommandNotFound(detail=str(key_error)),
    )
