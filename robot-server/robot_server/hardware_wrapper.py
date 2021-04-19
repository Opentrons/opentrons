"""Hardware interface wrapping module."""
import asyncio
import typing
from pathlib import Path

from notify_server.clients.publisher import Publisher
from opentrons import ThreadManager, initialize as initialize_api
from opentrons.hardware_control.simulator_setup import load_simulator
from opentrons.hardware_control.types import HardwareEvent, HardwareEventType
from opentrons.util.helpers import utc_now

from robot_server.main import log
from robot_server.settings import get_settings

from notify_server.models import event, topics
from notify_server.models.hardware_event import DoorStatePayload


class HardwareWrapper:
    """Wrapper to support initializing the Opentrons api hardware controller."""

    def __init__(self, event_publisher: Publisher) -> None:
        """Initialize a HardwareWrapper."""
        self._tm: typing.Optional[ThreadManager] = None
        self._hardware_event_watcher = None
        self._event_publisher = event_publisher

    async def initialize(self) -> ThreadManager:
        """Initialize the API."""
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

    async def init_event_watchers(self) -> None:
        """Register the publisher callbacks with the hw thread manager."""
        if self._tm is None:
            log.error("HW Thread Manager not initialized. "
                      "Cannot initialize robot event watchers.")
            return

        if self._hardware_event_watcher is None:
            log.info("Starting hardware-event-notify publisher")
            self._hardware_event_watcher = await self._tm.register_callback(
                self._publish_hardware_event)
        else:
            log.warning("Cannot start new hardware event watcher "
                        "when one already exists")

    def _publish_hardware_event(self, hw_event: HardwareEvent) -> None:
        if hw_event.event == HardwareEventType.DOOR_SWITCH_CHANGE:
            payload = DoorStatePayload(state=hw_event.new_state)
        else:
            return

        topic = topics.RobotEventTopics.HARDWARE_EVENTS
        publisher = self._publish_hardware_event.__qualname__
        self._event_publisher.send_nowait(
            topic,
            event.Event(
                createdOn=utc_now(),
                publisher=publisher,
                data=payload))

    def async_initialize(self) -> None:
        """Create task to initialize hardware."""
        asyncio.create_task(self.initialize())

    # TODO(mc, 2021-04-12): fix up typing
    def get_hardware(self):  # noqa: ANN201
        """Get the wrapped ThreadManager."""
        return self._tm
