"""Common test fixtures for runs route tests."""
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
from robot_server.sessions.run_view import RunView
from robot_server.sessions.run_store import RunStore
from robot_server.sessions.engine_store import EngineStore
from robot_server.sessions.dependencies import get_run_store, get_engine_store


@pytest.fixture
def task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mock background TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a mock ProtocolStore interface."""
    return decoy.mock(cls=ProtocolStore)


@pytest.fixture
def run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore interface."""
    return decoy.mock(cls=RunStore)


@pytest.fixture
def run_view(decoy: Decoy) -> RunView:
    """Get a mock RunView interface."""
    return decoy.mock(cls=RunView)


@pytest.fixture
def engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=EngineStore)


@pytest.fixture
def app(
    task_runner: TaskRunner,
    run_store: RunStore,
    run_view: RunView,
    engine_store: EngineStore,
    protocol_store: ProtocolStore,
    unique_id: str,
    current_time: datetime,
) -> FastAPI:
    """Get a FastAPI app with mocked-out dependencies."""
    app = FastAPI(exception_handlers=exception_handlers)
    app.dependency_overrides[TaskRunner] = lambda: task_runner
    app.dependency_overrides[RunView] = lambda: run_view
    app.dependency_overrides[get_run_store] = lambda: run_store
    app.dependency_overrides[get_engine_store] = lambda: engine_store
    app.dependency_overrides[get_protocol_store] = lambda: protocol_store
    app.dependency_overrides[get_unique_id] = lambda: unique_id
    app.dependency_overrides[get_current_time] = lambda: current_time

    return app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    """Get an TestClient for /runs route testing."""
    return TestClient(app)


@pytest.fixture
async def async_client(
    loop: asyncio.AbstractEventLoop,
    app: FastAPI,
) -> AsyncIterator[AsyncClient]:
    """Get an asynchronous client for /runs route testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
