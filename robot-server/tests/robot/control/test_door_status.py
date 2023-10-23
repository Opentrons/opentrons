"""Test door status route."""
import pytest
from decoy import Decoy
from opentrons.hardware_control.types import DoorState
from opentrons.hardware_control import HardwareControlAPI

from robot_server.robot.control.router import get_door_status


@pytest.mark.parametrize("state", [DoorState.OPEN, DoorState.CLOSED])
@pytest.mark.parametrize("required", [True, False])
async def test_door_status(
    state: DoorState, hardware_api: HardwareControlAPI, decoy: Decoy, required: bool
) -> None:
    """Test the door status route."""
    decoy.when(hardware_api.door_state).then_return(state)
    response = await get_door_status(hardware_api, required)
    assert response.content.data.status.name.lower() == state.name.lower()
    assert response.content.data.doorRequiredClosedForProtocol == required
