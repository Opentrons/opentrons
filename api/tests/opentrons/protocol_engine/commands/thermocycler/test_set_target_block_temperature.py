"""Test Thermocycler set block temperature command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import Thermocycler

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    ThermocyclerModuleSubState,
    ThermocyclerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import thermocycler as tc_commands
from opentrons.protocol_engine.commands.thermocycler.set_target_block_temperature import (
    SetTargetBlockTemperatureImpl,
)


async def test_set_target_block_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to set the specified module's target temperature."""
    subject = SetTargetBlockTemperatureImpl(state_view=state_view, equipment=equipment)

    data = tc_commands.SetTargetBlockTemperatureParams(
        moduleId="input-thermocycler-id",
        celsius=12.3,
        blockMaxVolumeUl=50.2,
        holdTimeSeconds=123456,
    )
    expected_result = tc_commands.SetTargetBlockTemperatureResult(
        targetBlockTemperature=45.6
    )

    tc_module_substate = decoy.mock(cls=ThermocyclerModuleSubState)
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(
        state_view.modules.get_thermocycler_module_substate("input-thermocycler-id")
    ).then_return(tc_module_substate)

    decoy.when(tc_module_substate.module_id).then_return(
        ThermocyclerModuleId("thermocycler-id")
    )

    # Stub temperature validation from TC module view
    decoy.when(tc_module_substate.validate_target_block_temperature(12.3)).then_return(
        45.6
    )

    # Stub volume validation from TC module view
    decoy.when(tc_module_substate.validate_max_block_volume(50.2)).then_return(77.6)
    # Stub hold time validation from TC module view
    decoy.when(tc_module_substate.validate_hold_time(123456)).then_return(654321)
    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(ThermocyclerModuleId("thermocycler-id"))
    ).then_return(tc_hardware)

    result = await subject.execute(data)

    decoy.verify(
        await tc_hardware.set_target_block_temperature(
            celsius=45.6, volume=77.6, hold_time_seconds=654321
        ),
        times=1,
    )
    assert result == expected_result
