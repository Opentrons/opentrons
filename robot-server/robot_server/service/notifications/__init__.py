"""Notification service creation and management."""
from .initialize_notifications import initialize_notifications

from .notification_client import (
    NotificationClient,
    get_notification_client,
    clean_up_notification_client,
)
from .publisher_notifier import PublisherNotifier, get_pe_notify_publishers
from .publishers import (
    MaintenanceRunsPublisher,
    RunsPublisher,
    DeckConfigurationPublisher,
    get_maintenance_runs_publisher,
    get_runs_publisher,
    get_deck_configuration_publisher,
)
from .topics import Topics

__all__ = [
    # main export
    "NotificationClient",
    # notification "route" equivalents
    "MaintenanceRunsPublisher",
    "RunsPublisher",
    "DeckConfigurationPublisher",
    # initialization and teardown
    "initialize_notifications",
    "clean_up_notification_client",
    # for use by FastAPI
    "get_notification_client",
    "get_pe_notify_publishers",
    "get_maintenance_runs_publisher",
    "get_runs_publisher",
    "get_deck_configuration_publisher",
    # for testing
    "PublisherNotifier",
    "Topics",
]
