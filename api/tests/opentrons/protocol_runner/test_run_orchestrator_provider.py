import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import-untyped]
from decoy import Decoy
from typing import Union, Optional

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_engine import (
    ProtocolEngine,
    commands as pe_commands,
    CommandIntent,
)
from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_reader import JsonProtocolConfig, PythonProtocolConfig
from opentrons.protocol_runner.run_orchestrator import (
    RunOrchestrator,
    RunOrchestratorProvider,
)
from opentrons.protocol_runner.protocol_runner import (
    JsonRunner,
    PythonAndLegacyRunner,
    LiveRunner,
    AnyRunner,
)


@pytest.fixture
def mock_protocol_python_runner(decoy: Decoy) -> PythonAndLegacyRunner:
    """Get a mocked out PythonAndLegacyRunner dependency."""
    return decoy.mock(cls=PythonAndLegacyRunner)


@pytest.fixture
def mock_protocol_json_runner(decoy: Decoy) -> JsonRunner:
    """Get a mocked out PythonAndLegacyRunner dependency."""
    return decoy.mock(cls=JsonRunner)


@pytest.fixture
def mock_live_runner(decoy: Decoy) -> LiveRunner:
    """Get a mocked out LiveRunner dependency."""
    return decoy.mock(cls=LiveRunner)


@pytest.fixture
def mock_protocol_engine(decoy: Decoy) -> ProtocolEngine:
    """Get a mocked out ProtocolEngine dependency."""
    return decoy.mock(cls=ProtocolEngine)


@pytest.fixture
def mock_hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mocked out HardwareAPI dependency."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def subject() -> RunOrchestratorProvider:
    return RunOrchestratorProvider()


@pytest.mark.parametrize(
    "input_protocol_config, mock_protocol_runner",
    [
        (
            JsonProtocolConfig(schema_version=7),
            lazy_fixture("mock_protocol_json_runner"),
        ),
        (
            PythonProtocolConfig(api_version=APIVersion(2, 14)),
            lazy_fixture("mock_protocol_python_runner"),
        ),
        (None, None),
    ],
)
def test_build_run_orchestrator_provider(
    decoy: Decoy,
    subject: RunOrchestratorProvider,
    mock_protocol_engine: ProtocolEngine,
    mock_hardware_api: HardwareAPI,
    input_protocol_config: Optional[Union[PythonProtocolConfig, JsonProtocolConfig]],
    mock_live_runner: LiveRunner,
    mock_protocol_runner: Optional[Union[PythonAndLegacyRunner, JsonRunner]],
) -> None:
    result = subject.build_orchestrator(
        protocol_config=input_protocol_config,
        protocol_engine=mock_protocol_engine,
        hardware_api=mock_hardware_api,
    )

    # monkey patch create_runner and stub returned value
    assert result == RunOrchestrator(
        setup_runner=mock_live_runner,
        fixit_runner=mock_live_runner,
        json_or_python_runner=mock_protocol_runner,
    )
