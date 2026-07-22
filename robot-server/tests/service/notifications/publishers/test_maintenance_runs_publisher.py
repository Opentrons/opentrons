"""Tests for the maintenance runs publisher."""

from unittest.mock import AsyncMock, Mock

import pytest

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


@pytest.mark.asyncio
async def test_stop_publishing_disarms_hooks(
    notification_client: Mock,
    maintenance_runs_publisher: MaintenanceRunsPublisher,
) -> None:
    """Stopping publishing should clear hooks and advise a current-run refetch."""
    get_state_summary = Mock()

    await maintenance_runs_publisher.start_publishing_for_maintenance_run(
        run_id="run-id",
        get_state_summary=get_state_summary,
    )
    assert maintenance_runs_publisher._run_hooks is not None

    notification_client.publish_advise_refetch.reset_mock()
    maintenance_runs_publisher.stop_publishing_for_maintenance_run()

    assert maintenance_runs_publisher._run_hooks is None
    assert maintenance_runs_publisher._engine_state_slice is None
    notification_client.publish_advise_refetch.assert_called_once_with(
        topic=topics.MAINTENANCE_RUNS_CURRENT_RUN
    )

    await maintenance_runs_publisher._handle_engine_status_change()
    get_state_summary.assert_not_called()
