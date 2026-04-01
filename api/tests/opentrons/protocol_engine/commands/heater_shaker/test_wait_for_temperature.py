"""Test Heater Shaker await temperature command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.heater_shaker.wait_for_temperature import (
    WaitForTemperatureImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleId,
    HeaterShakerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_wait_for_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to wait for the module's target temperature."""
    subject = WaitForTemperatureImpl(state_view=state_view, equipment=equipment)

    data = heater_shaker.WaitForTemperatureParams(moduleId="heater-shaker-id")

    hs_module_substate = decoy.mock(cls=HeaterShakerModuleSubState)
    hs_hardware = decoy.mock(cls=HeaterShaker)

    decoy.when(
        state_view.modules.get_heater_shaker_module_substate(
            module_id="heater-shaker-id"
        )
    ).then_return(hs_module_substate)

    decoy.when(hs_module_substate.get_plate_target_temperature()).then_return(123.45)
    decoy.when(hs_module_substate.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )

    # Get stubbed hardware module from hs module view
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)

    result = await subject.execute(data)
    decoy.verify(
        await hs_hardware.await_temperature(awaiting_temperature=123.45), times=1
    )
    assert result == SuccessData(
        public=heater_shaker.WaitForTemperatureResult(),
    )
