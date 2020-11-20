import pytest
from mock import AsyncMock, patch, ANY
from robot_server import hardware_wrapper
from robot_server.service import app
from opentrons.hardware_control.types import DoorState


async def test_publisher():
    """ Verify that door event publisher is initialized on server startup """
    with patch.object(app.api_wrapper, 'initialize'):
        with patch.object(app.api_wrapper, 'init_door_event_publisher') as dep:
            await app.on_startup()
            dep.assert_called_once()
        with patch.object(hardware_wrapper, 'publisher') as mock_pub:
            app.api_wrapper._tm = AsyncMock()
            await app.on_startup()
            mock_pub.create.assert_called_once()


@pytest.mark.skip(reason="can't create thread manager on dev environment")
async def test_door_event():
    """ Verify that a door event is published on hw event. """
    hw = hardware_wrapper.HardwareWrapper()
    hw._event_publisher = AsyncMock()
    tm = await hw.initialize()
    await hw.init_door_event_publisher()

    tm._update_door_state(DoorState.OPEN)
    hw._event_publisher.send_nowait.assert_called_once_with(
        topic="hardware.door_event", event=ANY)
