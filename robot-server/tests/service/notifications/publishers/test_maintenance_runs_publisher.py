"""Tests for the maintenance runs publisher."""
import pytest
from unittest.mock import AsyncMock

from robot_server.service.notifications import MaintenanceRunsPublisher, Topics


@pytest.fixture
def notification_client() -> AsyncMock:
    """Mocked notification client."""
    return AsyncMock()


@pytest.fixture
def maintenance_runs_publisher(
    notification_client: AsyncMock,
) -> MaintenanceRunsPublisher:
    """Instantiate MaintenanceRunsPublisher."""
    return MaintenanceRunsPublisher(notification_client)


@pytest.mark.asyncio
async def test_publish_current_maintenance_run(
    notification_client: AsyncMock, maintenance_runs_publisher: MaintenanceRunsPublisher
) -> None:
    """It should publish a notify flag for maintenance runs."""
    await maintenance_runs_publisher.publish_current_maintenance_run()
    notification_client.publish_advise_refetch_async.assert_awaited_once_with(
        topic=Topics.MAINTENANCE_RUNS_CURRENT_RUN
    )
