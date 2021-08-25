"""Common test fixtures for protocols route tests."""
import pytest
from decoy import Decoy

from robot_server.service.task_runner import TaskRunner
from robot_server.protocols.protocol_store import ProtocolStore
from robot_server.protocols.response_builder import ResponseBuilder
from robot_server.protocols.protocol_analyzer import ProtocolAnalyzer


@pytest.fixture
def task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mocked out TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a fake ProtocolStore interface."""
    return decoy.mock(cls=ProtocolStore)


@pytest.fixture
def response_builder(decoy: Decoy) -> ResponseBuilder:
    """Get a fake ResponseBuilder interface."""
    return decoy.mock(cls=ResponseBuilder)


@pytest.fixture
def protocol_analyzer(decoy: Decoy) -> ProtocolAnalyzer:
    """Get a mocked out ProtocolAnalyzer."""
    return decoy.mock(cls=ProtocolAnalyzer)
