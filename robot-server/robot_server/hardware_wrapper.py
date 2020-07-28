import asyncio
import typing
from pathlib import Path

from opentrons import ThreadManager, initialize as initialize_api
from opentrons.hardware_control.simulator_setup import load_simulator

from robot_server.main import log
from robot_server.settings import get_settings


class HardwareWrapper:
    """Wrapper to support initializing the opentrons api hardware
    controller"""

    def __init__(self):
        self._tm: typing.Optional[ThreadManager] = None

    async def initialize(self) -> ThreadManager:
        """Initialize the API"""
        app_settings = get_settings()
        if app_settings.simulator_configuration_file_path:
            log.info(f"Loading simulator from "
                     f"{app_settings.simulator_configuration_file_path}")
            # A path to a simulation configuration is defined. Let's use it.
            self._tm = ThreadManager(
                load_simulator,
                Path(app_settings.simulator_configuration_file_path))
        else:
            # Create the hardware
            self._tm = await initialize_api(
                hardware_server=app_settings.hardware_server_enable,
                hardware_server_socket=app_settings.hardware_server_socket_path
            )
        log.info("Opentrons API initialized")
        return self._tm

    def async_initialize(self):
        """Create task to initialize hardware."""
        asyncio.create_task(self.initialize())

    def get_hardware(self):
        return self._tm
