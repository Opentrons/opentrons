"""Test Thermocycler wait for block temperature command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import Thermocycler
from opentrons.protocol_engine.commands import thermocycler as tc_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.thermocycler.wait_for_block_temperature import (
    WaitForBlockTemperatureImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    ThermocyclerModuleId,
    ThermocyclerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_set_target_block_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to wait for the specified module's target temperature."""
    subject = WaitForBlockTemperatureImpl(state_view=state_view, equipment=equipment)

    data = tc_commands.WaitForBlockTemperatureParams(
        moduleId="input-thermocycler-id",
    )
    expected_result = tc_commands.WaitForBlockTemperatureResult()

    tc_module_substate = decoy.mock(cls=ThermocyclerModuleSubState)
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(
        state_view.modules.get_thermocycler_module_substate("input-thermocycler-id")
    ).then_return(tc_module_substate)

    decoy.when(tc_module_substate.module_id).then_return(
        ThermocyclerModuleId("thermocycler-id")
    )

    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(ThermocyclerModuleId("thermocycler-id"))
    ).then_return(tc_hardware)

    result = await subject.execute(data)

    decoy.verify(
        tc_module_substate.get_target_block_temperature(),
        await tc_hardware.wait_for_block_target(),
    )
    assert result == SuccessData(public=expected_result)
