"""Tests for runs publisher."""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, Mock

from opentrons.protocol_engine import CommandPointer, EngineStatus

from robot_server.service.notifications import RunsPublisher, Topics
from robot_server.service.notifications.notification_client import NotificationClient
from robot_server.service.notifications.publisher_notifier import PublisherNotifier


def make_command_pointer(command_id: str) -> CommandPointer:
    """Create a dummy CommandPointer."""
    return CommandPointer(
        command_id=command_id,
        command_key="1",
        index=0,
        created_at=datetime(year=2021, month=1, day=1),
    )


@pytest.fixture
def notification_client() -> Mock:
    """Mocked notification client."""
    return Mock(spec_set=NotificationClient)


@pytest.fixture
def publisher_notifier() -> Mock:
    """Mocked publisher notifier."""
    return Mock(spec_set=PublisherNotifier)


@pytest.fixture
async def runs_publisher(
    notification_client: Mock, publisher_notifier: Mock
) -> RunsPublisher:
    """Instantiate RunsPublisher."""
    return RunsPublisher(
        client=notification_client, publisher_notifier=publisher_notifier
    )


async def test_initialize(
    runs_publisher: RunsPublisher, notification_client: Mock
) -> None:
    """It should initialize the runs_publisher with required parameters and callbacks."""
    run_id = "1234"
    get_current_command = AsyncMock()
    get_recovery_target_command = AsyncMock()
    get_state_summary = AsyncMock()

    await runs_publisher.start_publishing_for_run(
        run_id, get_current_command, get_recovery_target_command, get_state_summary
    )

    # todo(mm, 2024-05-21): We should test through the public interface of the subject,
    # not through its private attributes.
    assert runs_publisher._run_hooks
    assert runs_publisher._run_hooks.run_id == run_id
    assert runs_publisher._run_hooks.get_current_command == get_current_command
    assert (
        runs_publisher._run_hooks.get_recovery_target_command
        == get_recovery_target_command
    )
    assert runs_publisher._run_hooks.get_state_summary == get_state_summary
    assert runs_publisher._engine_state_slice
    assert runs_publisher._engine_state_slice.current_command is None
    assert runs_publisher._engine_state_slice.recovery_target_command is None
    assert runs_publisher._engine_state_slice.state_summary_status is None

    notification_client.publish_advise_refetch_async.assert_any_await(topic=Topics.RUNS)
    notification_client.publish_advise_refetch_async.assert_any_await(
        topic=f"{Topics.RUNS}/1234"
    )


async def test_clean_up_current_run(
    runs_publisher: RunsPublisher, notification_client: Mock
) -> None:
    """It should publish to appropriate topics at the end of a run."""
    await runs_publisher.start_publishing_for_run(
        "1234", AsyncMock(), AsyncMock(), AsyncMock()
    )

    await runs_publisher.clean_up_run(run_id="1234")

    notification_client.publish_advise_refetch_async.assert_any_await(topic=Topics.RUNS)
    notification_client.publish_advise_refetch_async.assert_any_await(
        topic=f"{Topics.RUNS}/1234"
    )
    notification_client.publish_advise_unsubscribe_async.assert_any_await(
        topic=f"{Topics.RUNS}/1234"
    )
    notification_client.publish_advise_unsubscribe_async.assert_any_await(
        topic=Topics.RUNS_COMMANDS_LINKS
    )
    notification_client.publish_advise_unsubscribe_async.assert_any_await(
        topic=f"{Topics.RUNS_PRE_SERIALIZED_COMMANDS}/1234"
    )


async def test_handle_current_command_change(
    runs_publisher: RunsPublisher, notification_client: Mock
) -> None:
    """It should handle command changes appropriately."""
    await runs_publisher.start_publishing_for_run(
        run_id="1234",
        get_current_command=lambda _: make_command_pointer("command1"),
        get_recovery_target_command=AsyncMock(),
        get_state_summary=AsyncMock(),
    )

    # todo(mm, 2024-05-21): We should test through the public interface of the subject,
    # not through its private attributes.
    assert runs_publisher._run_hooks
    assert runs_publisher._engine_state_slice

    runs_publisher._engine_state_slice.current_command = make_command_pointer(
        "command1"
    )

    await runs_publisher._handle_current_command_change()

    assert notification_client.publish_advise_refetch_async.call_count == 2

    runs_publisher._run_hooks.get_current_command = lambda _: make_command_pointer(
        "command2"
    )

    await runs_publisher._handle_current_command_change()

    notification_client.publish_advise_refetch_async.assert_any_await(
        topic=Topics.RUNS_COMMANDS_LINKS
    )


async def test_handle_recovery_target_command_change(
    runs_publisher: RunsPublisher, notification_client: Mock
) -> None:
    """It should handle command changes appropriately."""
    await runs_publisher.start_publishing_for_run(
        run_id="1234",
        get_current_command=AsyncMock(),
        get_recovery_target_command=lambda _: make_command_pointer("command1"),
        get_state_summary=AsyncMock(),
    )

    # todo(mm, 2024-05-21): We should test through the public interface of the subject,
    # not through its private attributes.
    assert runs_publisher._run_hooks
    assert runs_publisher._engine_state_slice

    runs_publisher._engine_state_slice.recovery_target_command = make_command_pointer(
        "command1"
    )

    await runs_publisher._handle_recovery_target_command_change()

    assert notification_client.publish_advise_refetch_async.call_count == 2

    runs_publisher._run_hooks.get_recovery_target_command = (
        lambda _: make_command_pointer("command2")
    )

    await runs_publisher._handle_recovery_target_command_change()

    notification_client.publish_advise_refetch_async.assert_any_await(
        topic=Topics.RUNS_COMMANDS_LINKS
    )


async def test_handle_engine_status_change(
    runs_publisher: RunsPublisher, notification_client: Mock
) -> None:
    """It should handle engine status changes appropriately."""
    await runs_publisher.start_publishing_for_run(
        run_id="1234",
        get_current_command=lambda _: make_command_pointer("command1"),
        get_recovery_target_command=AsyncMock(),
        get_state_summary=AsyncMock(),
    )

    # todo(mm, 2024-05-21): We should test through the public interface of the subject,
    # not through its private attributes.
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


async def test_publish_pre_serialized_commannds_notif(
    runs_publisher: RunsPublisher, notification_client: Mock
) -> None:
    """It should send out a notification for pre serialized commands."""
    await runs_publisher.start_publishing_for_run(
        run_id="1234",
        get_current_command=lambda _: make_command_pointer("command1"),
        get_recovery_target_command=AsyncMock(),
        get_state_summary=AsyncMock(),
    )

    # todo(mm, 2024-05-21): We should test through the public interface of the subject,
    # not through its private attributes.
    assert runs_publisher._run_hooks
    assert runs_publisher._engine_state_slice
    assert notification_client.publish_advise_refetch_async.call_count == 2

    await runs_publisher.publish_pre_serialized_commands_notification(run_id="1234")

    assert notification_client.publish_advise_refetch_async.call_count == 3

    notification_client.publish_advise_refetch_async.assert_any_await(
        topic=f"{Topics.RUNS_PRE_SERIALIZED_COMMANDS}/1234"
    )
