from typing import Annotated
import fastapi
from robot_server.service.notifications import topics
from robot_server.service.notifications.notification_client import (
    NotificationClient,
    get_notification_client,
)


class ClientDataPublisher:
    """Publishes clientData topics."""

    def __init__(self, client: NotificationClient) -> None:
        self._client = client

    def publish_client_data(self, client_data_key: str) -> None:
        """Publish the equivalent of `GET /clientData/{key}`."""
        self._client.publish_advise_refetch(topics.client_data(client_data_key))


async def get_client_data_publisher(
    notification_client: Annotated[
        NotificationClient, fastapi.Depends(get_notification_client)
    ],
) -> ClientDataPublisher:
    """Return a ClientDataPublisher for use by FastAPI endpoints."""
    return ClientDataPublisher(notification_client)
