from typing import Annotated
import fastapi
from robot_server.service.notifications import topics
from robot_server.service.notifications.notification_client import (
    NotificationClient,
    get_notification_client,
)


class DataFilePublisher:
    """Publishes dataFile topics."""

    def __init__(self, client: NotificationClient) -> None:
        self._client = client

    def publish_run_images(self, run_id: str) -> None:
        """Publish the equivalent of `GET /dataFiles/{runId}/images`."""
        self._client.publish_advise_refetch(
            topic=topics.TopicName(f"{topics.DATA_FILES}/{run_id}/images")
        )


async def get_data_file_publisher(
    notification_client: Annotated[
        NotificationClient, fastapi.Depends(get_notification_client)
    ],
) -> DataFilePublisher:
    """Return a DataFilePublisher for use by FastAPI endpoints."""
    return DataFilePublisher(notification_client)
