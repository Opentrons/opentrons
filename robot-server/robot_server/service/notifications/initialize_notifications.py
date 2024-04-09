"""Utilities for initializing the notification service."""
from opentrons.hardware_control import HardwareControlAPI

from server_utils.fastapi_utils.app_state import AppState

from .notification_client import initialize_notification_client, get_notification_client
from .publisher_notifier import (
    initialize_pe_publisher_notifier,
    initialize_hardware_publisher_notifier,
    get_hardware_publisher_notifier,
)
from .publishers import initialize_robot_publisher


def initialize_publisher_notifiers(app_state: AppState) -> None:
    """Initialize the notification system notifiers."""
    initialize_notification_client(app_state)
    initialize_pe_publisher_notifier(app_state)
    initialize_hardware_publisher_notifier(app_state)


async def init_hardware_publishers(
    app_state: AppState, hardware: HardwareControlAPI
) -> None:
    """Initialize the notification system publishers that require hardware."""
    notification_client = get_notification_client(app_state)
    hardware_publisher_notifier = get_hardware_publisher_notifier(app_state)

    await initialize_robot_publisher(
        app_state=app_state,
        hardware=hardware,
        notification_client=notification_client,
        publisher_notifier=hardware_publisher_notifier,
    )
