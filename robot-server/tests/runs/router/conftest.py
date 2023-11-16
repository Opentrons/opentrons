"""Common test fixtures for runs route tests."""
import pytest
from decoy import Decoy

from robot_server.protocols import ProtocolStore
from robot_server.runs.run_auto_deleter import RunAutoDeleter
from robot_server.runs.run_store import RunStore
from robot_server.runs.engine_store import EngineStore
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.maintenance_runs import MaintenanceEngineStore
from robot_server.deck_configuration.store import DeckConfigurationStore

from opentrons.protocol_engine import ProtocolEngine


@pytest.fixture()
def mock_protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a mock ProtocolStore interface."""
    return decoy.mock(cls=ProtocolStore)


@pytest.fixture()
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore interface."""
    return decoy.mock(cls=RunStore)


@pytest.fixture()
def mock_engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=EngineStore)


@pytest.fixture()
def mock_protocol_engine(decoy: Decoy) -> ProtocolEngine:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=ProtocolEngine)


@pytest.fixture
def mock_run_data_manager(decoy: Decoy) -> RunDataManager:
    """Get a mock RunDataManager."""
    return decoy.mock(cls=RunDataManager)


@pytest.fixture()
def mock_run_auto_deleter(decoy: Decoy) -> RunAutoDeleter:
    """Get a mock RunAutoDeleter interface."""
    return decoy.mock(cls=RunAutoDeleter)


@pytest.fixture()
def mock_maintenance_engine_store(decoy: Decoy) -> MaintenanceEngineStore:
    """Get a mock MaintenanceEngineStore interface."""
    return decoy.mock(cls=MaintenanceEngineStore)


@pytest.fixture
def mock_deck_configuration_store(decoy: Decoy) -> DeckConfigurationStore:
    """Get a mock DeckConfigurationStore."""
    return decoy.mock(cls=DeckConfigurationStore)
