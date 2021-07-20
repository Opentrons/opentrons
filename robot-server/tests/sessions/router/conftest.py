"""Common test fixtures for sessions route tests."""
import pytest
import asyncio
from datetime import datetime
from decoy import Decoy
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient
from typing import AsyncIterator

from robot_server.errors import exception_handlers
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.task_runner import TaskRunner
from robot_server.protocols import ProtocolStore, get_protocol_store
from robot_server.sessions.session_view import SessionView
from robot_server.sessions.session_store import SessionStore
from robot_server.sessions.engine_store import EngineStore
from robot_server.sessions.dependencies import get_session_store, get_engine_store


@pytest.fixture
def task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mock background TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a mock ProtocolStore interface."""
    return decoy.mock(cls=ProtocolStore)


@pytest.fixture
def session_store(decoy: Decoy) -> SessionStore:
    """Get a mock SessionStore interface."""
    return decoy.mock(cls=SessionStore)


@pytest.fixture
def session_view(decoy: Decoy) -> SessionView:
    """Get a mock SessionView interface."""
    return decoy.mock(cls=SessionView)


@pytest.fixture
def engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=EngineStore)


@pytest.fixture
def app(
    task_runner: TaskRunner,
    session_store: SessionStore,
    session_view: SessionView,
    engine_store: EngineStore,
    protocol_store: ProtocolStore,
    unique_id: str,
    current_time: datetime,
) -> FastAPI:
    """Get a FastAPI app with mocked-out dependencies."""
    app = FastAPI(exception_handlers=exception_handlers)
    app.dependency_overrides[TaskRunner] = lambda: task_runner
    app.dependency_overrides[SessionView] = lambda: session_view
    app.dependency_overrides[get_session_store] = lambda: session_store
    app.dependency_overrides[get_engine_store] = lambda: engine_store
    app.dependency_overrides[get_protocol_store] = lambda: protocol_store
    app.dependency_overrides[get_unique_id] = lambda: unique_id
    app.dependency_overrides[get_current_time] = lambda: current_time

    return app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    """Get an TestClient for /sessions route testing."""
    return TestClient(app)


@pytest.fixture
async def async_client(
    loop: asyncio.AbstractEventLoop,
    app: FastAPI,
) -> AsyncIterator[AsyncClient]:
    """Get an asynchronous client for /sessions route testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
