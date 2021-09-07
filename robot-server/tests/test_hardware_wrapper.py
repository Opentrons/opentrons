import pytest
from mock import AsyncMock, patch  # type: ignore[attr-defined]
from datetime import datetime, timezone

from notify_server.models.hardware_event import DoorStatePayload
from opentrons.hardware_control.types import (
    HardwareEventType,
    DoorStateNotification,
    DoorState,
)
from notify_server.models.event import Event
from robot_server import hardware_wrapper
from robot_server.settings import RobotServerSettings
from robot_server.service import dependencies


@pytest.fixture
def mock_time():
    return datetime(2020, 8, 14, 21, 44, 16, tzinfo=timezone.utc)


@pytest.fixture
def mock_utc(mock_time):
    with patch.object(hardware_wrapper, "utc_now", return_value=mock_time) as _mock:
        yield _mock


@pytest.fixture
def mock_event_publisher():
    return AsyncMock(spec=dependencies.publisher.Publisher)


@pytest.fixture
def simulating_wrapper(mock_event_publisher):
    with patch.object(
        hardware_wrapper,
        "get_settings",
        return_value=RobotServerSettings(
            simulator_configuration_file_path="simulators" "/test.json"
        ),
    ):
        return hardware_wrapper.HardwareWrapper(event_publisher=mock_event_publisher)


async def test_init_hw_event(simulating_wrapper):
    """Verify that hardware event publisher is initialized correctly.

    Test that init starts an _event_watcher.
    """
    simulating_wrapper._tm = AsyncMock()
    await simulating_wrapper.init_event_watchers()
    simulating_wrapper._tm.register_callback.assert_awaited_once_with(
        simulating_wrapper._publish_hardware_event
    )
    simulating_wrapper._tm.reset_mock()


async def test_door_event(
    simulating_wrapper, mock_utc, mock_time, mock_event_publisher
):
    """Verify that a door event is published on hw event."""

    hw_event = DoorStateNotification(
        event=HardwareEventType.DOOR_SWITCH_CHANGE, new_state=DoorState.OPEN
    )
    pub_event = Event(
        createdOn=mock_time,
        publisher="HardwareWrapper._publish_hardware_event",
        data=DoorStatePayload(state=DoorState.OPEN),
    )
    simulating_wrapper._publish_hardware_event(hw_event)
    mock_event_publisher.send_nowait.assert_called_once_with(
        "hardware_events", pub_event
    )
