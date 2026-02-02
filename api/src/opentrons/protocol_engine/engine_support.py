"""Support for create_protocol_engine module."""

from ..hardware_control import HardwareControlAPI
from . import ProtocolEngine
from opentrons.protocol_engine.resources.camera_provider import CameraProvider
from opentrons.protocol_runner import RunOrchestrator, protocol_runner


def create_run_orchestrator(
    hardware_api: HardwareControlAPI,
    protocol_engine: ProtocolEngine,
    camera_provider: CameraProvider,
) -> RunOrchestrator:
    """Create a RunOrchestrator instance."""
    return RunOrchestrator(
        protocol_engine=protocol_engine,
        hardware_api=hardware_api,
        camera_provider=camera_provider,
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
