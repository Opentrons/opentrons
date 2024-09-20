"""Notification service creation and management."""
from .notification_client import (
    NotificationClient,
    get_notification_client,
    set_up_notification_client,
)
from .publisher_notifier import (
    PublisherNotifier,
    get_pe_notify_publishers,
    initialize_pe_publisher_notifier,
)
from .publishers import (
    MaintenanceRunsPublisher,
    RunsPublisher,
    DeckConfigurationPublisher,
    get_maintenance_runs_publisher,
    get_runs_publisher,
    get_deck_configuration_publisher,
)

__all__ = [
    # main export
    "NotificationClient",
    # notification "route" equivalents
    "MaintenanceRunsPublisher",
    "RunsPublisher",
    "DeckConfigurationPublisher",
    # initialization and teardown
    "set_up_notification_client",
    "initialize_pe_publisher_notifier",
    # for use by FastAPI
    "get_notification_client",
    "get_pe_notify_publishers",
    "get_maintenance_runs_publisher",
    "get_runs_publisher",
    "get_deck_configuration_publisher",
    # for testing
    "PublisherNotifier",
]
