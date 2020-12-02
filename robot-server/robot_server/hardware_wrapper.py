import asyncio
import typing
import enum
from pathlib import Path

from opentrons import ThreadManager, initialize as initialize_api
from opentrons.hardware_control.simulator_setup import load_simulator
from opentrons.hardware_control.types import (HardwareEventType, HardwareEvent)
from opentrons.util.helpers import utc_now
from robot_server.main import log
from robot_server.settings import get_settings

from notify_server.models.event import Event
from notify_server.models.payload_type import DoorSwitchEventType


class RobotEventTopics(enum.Enum):
    DOOR_EVENT = "hardware.door_event"

    def __str__(self):
        return self.value


class HardwareWrapper:
    """Wrapper to support initializing the opentrons api hardware
    controller"""

    def __init__(self):
        self._tm: typing.Optional[ThreadManager] = None
        self._door_event_watcher = None

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
        await self.init_event_watchers()
        log.info("Opentrons API initialized")
        return self._tm

    async def init_event_watchers(self):
        """
        Register the publisher callbacks with the hw thread manager.
        """
        if self._tm is None:
            log.error("HW Thread Manager not initialized. "
                      "Cannot initialize robot event watchers.")
            return

        if self._door_event_watcher is None:
            log.info("Starting door-switch-notify publisher")
            self._door_event_watcher = await self._tm.register_callback(
                self._publish_door_event)
        else:
            log.warning("Cannot start new hardware event watcher "
                        "when one already exists")

    def _publish_door_event(self, hw_event: HardwareEvent):
        if hw_event.event == HardwareEventType.DOOR_SWITCH_CHANGE:
            self._publish_event(topic=str(RobotEventTopics.DOOR_EVENT),
                                publisher=self._publish_door_event,
                                data=DoorSwitchEventType(
                                    new_state=hw_event.new_state))

    def _publish_event(self, topic, publisher, data):
        from robot_server.service.dependencies import get_event_publisher
        event_publisher = get_event_publisher()
        if event_publisher:
            event_publisher.send_nowait(topic,
                                        Event(createdOn=utc_now(),
                                              publisher=publisher.__qualname__,
                                              data=data))

    def async_initialize(self):
        """Create task to initialize hardware."""
        asyncio.create_task(self.initialize())

    def get_hardware(self):
        return self._tm
