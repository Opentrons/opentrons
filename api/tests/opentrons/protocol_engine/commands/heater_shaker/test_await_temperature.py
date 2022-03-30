"""Test Heater Shaker await temperature command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.state.modules import (
    HeaterShakerModuleSubState,
    HeaterShakerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.await_temperature import (
    AwaitTemperatureImpl,
)


async def test_await_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to wait for the module's target temperature."""
    subject = AwaitTemperatureImpl(state_view=state_view, equipment=equipment)

    data = heater_shaker.AwaitTemperatureParams(moduleId="input-heater-shaker-id")

    # Get module view
    hs_module_view = decoy.mock(cls=HeaterShakerModuleSubState)
    hs_hardware = decoy.mock(cls=HeaterShaker)

    decoy.when(
        state_view.modules.get_heater_shaker_module_substate(
            module_id="input-heater-shaker-id")
    ).then_return(hs_module_view)

    decoy.when(hs_module_view.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )

    decoy.when(
        state_view.modules.get_plate_target_temperature(
            HeaterShakerModuleId("heater-shaker-id")
        )
    ).then_return(123.45)

    # Get stubbed hardware module from hs module view
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)

    result = await subject.execute(data)
    decoy.verify(
        await hs_hardware.await_temperature(awaiting_temperature=123.45), times=1
    )
    assert result == heater_shaker.AwaitTemperatureResult()
