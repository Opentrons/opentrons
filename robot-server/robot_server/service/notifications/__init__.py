"""Notification service creation and management."""
from .initialize_notifications import initialize_notifications

from .notification_client import (
    NotificationClient,
    get_notification_client,
    clean_up_notification_client,
)
from .publisher_notifier import PublisherNotifier, get_notify_publishers
from .publishers import (
    MaintenanceRunsPublisher,
    RunsPublisher,
    get_maintenance_runs_publisher,
    get_runs_publisher,
)
from .change_notifier import ChangeNotifier
from .topics import Topics

__all__ = [
    # main export
    "NotificationClient",
    # notification "route" equivalents
    "MaintenanceRunsPublisher",
    "RunsPublisher",
    # initialization and teardown
    "initialize_notifications",
    "clean_up_notification_client",
    # for use by FastAPI
    "get_notification_client",
    "get_notify_publishers",
    "get_maintenance_runs_publisher",
    "get_runs_publisher",
    # for testing
    "PublisherNotifier",
    "ChangeNotifier",
    "Topics",
]
