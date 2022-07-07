"""Test Heater Shaker open labware latch command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleSubState,
    HeaterShakerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.heater_shaker.open_labware_latch import (
    OpenLabwareLatchImpl,
)


async def test_open_labware_latch(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to open the module's labware latch."""
    subject = OpenLabwareLatchImpl(state_view=state_view, equipment=equipment)
    data = heater_shaker.OpenLabwareLatchParams(moduleId="input-heater-shaker-id")

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
    decoy.verify(
        hs_module_substate.raise_if_shaking(), await hs_hardware.open_labware_latch()
    )
    assert result == heater_shaker.OpenLabwareLatchResult()
