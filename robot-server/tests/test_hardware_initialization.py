# noqa: D100


from datetime import datetime, timezone
from typing import Any, Generator
from unittest.mock import patch

from decoy import Decoy
import pytest

from notify_server.clients.publisher import Publisher
from notify_server.models.event import Event
from notify_server.models.hardware_event import DoorStatePayload
from opentrons.hardware_control.types import (
    HardwareEventType,
    DoorStateNotification,
    DoorState,
)

from opentrons import ThreadManager

from robot_server import hardware_initialization
from robot_server.settings import RobotServerSettings


@pytest.fixture
def fake_now() -> datetime:
    """Return the timestamp used by `override_utc_now`."""
    return datetime(2020, 8, 14, 21, 44, 16, tzinfo=timezone.utc)


@pytest.fixture
def override_utc_now(fake_now: datetime) -> Generator[None, None, None]:
    """Override the ``utc_now()`` function to always return `fake_now`."""
    with patch.object(hardware_initialization, "utc_now", return_value=fake_now):
        yield


@pytest.fixture
def override_settings_for_simulation() -> Generator[None, None, None]:
    """Override the ``get_settings()`` function.

    The overridden ``get_settings()`` will always return settings to make initialize()
    load simulated hardware, rather than real physical hardware.
    """
    with patch.object(
        hardware_initialization,
        "get_settings",
        return_value=RobotServerSettings(
            simulator_configuration_file_path="simulators" "/test.json"
        ),
    ):
        yield


@pytest.fixture
def event_publisher(decoy: Decoy) -> Publisher:
    """Return a mock notify-server event publisher."""
    return decoy.mock(cls=Publisher)


async def test_initialize_smoke(
    event_publisher: Publisher, override_settings_for_simulation: Any
) -> None:
    """It should return a valid ThreadManager and not raise anything."""
    initialized_hardware = await hardware_initialization.initialize(event_publisher)
    assert isinstance(initialized_hardware, ThreadManager)


def test_door_event_forwarder_forwards_door_events(
    decoy: Decoy,
    event_publisher: Publisher,
    fake_now: datetime,
    override_utc_now: Any,
) -> None:
    """It should forward incoming door events to its event publisher."""
    subject = hardware_initialization.DoorEventForwarder(event_publisher)

    input_event = DoorStateNotification(
        event=HardwareEventType.DOOR_SWITCH_CHANGE, new_state=DoorState.OPEN
    )

    expected_output_topic = "hardware_events"
    expected_output_event = Event(
        createdOn=fake_now,
        publisher="robot_server_event_publisher",
        data=DoorStatePayload(state=DoorState.OPEN),
    )

    subject.forward(input_event)

    decoy.verify(
        event_publisher.send_nowait(expected_output_topic, expected_output_event),
        times=1,
    )
