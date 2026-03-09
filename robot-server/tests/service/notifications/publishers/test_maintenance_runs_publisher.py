"""Tests for the maintenance runs publisher."""
import pytest
from unittest.mock import AsyncMock, Mock

from robot_server.service.notifications import MaintenanceRunsPublisher, topics
from robot_server.service.notifications.notification_client import NotificationClient
from robot_server.service.notifications.publisher_notifier import PublisherNotifier


@pytest.fixture
def notification_client() -> Mock:
    """Mocked notification client."""
    return Mock(spec_set=NotificationClient)


@pytest.fixture
def publisher_notifier() -> Mock:
    """Mocked publisher notifier."""
    return Mock(spec_set=PublisherNotifier)


@pytest.fixture
def maintenance_runs_publisher(
    notification_client: Mock, publisher_notifier: Mock
) -> MaintenanceRunsPublisher:
    """Instantiate MaintenanceRunsPublisher."""
    return MaintenanceRunsPublisher(notification_client, publisher_notifier)


@pytest.mark.asyncio
async def test_publish_current_maintenance_run(
    notification_client: AsyncMock, maintenance_runs_publisher: MaintenanceRunsPublisher
) -> None:
    """It should publish a notify flag for maintenance runs."""
    maintenance_runs_publisher.publish_current_maintenance_run()
    notification_client.publish_advise_refetch.assert_called_once_with(
        topic=topics.MAINTENANCE_RUNS_CURRENT_RUN
    )
