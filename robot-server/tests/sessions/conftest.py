"""Common test fixtures for sessions route tests."""
import pytest
from decoy import Decoy

from robot_server.sessions.session_builder import SessionBuilder
from robot_server.sessions.session_store import SessionStore
from robot_server.sessions.engine_store import EngineStore


@pytest.fixture
def session_store(decoy: Decoy) -> SessionStore:
    """Get a fake SessionStore interface."""
    return decoy.create_decoy(spec=SessionStore)


@pytest.fixture
def session_builder(decoy: Decoy) -> SessionBuilder:
    """Get a fake SessionBuilder interface."""
    return decoy.create_decoy(spec=SessionBuilder)


@pytest.fixture
def engine_store(decoy: Decoy) -> EngineStore:
    """Get a mocked out EngineStore interface."""
    return decoy.create_decoy(spec=EngineStore)
