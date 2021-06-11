"""Common test fixtures for sessions route tests."""
import pytest
from decoy import Decoy

from robot_server.sessions.session_view import SessionView
from robot_server.sessions.session_store import SessionStore
from robot_server.sessions.engine_store import EngineStore


@pytest.fixture
def session_store(decoy: Decoy) -> SessionStore:
    """Get a mock SessionStore interface."""
    return decoy.create_decoy(spec=SessionStore)


@pytest.fixture
def session_view(decoy: Decoy) -> SessionView:
    """Get a mock SessionView interface."""
    return decoy.create_decoy(spec=SessionView)


@pytest.fixture
def engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore interface."""
    return decoy.create_decoy(spec=EngineStore)
