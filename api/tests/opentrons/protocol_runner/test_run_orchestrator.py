@pytest.fixture
def mock_protocol_json_runner(decoy: Decoy) -> JsonRunner:
    """Get a mocked out JsonRunner dependency."""
    return decoy.mock(cls=JsonRunner)


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
from opentrons.protocol_runner.protocol_runner import (
    JsonRunner,
    PythonAndLegacyRunner,
    LiveRunner,
    AnyRunner,
)


# @pytest.fixture
# def mock_protocol_python_runner(decoy: Decoy) -> PythonAndLegacyRunner:
#     """Get a mocked out PythonAndLegacyRunner dependency."""
#     return decoy.mock(cls=PythonAndLegacyRunner)
#
#
# @pytest.fixture
# def mock_protocol_live_runner(decoy: Decoy) -> LiveRunner:
#     """Get a mocked out LiveRunner dependency."""
#     return decoy.mock(cls=LiveRunner)
#
#
# @pytest.fixture
# def mock_protocol_engine(decoy: Decoy) -> ProtocolEngine:
#     """Get a mocked out ProtocolEngine dependency."""
#     return decoy.mock(cls=ProtocolEngine)
#
#
# @pytest.fixture
# def mock_hardware_api(decoy: Decoy) -> HardwareAPI:
#     """Get a mocked out HardwareAPI dependency."""
#     return decoy.mock(cls=HardwareAPI)
#
#
# @pytest.fixture
# def config() -> JsonProtocolConfig:
#     """Get an API version to apply to the interface."""
#     return JsonProtocolConfig(schema_version=7)
#
#
# @pytest.fixture
# @pytest.mark.parametrize(
#     "config",
#     [
#         (JsonProtocolConfig(schema_version=7)),
#         (PythonProtocolConfig(api_version=APIVersion(2, 14))),
#         (None),
#     ],
# )
# def subject(
#     config: Optional[Union[PythonProtocolConfig, JsonProtocolConfig]],
#     mock_hardware_api: HardwareAPI,
#     mock_protocol_engine: ProtocolEngine,
# ) -> RunOrchestrator:
#     """Get a RunOrchestrator subject."""
#     return RunOrchestrator(
#         protocol_engine=mock_protocol_engine,
#         hardware_api=mock_hardware_api,
#         protocol_config=JsonProtocolConfig(schema_version=7),  # config,
#     )
#
#
# @pytest.mark.parametrize(
#     "runner, command_intent",
#     [
#         (
#             lazy_fixture("mock_live_runner"),
#             pe_commands.CommandIntent.SETUP,
#         ),
#         (
#             lazy_fixture("mock_live_runner"),
#             pe_commands.CommandIntent.FIXIT,
#         ),
#         (
#             lazy_fixture("mock_protocol_json_runner"),
#             pe_commands.CommandIntent.PROTOCOL,
#         ),
#         (
#             lazy_fixture("mock_protocol_python_runner"),
#             pe_commands.CommandIntent.PROTOCOL,
#         ),
#     ],
# )
# def test_add_command(
#     subject: RunOrchestrator,
#     decoy: Decoy,
#     runner: AnyRunner,
#     command_intent: pe_commands.CommandIntent,
# ) -> None:
#     """Should verify calls to set_command_queued."""
#     command_to_queue = pe_commands.HomeCreate.construct(
#         intent=command_intent, params=pe_commands.HomeParams.construct()
#     )
#     subject.add_command(command_to_queue)
#
#     decoy.verify(subject._protocol_runner.set_command_queued(command_to_queue))
#
#
# def test_add_json_command(
#     subject: RunOrchestrator,
#     decoy: Decoy,
#     mock_protocol_json_runner: AnyRunner,
# ) -> None:
#     """Should verify calls to set_command_queued."""
#     command_to_queue = pe_commands.HomeCreate.construct(
#         intent=CommandIntent.PROTOCOL, params=pe_commands.HomeParams.construct()
#     )
#     subject.add_command(command_to_queue)
#
#     # change this to a get method
#     assert subject._protocol_runner._queued_protocol_commands == [command_to_queue]
