"""Test Temperature Module's set target temperature command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import TempDeck

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    TemperatureModuleSubState,
    TemperatureModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import temperature_module
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.temperature_module.set_target_temperature import (
    SetTargetTemperatureImpl,
)


async def test_set_target_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to set the specified module's target temperature."""
    subject = SetTargetTemperatureImpl(state_view=state_view, equipment=equipment)

    data = temperature_module.SetTargetTemperatureParams(
        moduleId="tempdeck-id",
        celsius=1.23,
    )

    module_substate = decoy.mock(cls=TemperatureModuleSubState)
    tempdeck_hardware = decoy.mock(cls=TempDeck)

    decoy.when(
        state_view.modules.get_temperature_module_substate(module_id="tempdeck-id")
    ).then_return(module_substate)

    decoy.when(module_substate.module_id).then_return(
        TemperatureModuleId("tempdeck-id")
    )

    # Stub temperature validation
    decoy.when(module_substate.validate_target_temperature(celsius=1.23)).then_return(1)

    # Get stubbed hardware module
    decoy.when(
        equipment.get_module_hardware_api(TemperatureModuleId("tempdeck-id"))
    ).then_return(tempdeck_hardware)

    result = await subject.execute(data)
    decoy.verify(await tempdeck_hardware.start_set_temperature(celsius=1), times=1)
    assert result == SuccessData(
        public=temperature_module.SetTargetTemperatureResult(targetTemperature=1),
        private=None,
    )
