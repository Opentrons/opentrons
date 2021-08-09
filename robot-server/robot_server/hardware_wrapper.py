"""Utilities for initializing the hardware interface."""


import logging
from functools import partial
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
    await _init_event_watchers(thread_manager, event_publisher)
    log.info("Opentrons API initialized")
    return thread_manager


async def _init_event_watchers(
    thread_manager: ThreadManager,
    event_publisher: Publisher,
) -> None:
    """Register the publisher callbacks with the hw thread manager."""
    log.info("Starting hardware-event-notify publisher")
    thread_manager.register_callback(partial(_publish_hardware_event, event_publisher))


def _publish_hardware_event(
    event_publisher: Publisher, hw_event: HardwareEvent
) -> None:
    if hw_event.event == HardwareEventType.DOOR_SWITCH_CHANGE:
        payload = DoorStatePayload(state=hw_event.new_state)
    else:
        return

    topic = topics.RobotEventTopics.HARDWARE_EVENTS
    publisher = "robot_server_event_publisher"
    event_publisher.send_nowait(
        topic, event.Event(createdOn=utc_now(), publisher=publisher, data=payload)
    )
