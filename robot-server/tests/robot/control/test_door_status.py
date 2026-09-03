"""Test door status route."""

import pytest
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import (
    DoorState,
    DoorStateNotification,
    EstopState,
)

from robot_server.hardware import HardwareStateStore
from robot_server.robot.control.router import get_door_status


@pytest.mark.parametrize("initial_state", [DoorState.OPEN, DoorState.CLOSED])
@pytest.mark.parametrize("new_state", [DoorState.OPEN, DoorState.CLOSED])
@pytest.mark.parametrize("required", [True, False])
async def test_door_status(
    new_state: DoorState,
    initial_state: DoorState,
    hardware_api: HardwareControlAPI,
    decoy: Decoy,
    required: bool,
) -> None:
    """Test the door status route."""
    hardware_store = HardwareStateStore(
        hardware_resource=hardware_api,
        attached_modules=[],
        attached_subsystems={},
        estop_state=EstopState.DISENGAGED,
        door_state=initial_state,
        module_door_serial=None,
    )
    decoy.when(hardware_api.door_state).then_raise(
        RuntimeError("not allowed to touch this")
    )
    decoy.when(hardware_api.module_door_serial).then_raise(
        RuntimeError("not allowed to touch this")
    )
    await hardware_store.update_hardware_status_callback(
        event=DoorStateNotification(new_state=new_state, module_serial="asdasda")
    )
    response = await get_door_status(hardware_store, required)

    assert response.content.data.status.name.lower() == new_state.name.lower()
    assert response.content.data.doorRequiredClosedForProtocol == required
