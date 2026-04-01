"""Test Temperature Module's wait for temperature command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import TempDeck
from opentrons.protocol_engine.commands import temperature_module
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.temperature_module.wait_for_temperature import (
    WaitForTemperatureImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    TemperatureModuleId,
    TemperatureModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_wait_for_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to wait for the module's target temperature."""
    subject = WaitForTemperatureImpl(state_view=state_view, equipment=equipment)

    data = temperature_module.WaitForTemperatureParams(moduleId="tempdeck-id")

    module_substate = decoy.mock(cls=TemperatureModuleSubState)
    tempdeck_hardware = decoy.mock(cls=TempDeck)

    decoy.when(
        state_view.modules.get_temperature_module_substate(module_id="tempdeck-id")
    ).then_return(module_substate)

    decoy.when(module_substate.get_plate_target_temperature()).then_return(123)
    decoy.when(module_substate.module_id).then_return(
        TemperatureModuleId("tempdeck-id")
    )

    # Get stubbed hardware module
    decoy.when(
        equipment.get_module_hardware_api(TemperatureModuleId("tempdeck-id"))
    ).then_return(tempdeck_hardware)

    result = await subject.execute(data)
    decoy.verify(
        await tempdeck_hardware.await_temperature(awaiting_temperature=123), times=1
    )
    assert result == SuccessData(
        public=temperature_module.WaitForTemperatureResult(),
    )


async def test_wait_for_temperature_requested_celsius(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to wait for the module's target temperature."""
    subject = WaitForTemperatureImpl(state_view=state_view, equipment=equipment)

    data = temperature_module.WaitForTemperatureParams(
        moduleId="tempdeck-id", celsius=12.3
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
    decoy.when(module_substate.validate_target_temperature(celsius=12.3)).then_return(
        12
    )

    # Get stubbed hardware module
    decoy.when(
        equipment.get_module_hardware_api(TemperatureModuleId("tempdeck-id"))
    ).then_return(tempdeck_hardware)

    result = await subject.execute(data)
    decoy.verify(
        await tempdeck_hardware.await_temperature(awaiting_temperature=12), times=1
    )
    assert result == SuccessData(
        public=temperature_module.WaitForTemperatureResult(),
    )
