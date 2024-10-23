"""Support for create_protocol_engine module."""
from . import ProtocolEngine
from ..hardware_control import HardwareControlAPI

from opentrons.protocol_runner import protocol_runner, RunOrchestrator


def create_run_orchestrator(
    hardware_api: HardwareControlAPI,
    protocol_engine: ProtocolEngine,
) -> RunOrchestrator:
    """Create a RunOrchestrator instance."""
    return RunOrchestrator(
        protocol_engine=protocol_engine,
        hardware_api=hardware_api,
        setup_runner=protocol_runner.LiveRunner(
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
        ),
        fixit_runner=protocol_runner.LiveRunner(
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
        ),
        protocol_live_runner=protocol_runner.LiveRunner(
            protocol_engine=protocol_engine,
            hardware_api=hardware_api,
        ),
    )
