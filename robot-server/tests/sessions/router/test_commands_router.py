"""Tests for the /sessions/.../commands routes."""
import pytest

from datetime import datetime
from decoy import Decoy, matchers
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient
from typing import Callable, Awaitable

from tests.helpers import verify_response

from opentrons.protocol_engine import (
    CommandStatus,
    commands as pe_commands,
    errors as pe_errors,
)

from robot_server.service.json_api import ResponseModel
from robot_server.sessions.session_models import (
    BasicSession,
    SessionStatus,
    SessionCommandSummary,
)
from robot_server.sessions.engine_store import EngineStore
from robot_server.sessions.router.base_router import get_session as real_get_session
from robot_server.sessions.router.commands_router import (
    commands_router,
    CommandNotFound,
)


@pytest.fixture
def get_session(decoy: Decoy) -> Callable[..., Awaitable[ResponseModel]]:
    """Get a mock version of the get_session route handler."""
    return decoy.mock(func=real_get_session)


@pytest.fixture(autouse=True)
def setup_app(
    get_session: Callable[..., Awaitable[ResponseModel]],
    app: FastAPI,
) -> None:
    """Setup the FastAPI app with commands routes and dependencies."""
    app.dependency_overrides[real_get_session] = get_session
    app.include_router(commands_router)


async def test_get_session_commands(
    decoy: Decoy,
    get_session: Callable[..., Awaitable[ResponseModel]],
    async_client: AsyncClient,
) -> None:
    """It should return a list of all commands in a session."""
    command_summary = SessionCommandSummary(
        id="command-id",
        commandType="moveToWell",
        status=CommandStatus.RUNNING,
    )

    session_response = BasicSession(
        id="session-id",
        createdAt=datetime(year=2021, month=1, day=1),
        status=SessionStatus.RUNNING,
        actions=[],
        commands=[command_summary],
    )

    decoy.when(
        await get_session(
            sessionId="session-id",
            session_view=matchers.Anything(),
            session_store=matchers.Anything(),
            engine_store=matchers.Anything(),
        ),
    ).then_return(
        ResponseModel(data=session_response)  # type: ignore[arg-type]
    )

    response = await async_client.get("/sessions/session-id/commands")

    verify_response(response, expected_status=200, expected_data=[command_summary])


def test_get_session_command_by_id(
    decoy: Decoy,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should return full details about a command by ID."""
    command = pe_commands.MoveToWell(
        id="command-id",
        status=CommandStatus.RUNNING,
        createdAt=datetime(year=2022, month=2, day=2),
        data=pe_commands.MoveToWellData(pipetteId="a", labwareId="b", wellName="c"),
    )

    decoy.when(engine_store.engine.state_view.commands.get("command-id")).then_return(
        command
    )

    response = client.get("/sessions/session-id/commands/command-id")

    verify_response(response, expected_status=200, expected_data=command)


def test_get_session_command_missing_command(
    decoy: Decoy,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should 404 if you attempt to get a non-existent command."""
    key_error = pe_errors.CommandDoesNotExistError("oh no")

    decoy.when(engine_store.engine.state_view.commands.get("command-id")).then_raise(
        key_error
    )

    response = client.get("/sessions/session-id/commands/command-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=CommandNotFound(detail=str(key_error)),
    )
