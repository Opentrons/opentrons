from .notification_client import (
    NotificationClient,
    get_notification_client,
    initialize_notification_client,
    clean_up_notification_client,
)

__all__ = [
    # main export
    "NotificationClient",
    # initialization and teardown
    "initialize_notification_client",
    "clean_up_notification_client",
    # for use by FastAPI
    "get_notification_client",
]
