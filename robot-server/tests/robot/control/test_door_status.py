"""Test door status route."""
import pytest
from decoy import Decoy
from opentrons.hardware_control.types import DoorState
from opentrons.hardware_control import HardwareControlAPI

from robot_server.robot.control.router import get_door_status


@pytest.mark.parametrize("state", [DoorState.OPEN, DoorState.CLOSED])
async def test_door_status(
    state: DoorState, hardware_api: HardwareControlAPI, decoy: Decoy
) -> None:
    """Test the door status route."""
    decoy.when(hardware_api.door_status).then_return(state)
    assert (await get_door_status(hardware_api)).data.state == state.name.lower()
