"""Notification service creation and management."""
from .initialize_notifications import (
    initialize_publisher_notifiers,
    init_hardware_publishers,
)

from .notification_client import (
    NotificationClient,
    get_notification_client,
    clean_up_notification_client,
)
from .publisher_notifier import (
    PublisherNotifier,
    get_pe_notify_publishers,
    get_hardware_notify_publishers,
)
from .publishers import (
    MaintenanceRunsPublisher,
    RunsPublisher,
    get_maintenance_runs_publisher,
    get_runs_publisher,
)
from .topics import Topics

__all__ = [
    # main export
    "NotificationClient",
    # notification "route" equivalents
    "MaintenanceRunsPublisher",
    "RunsPublisher",
    # initialization and teardown
    "initialize_publisher_notifiers",
    "init_hardware_publishers",
    "clean_up_notification_client",
    # for use by FastAPI
    "get_notification_client",
    "get_pe_notify_publishers",
    "get_hardware_notify_publishers",
    "get_maintenance_runs_publisher",
    "get_runs_publisher",
    # for testing
    "PublisherNotifier",
    "ChangeNotifier",
    "Topics",
]
