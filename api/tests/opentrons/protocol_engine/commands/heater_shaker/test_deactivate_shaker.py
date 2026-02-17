"""Test Heater Shaker deactivate shake command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.heater_shaker.deactivate_shaker import (
    DeactivateShakerImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleId,
    HeaterShakerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_deactivate_shaker(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to deactivate the module's shake."""
    subject = DeactivateShakerImpl(state_view=state_view, equipment=equipment)
    data = heater_shaker.DeactivateShakerParams(moduleId="input-heater-shaker-id")

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

    # Get stubbed hardware module from hs module view
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)

    result = await subject.execute(data)
    decoy.verify(await hs_hardware.deactivate_shaker(), times=1)
    assert result == SuccessData(
        public=heater_shaker.DeactivateShakerResult(),
    )


async def test_deactivate_shaker_virtual(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to deactivate the module's shake."""
    subject = DeactivateShakerImpl(state_view=state_view, equipment=equipment)
    data = heater_shaker.DeactivateShakerParams(moduleId="input-heater-shaker-id")

    hs_module_substate = decoy.mock(cls=HeaterShakerModuleSubState)

    decoy.when(
        state_view.modules.get_heater_shaker_module_substate(
            module_id="input-heater-shaker-id"
        )
    ).then_return(hs_module_substate)

    decoy.when(hs_module_substate.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )

    # Get stubbed hardware module from hs module view
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(None)

    result = await subject.execute(data)
    assert result == SuccessData(
        public=heater_shaker.DeactivateShakerResult(),
    )
