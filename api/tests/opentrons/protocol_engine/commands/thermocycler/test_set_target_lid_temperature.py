"""Test Thermocycler set lid temperature command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import Thermocycler

from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    ThermocyclerModuleSubState,
    ThermocyclerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import thermocycler as tc_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.thermocycler.set_target_lid_temperature import (
    SetTargetLidTemperatureImpl,
)


async def test_set_target_lid_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to set the specified module's target temperature."""
    subject = SetTargetLidTemperatureImpl(state_view=state_view, equipment=equipment)

    data = tc_commands.SetTargetLidTemperatureParams(
        moduleId="input-thermocycler-id",
        celsius=12.3,
    )
    expected_result = tc_commands.SetTargetLidTemperatureResult(
        targetLidTemperature=45.6
    )

    tc_module_substate = decoy.mock(cls=ThermocyclerModuleSubState)
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(
        state_view.modules.get_thermocycler_module_substate("input-thermocycler-id")
    ).then_return(tc_module_substate)

    decoy.when(tc_module_substate.module_id).then_return(
        ThermocyclerModuleId("thermocycler-id")
    )

    # Stub temperature validation from hs module view
    decoy.when(tc_module_substate.validate_target_lid_temperature(12.3)).then_return(
        45.6
    )

    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(ThermocyclerModuleId("thermocycler-id"))
    ).then_return(tc_hardware)

    result = await subject.execute(data)

    decoy.verify(await tc_hardware.set_target_lid_temperature(celsius=45.6), times=1)
    assert result == SuccessData(public=expected_result)
