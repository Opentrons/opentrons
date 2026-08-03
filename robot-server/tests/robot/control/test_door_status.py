"""Test door status route."""

import pytest
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import DoorState, DoorStateNotification

from robot_server.hardware import HardwareStateStore
from robot_server.robot.control.router import get_door_status


@pytest.mark.parametrize("state", [DoorState.OPEN, DoorState.CLOSED])
@pytest.mark.parametrize("required", [True, False])
async def test_door_status(
    state: DoorState, hardware_api: HardwareControlAPI, decoy: Decoy, required: bool
) -> None:
    """Test the door status route."""
    hardware_store = HardwareStateStore(hardware_resource=hardware_api)
    decoy.when(hardware_api.door_state).then_return(state)
    decoy.when(hardware_api.module_door_serial).then_return(None)
    hardware_store.update_hardware_status_callback(
        event=DoorStateNotification(new_state=state)
    )
    response = await get_door_status(hardware_api, hardware_store, required)
    assert response.content.data.status.name.lower() == state.name.lower()
    assert response.content.data.doorRequiredClosedForProtocol == required


@pytest.mark.parametrize("state", [DoorState.OPEN, DoorState.CLOSED])
@pytest.mark.parametrize("required", [True, False])
async def test_module_door_status(
    state: DoorState, hardware_api: HardwareControlAPI, decoy: Decoy, required: bool
) -> None:
    """Test the module door status route."""
    hardware_store = HardwareStateStore(hardware_resource=hardware_api)
    decoy.when(hardware_api.door_state).then_return(state)
    decoy.when(hardware_api.module_door_serial).then_return("magical_module_serial")
    hardware_store.update_hardware_status_callback(
        event=DoorStateNotification(new_state=state)
    )
    response = await get_door_status(hardware_api, hardware_store, required)
    assert response.content.data.status.name.lower() == state.name.lower()
    assert response.content.data.doorRequiredClosedForProtocol == required
