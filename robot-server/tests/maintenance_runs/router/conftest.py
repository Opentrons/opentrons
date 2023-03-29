"""Common test fixtures for runs route tests."""
import pytest
from decoy import Decoy

from robot_server.protocols import ProtocolStore
from robot_server.runs.run_auto_deleter import RunAutoDeleter
from robot_server.runs.run_store import RunStore
from robot_server.maintenance_run.engine_store import EngineStore
from robot_server.maintenance_run.maintenance_run_data_manager import (
    MaintenanceRunDataManager,
)
from opentrons.protocol_engine import ProtocolEngine


@pytest.fixture()
def mock_engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=EngineStore)


@pytest.fixture()
def mock_protocol_engine(decoy: Decoy) -> ProtocolEngine:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=ProtocolEngine)


@pytest.fixture
def mock_run_data_manager(decoy: Decoy) -> MaintenanceRunDataManager:
    """Get a mock RunDataManager."""
    return decoy.mock(cls=MaintenanceRunDataManager)
