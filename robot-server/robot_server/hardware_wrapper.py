import asyncio
import typing
from pathlib import Path

from opentrons import ThreadManager, initialize as initialize_api
from opentrons.hardware_control.simulator_setup import load_simulator
from opentrons.hardware_control.types import (HardwareEventType, HardwareEvent)
from opentrons.util.helpers import utc_now
from robot_server.main import log
from robot_server.settings import get_settings
from notify_server.clients import publisher
from notify_server.models.event import Event
from notify_server.models.payload_type import DoorSwitchEventType
from notify_server.settings import Settings as NotifyServerSettings


class HardwareWrapper:
    """Wrapper to support initializing the opentrons api hardware
    controller"""

    def __init__(self):
        self._tm: typing.Optional[ThreadManager] = None
        self._event_watcher = None
        self._event_publisher = None

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
        await self.init_door_event_publisher()
        log.info("Opentrons API initialized")
        return self._tm

    async def init_door_event_publisher(self):
        """
        Create a notify-server publisher for safety door state,
        publish the initial state, & register the publisher callback with
        the hw thread manager.
        """
        if self._tm is None:
            log.warning("HW Thread Manager not initialized")
            return
        settings = NotifyServerSettings()
        if self._event_watcher is None:
            log.info("Starting door-switch-notify publisher")
            self._event_publisher = publisher.create(
                settings.publisher_address.connection_string()
            )
            self._event_watcher = await self._tm.register_callback(
                self._publish_door_event)
        else:
            log.warning("Cannot start new hardware event watcher "
                        "when one already exists")

    def _publish_door_event(self, hw_event: HardwareEvent):
        if self._event_publisher and \
                hw_event.event == HardwareEventType.DOOR_SWITCH_CHANGE:
            self._event_publisher.send_nowait("hardware.door_event", Event(
                createdOn=utc_now(),
                publisher=self._publish_door_event.__qualname__,
                data=DoorSwitchEventType(new_state=hw_event.new_state)
            ))

    def async_initialize(self):
        """Create task to initialize hardware."""
        asyncio.create_task(self.initialize())

    def get_hardware(self):
        return self._tm
