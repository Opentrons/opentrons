"""Tests for the maintenance runs publisher."""
import pytest
from decoy import Decoy

from robot_server.service.notifications import MaintenanceRunsPublisher, topics
from robot_server.service.notifications.notification_client import NotificationClient


@pytest.fixture
def notification_client(decoy: Decoy) -> NotificationClient:
    """Mocked notification client."""
    return decoy.mock(cls=NotificationClient)


@pytest.fixture
def maintenance_runs_publisher(
    notification_client: NotificationClient,
) -> MaintenanceRunsPublisher:
    """Instantiate MaintenanceRunsPublisher."""
    return MaintenanceRunsPublisher(notification_client)


def test_publish_current_maintenance_run(
    notification_client: NotificationClient,
    maintenance_runs_publisher: MaintenanceRunsPublisher,
    decoy: Decoy,
) -> None:
    """It should publish a notify flag for maintenance runs."""
    maintenance_runs_publisher.publish_current_maintenance_run()
    decoy.verify(
        notification_client.publish_advise_refetch(topics.MAINTENANCE_RUNS_CURRENT_RUN)
    )
