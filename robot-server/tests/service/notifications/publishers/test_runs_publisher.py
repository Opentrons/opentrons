"""Tests for runs publisher."""
import pytest
from datetime import datetime
from unittest.mock import MagicMock, AsyncMock

from robot_server.service.notifications import RunsPublisher, Topics
from opentrons.protocol_engine import CurrentCommand, EngineStatus


def mock_curent_command(command_id: str) -> CurrentCommand:
    """Create a mock CurrentCommand."""
    return CurrentCommand(
        command_id=command_id,
        command_key="1",
        index=0,
        created_at=datetime(year=2021, month=1, day=1),
    )


@pytest.fixture
def notification_client() -> AsyncMock:
    """Mocked notification client."""
    return AsyncMock()


@pytest.fixture
def publisher_notifier() -> AsyncMock:
    """Mocked publisher notifier."""
    return AsyncMock()


@pytest.fixture
async def runs_publisher(
    notification_client: AsyncMock, publisher_notifier: AsyncMock
) -> RunsPublisher:
    """Instantiate RunsPublisher."""
    return RunsPublisher(
        client=notification_client, publisher_notifier=publisher_notifier
    )


@pytest.mark.asyncio
async def test_initialize(
    runs_publisher: RunsPublisher, notification_client: AsyncMock
) -> None:
    """It should initialize the runs_publisher with required parameters and callbacks."""
    run_id = "1234"
    get_current_command = AsyncMock()
    get_state_summary = AsyncMock()

    await runs_publisher.initialize(run_id, get_current_command, get_state_summary)

    assert runs_publisher._run_hooks
    assert runs_publisher._run_hooks.run_id == run_id
    assert runs_publisher._run_hooks.get_current_command == get_current_command
    assert runs_publisher._run_hooks.get_state_summary == get_state_summary
    assert runs_publisher._engine_state_slice
    assert runs_publisher._engine_state_slice.current_command is None
    assert runs_publisher._engine_state_slice.state_summary_status is None

    notification_client.publish_advise_refetch_async.assert_any_await(topic=Topics.RUNS)
    notification_client.publish_advise_refetch_async.assert_any_await(
        topic=f"{Topics.RUNS}/1234"
    )


@pytest.mark.asyncio
async def test_clean_up_current_run(
    runs_publisher: RunsPublisher, notification_client: AsyncMock
) -> None:
    """It should publish to appropriate topics at the end of a run."""
    await runs_publisher.initialize("1234", AsyncMock(), AsyncMock())

    await runs_publisher.clean_up_current_run()

    notification_client.publish_advise_refetch_async.assert_any_await(topic=Topics.RUNS)
    notification_client.publish_advise_refetch_async.assert_any_await(
        topic=f"{Topics.RUNS}/1234"
    )
    notification_client.publish_advise_unsubscribe_async.assert_any_await(
        topic=f"{Topics.RUNS}/1234"
    )


@pytest.mark.asyncio
async def test_handle_current_command_change(
    runs_publisher: RunsPublisher, notification_client: AsyncMock
) -> None:
    """It should handle command changes appropriately."""
    await runs_publisher.initialize(
        "1234", lambda _: mock_curent_command("command1"), AsyncMock()
    )

    assert runs_publisher._run_hooks
    assert runs_publisher._engine_state_slice

    runs_publisher._engine_state_slice.current_command = mock_curent_command("command1")

    await runs_publisher._handle_current_command_change()

    assert notification_client.publish_advise_refetch_async.call_count == 2

    runs_publisher._run_hooks.get_current_command = lambda _: mock_curent_command(
        "command2"
    )

    await runs_publisher._handle_current_command_change()

    notification_client.publish_advise_refetch_async.assert_any_await(
        topic=Topics.RUNS_CURRENT_COMMAND
    )


@pytest.mark.asyncio
async def test_handle_engine_status_change(
    runs_publisher: RunsPublisher, notification_client: AsyncMock
) -> None:
    """It should handle engine status changes appropriately."""
    await runs_publisher.initialize(
        "1234", lambda _: mock_curent_command("command1"), AsyncMock()
    )

    assert runs_publisher._run_hooks
    assert runs_publisher._engine_state_slice

    runs_publisher._run_hooks.run_id = "1234"
    runs_publisher._run_hooks.get_state_summary = MagicMock(
        return_value=MagicMock(status=EngineStatus.IDLE)
    )
    runs_publisher._engine_state_slice.state_summary_status = EngineStatus.IDLE

    await runs_publisher._handle_engine_status_change()

    assert notification_client.publish_advise_refetch_async.call_count == 2

    runs_publisher._run_hooks.get_state_summary.return_value = MagicMock(
        status=EngineStatus.RUNNING
    )

    await runs_publisher._handle_engine_status_change()

    notification_client.publish_advise_refetch_async.assert_any_await(topic=Topics.RUNS)
    notification_client.publish_advise_refetch_async.assert_any_await(
        topic=f"{Topics.RUNS}/1234"
    )
