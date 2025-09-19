"""Test Heater-Shaker start set temperature command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker

from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleSubState,
    HeaterShakerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.heater_shaker.set_target_temperature import (
    SetTargetTemperatureImpl,
)


async def test_set_target_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to set the specified module's target temperature."""
    subject = SetTargetTemperatureImpl(state_view=state_view, equipment=equipment)

    data = heater_shaker.SetTargetTemperatureParams(
        moduleId="input-heater-shaker-id",
        celsius=12.3,
    )

    hs_module_substate = decoy.mock(cls=HeaterShakerModuleSubState)
    hs_hardware = decoy.mock(cls=HeaterShaker)

    decoy.when(
        state_view.modules.get_heater_shaker_module_substate(
            module_id="input-heater-shaker-id"
        )
    ).then_return(hs_module_substate)

    decoy.when(hs_module_substate.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )

    # Stub temperature validation from hs module view
    decoy.when(
        hs_module_substate.validate_target_temperature(celsius=12.3)
    ).then_return(45.6)

    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)

    result = await subject.execute(data)
    decoy.verify(await hs_hardware.start_set_temperature(celsius=45.6), times=1)
    assert result == SuccessData(
        public=heater_shaker.SetTargetTemperatureResult(),
    )
