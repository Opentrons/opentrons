"""Utilities for initializing the notification service."""
from server_utils.fastapi_utils.app_state import AppState

from .notification_client import initialize_notification_client
from .publisher_notifier import initialize_publisher_notifier


async def initialize_notifications(app_state: AppState) -> None:
    """Initialize the notification system for the given app state."""
    initialize_notification_client(app_state)
    await initialize_publisher_notifier(app_state)
