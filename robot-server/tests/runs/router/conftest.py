"""Common test fixtures for runs route tests."""
from opentrons.hardware_control import HardwareControlAPI, OT3HardwareControlAPI
import pytest
from decoy import Decoy

from robot_server.protocols.protocol_store import ProtocolStore
from robot_server.runs.run_auto_deleter import RunAutoDeleter
from robot_server.runs.run_store import RunStore
from robot_server.runs.run_orchestrator_store import RunOrchestratorStore
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
    MaintenanceRunOrchestratorStore,
)
from robot_server.deck_configuration.store import DeckConfigurationStore

from robot_server.file_provider.provider import FileProviderWrapper

from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_engine.resources import FileProvider


@pytest.fixture()
def mock_protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a mock ProtocolStore interface."""
    return decoy.mock(cls=ProtocolStore)


@pytest.fixture()
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore interface."""
    return decoy.mock(cls=RunStore)


@pytest.fixture()
def mock_run_orchestrator_store(decoy: Decoy) -> RunOrchestratorStore:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=RunOrchestratorStore)


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
def mock_maintenance_run_orchestrator_store(
    decoy: Decoy,
) -> MaintenanceRunOrchestratorStore:
    """Get a mock MaintenanceRunOrchestratorStore interface."""
    return decoy.mock(cls=MaintenanceRunOrchestratorStore)


@pytest.fixture
def mock_deck_configuration_store(decoy: Decoy) -> DeckConfigurationStore:
    """Get a mock DeckConfigurationStore."""
    return decoy.mock(cls=DeckConfigurationStore)


@pytest.fixture()
def mock_file_provider_wrapper(decoy: Decoy) -> FileProviderWrapper:
    """Return a mock FileProviderWrapper."""
    return decoy.mock(cls=FileProviderWrapper)


@pytest.fixture()
def mock_file_provider(
    decoy: Decoy, mock_file_provider_wrapper: FileProviderWrapper
) -> FileProvider:
    """Return a mock FileProvider."""
    return decoy.mock(cls=FileProvider)


@pytest.fixture
def mock_hardware_api(decoy: Decoy) -> HardwareControlAPI:
    """Get a mock HardwareControlAPI."""
    return decoy.mock(cls=OT3HardwareControlAPI)
