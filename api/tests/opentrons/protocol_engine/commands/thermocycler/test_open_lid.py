"""Test Thermocycler open lid command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import Thermocycler

from opentrons.protocol_engine.types import MotorAxis
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    ThermocyclerModuleSubState,
    ThermocyclerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.commands import thermocycler as tc_commands
from opentrons.protocol_engine.commands.thermocycler.open_lid import (
    OpenLidImpl,
)


async def test_open_lid(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should be able to open the specified module's lid."""
    subject = OpenLidImpl(state_view=state_view, equipment=equipment, movement=movement)

    data = tc_commands.OpenLidParams(moduleId="input-thermocycler-id")
    expected_module_id = ThermocyclerModuleId("thermocycler-id")
    expected_result = tc_commands.OpenLidResult()

    tc_module_substate = decoy.mock(cls=ThermocyclerModuleSubState)
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(
        state_view.modules.get_thermocycler_module_substate("input-thermocycler-id")
    ).then_return(tc_module_substate)

    decoy.when(tc_module_substate.module_id).then_return(expected_module_id)

    # Get attached hardware modules
    decoy.when(equipment.get_module_hardware_api(expected_module_id)).then_return(
        tc_hardware
    )
    decoy.when(state_view.motion.get_robot_mount_axes()).then_return(
        [MotorAxis.EXTENSION_Z]
    )
    result = await subject.execute(data)

    decoy.verify(
        await movement.home([MotorAxis.X, MotorAxis.Y, MotorAxis.EXTENSION_Z]),
        await tc_hardware.open(),
        times=1,
    )
    assert result == expected_result
