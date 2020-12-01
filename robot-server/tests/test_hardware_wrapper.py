import pytest
from mock import AsyncMock, patch

from notify_server.models.event import Event
from notify_server.models.payload_type import DoorSwitchEventType
from robot_server import hardware_wrapper
from opentrons.hardware_control.types import (
    HardwareEventType, DoorStateNotification, DoorState)
from robot_server.settings import RobotServerSettings
from robot_server.service import dependencies
from datetime import datetime, timezone


@pytest.fixture
def mock_time():
    return datetime(2020, 8, 14, 21, 44, 16, tzinfo=timezone.utc)


@pytest.fixture
def mock_utc(mock_time):
    with patch.object(hardware_wrapper, 'utc_now',
                      return_value=mock_time) as _mock:
        yield _mock


@pytest.fixture
def simulating_wrapper():
    with patch.object(hardware_wrapper, 'get_settings',
                      return_value=RobotServerSettings(
                          simulator_configuration_file_path='simulators'
                                                            '/test.json')):
        return hardware_wrapper.HardwareWrapper()


async def test_init_door_event(simulating_wrapper):
    """ Verify that door event publisher is initialized correctly.

        Test that init starts an _event_watcher.
     """
    simulating_wrapper._tm = AsyncMock()
    await simulating_wrapper.init_event_watchers()
    simulating_wrapper._tm.register_callback.assert_awaited_once_with(
        simulating_wrapper._publish_door_event
    )
    simulating_wrapper._tm.reset_mock()


async def test_door_event(simulating_wrapper, mock_utc, mock_time):
    """ Verify that a door event is published on hw event. """

    hw_event = DoorStateNotification(
        event=HardwareEventType.DOOR_SWITCH_CHANGE,
        new_state=DoorState.CLOSED)
    pub_event = Event(createdOn=mock_time,
                      publisher='HardwareWrapper._publish_door_event',
                      data=DoorSwitchEventType(new_state=hw_event.new_state))
    with patch.object(dependencies, 'get_event_publisher') as pub:
        simulating_wrapper._publish_door_event(hw_event)
        pub().send_nowait.assert_called_once_with('hardware.door_event',
                                                  pub_event)
