"""Common test fixtures for runs route tests."""
import pytest
from decoy import Decoy

from robot_server.maintenance_runs.maintenance_engine_store import (
    MaintenanceEngineStore,
)
from robot_server.maintenance_runs.maintenance_run_data_manager import (
    MaintenanceRunDataManager,
)
from opentrons.protocol_engine import ProtocolEngine


@pytest.fixture()
def mock_maintenance_engine_store(decoy: Decoy) -> MaintenanceEngineStore:
    """Get a mock MaintenanceEngineStore interface."""
    return decoy.mock(cls=MaintenanceEngineStore)


@pytest.fixture()
def mock_protocol_engine(decoy: Decoy) -> ProtocolEngine:
    """Get a mock MaintenanceEngineStore interface."""
    return decoy.mock(cls=ProtocolEngine)


@pytest.fixture
def mock_maintenance_run_data_manager(decoy: Decoy) -> MaintenanceRunDataManager:
    """Get a mock RunDataManager."""
    return decoy.mock(cls=MaintenanceRunDataManager)
