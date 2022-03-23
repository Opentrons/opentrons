"""Common test fixtures for runs route tests."""
import pytest
from decoy import Decoy

from robot_server.service.task_runner import TaskRunner
from robot_server.protocols import ProtocolStore
from robot_server.runs.run_view import RunView
from robot_server.runs.run_store import RunStore
from robot_server.runs.engine_store import EngineStore


@pytest.fixture()
def task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mock background TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture()
def protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a mock ProtocolStore interface."""
    return decoy.mock(cls=ProtocolStore)


@pytest.fixture()
def run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore interface."""
    return decoy.mock(cls=RunStore)


@pytest.fixture()
def run_view(decoy: Decoy) -> RunView:
    """Get a mock RunView interface."""
    return decoy.mock(cls=RunView)


@pytest.fixture()
def engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=EngineStore)
