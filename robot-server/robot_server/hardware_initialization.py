"""Utilities for initializing the hardware interface."""


import logging
from pathlib import Path

from opentrons import ThreadManager, initialize as initialize_api
from opentrons.hardware_control.simulator_setup import load_simulator
from opentrons.hardware_control.types import HardwareEvent, HardwareEventType
from opentrons.util.helpers import utc_now

from notify_server.clients.publisher import Publisher
from notify_server.models import event, topics
from notify_server.models.hardware_event import DoorStatePayload

from .settings import get_settings


log = logging.getLogger(__name__)


async def initialize(event_publisher: Publisher) -> ThreadManager:
    """Initialize the API."""
    # todo(mm, 2021-08-12): It would be easier for tests to check that this function
    # can successfully initialize simulating hardware if app_settings were passed in
    # as an argument, instead of being fetched here.
    app_settings = get_settings()
    thread_manager: ThreadManager
    if app_settings.simulator_configuration_file_path:
        log.info(
            f"Loading simulator from "
            f"{app_settings.simulator_configuration_file_path}"
        )
        # A path to a simulation configuration is defined. Let's use it.
        thread_manager = ThreadManager(
            load_simulator, Path(app_settings.simulator_configuration_file_path)
        )
    else:
        # Create the hardware
        thread_manager = await initialize_api()

    log.info("Starting hardware-event-notify publisher")
    door_event_forwarder = DoorEventForwarder(event_publisher)
    # fixme(mm, 2021-08-12): This might be a typing error. forward() can only
    # take a HardwareEvent, but it looks like ThreadManager can also pass
    # other things as the argument to a callback?
    thread_manager.register_callback(door_event_forwarder.forward)

    log.info("Opentrons API initialized")
    return thread_manager


class DoorEventForwarder:
    """Forwards front door open/close events to a notify-server publisher."""

    def __init__(self, publisher: Publisher) -> None:
        """Initialize the `DoorEventForwarder`.

        Params:

            publisher: Where subsequent calls to `forward_hardware_event` will forward
                to.
        """
        self.publisher = publisher

    def forward(self, hardware_event: HardwareEvent) -> None:
        """Forward `hardware_event` if it's a door event.

        Otherwise, no-op.
        """
        print("Called with", hardware_event)
        if hardware_event.event == HardwareEventType.DOOR_SWITCH_CHANGE:
            payload = DoorStatePayload(state=hardware_event.new_state)
        else:
            print("Returning early.")
            return
        print("Payload will be", payload)
        topic = topics.RobotEventTopics.HARDWARE_EVENTS
        publisher = "robot_server_event_publisher"
        event_to_publish = event.Event(
            createdOn=utc_now(), publisher=publisher, data=payload
        )
        print("Event to publish will be", event_to_publish)
        self.publisher.send_nowait(topic, event_to_publish)


__all__ = ["initialize", "DoorEventForwarder"]
