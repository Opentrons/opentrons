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
from opentrons.protocol_runner.run_orchestrator import RunOrchestrator
from opentrons import protocol_runner
from opentrons.protocol_runner.protocol_runner import (
    JsonRunner,
    PythonAndLegacyRunner,
    LiveRunner,
    AnyRunner,
)


@pytest.fixture(autouse=True)
def patch_mock_create_protocol_runner(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Replace deck_conflict.check() with a mock."""
    mock = decoy.mock(func=protocol_runner.create_protocol_runner)
    monkeypatch.setattr(protocol_runner, "create_protocol_runner", mock)


@pytest.fixture
def mock_protocol_python_runner(decoy: Decoy) -> PythonAndLegacyRunner:
    """Get a mocked out PythonAndLegacyRunner dependency."""
    return decoy.mock(cls=PythonAndLegacyRunner)


@pytest.fixture
def mock_protocol_json_runner(decoy: Decoy) -> JsonRunner:
    """Get a mocked out PythonAndLegacyRunner dependency."""
    return decoy.mock(cls=JsonRunner)


@pytest.fixture
def mock_setup_runner(decoy: Decoy) -> LiveRunner:
    """Get a mocked out LiveRunner dependency."""
    return decoy.mock(cls=LiveRunner)


@pytest.fixture
def mock_fixit_runner(decoy: Decoy) -> LiveRunner:
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
def subject(
    mock_protocol_engine: ProtocolEngine, mock_hardware_api: HardwareAPI
) -> RunOrchestrator:
    return RunOrchestrator(
        protocol_engine=mock_protocol_engine,
        hardware_api=mock_hardware_api,
    )


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
    subject: RunOrchestrator,
    mock_protocol_engine: ProtocolEngine,
    mock_hardware_api: HardwareAPI,
    input_protocol_config: Optional[Union[PythonProtocolConfig, JsonProtocolConfig]],
    mock_setup_runner: LiveRunner,
    mock_fixit_runner: LiveRunner,
    mock_protocol_runner: Optional[Union[PythonAndLegacyRunner, JsonRunner]],
) -> None:
    result = subject.build_orchestrator(
        protocol_config=input_protocol_config,
    )
    # decoy.when(
    #     protocol_runner.create_protocol_runner(
    #         protocol_engine=mock_protocol_engine, hardware_api=mock_hardware_api
    #     )
    # ).then_return(mock_setup_runner)
    #
    # decoy.when(
    #     protocol_runner.create_protocol_runner(
    #         protocol_engine=mock_protocol_engine, hardware_api=mock_hardware_api
    #     )
    # ).then_return(mock_fixit_runner)
    #
    # assert result == RunOrchestrator(
    #     setup_runner=mock_setup_runner,
    #     fixit_runner=mock_fixit_runner,
    #     json_or_python_runner=mock_protocol_runner,
    # )


@pytest.mark.parametrize(
    "runner, command_intent, input_protocol_config",
    [
        (
            lazy_fixture("mock_setup_runner"),
            pe_commands.CommandIntent.SETUP,
            None
        ),
        (
            lazy_fixture("mock_fixit_runner"),
            pe_commands.CommandIntent.FIXIT,
            None
        ),
        (
            lazy_fixture("mock_json_runner"),
            pe_commands.CommandIntent.PROTOCOL,
            JsonProtocolConfig(schema_version=7)
        ),
        (
            lazy_fixture("mock_python_runner"),
            pe_commands.CommandIntent.PROTOCOL,
            PythonProtocolConfig(api_version=2.14)
        ),
    ],
)
def test_add_command(
    subject: RunOrchestrator,
    decoy: Decoy,
    runner: AnyRunner,
    command_intent: pe_commands.CommandIntent,
    input_protocol_config: Optional[Union[PythonProtocolConfig, JsonProtocolConfig]]
) -> None:
    """Should verify calls to set_command_queued."""
    command_to_queue = pe_commands.HomeCreate.construct(
        intent=command_intent, params=pe_commands.HomeParams.construct()
    )
    subject.build_orchestrator(protocol_config=input_protocol_config)
    subject.add_command(command_to_queue)

    decoy.verify(runner.set_command_queued(command_to_queue))

