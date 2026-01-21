"""Test Heater Shaker deactivate heater command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.heater_shaker.deactivate_heater import (
    DeactivateHeaterImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleId,
    HeaterShakerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_deactivate_heater(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to deactivate the module's heater."""
    subject = DeactivateHeaterImpl(state_view=state_view, equipment=equipment)
    data = heater_shaker.DeactivateHeaterParams(moduleId="input-heater-shaker-id")

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

    # Get stubbed hardware module
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)

    result = await subject.execute(data)
    decoy.verify(await hs_hardware.deactivate_heater(), times=1)
    assert result == SuccessData(
        public=heater_shaker.DeactivateHeaterResult(),
    )
