"""Test Heater Shaker close labware latch command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import HeaterShaker
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.heater_shaker.close_labware_latch import (
    CloseLabwareLatchImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleId,
    HeaterShakerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_close_labware_latch(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to close the module's labware latch."""
    subject = CloseLabwareLatchImpl(state_view=state_view, equipment=equipment)
    data = heater_shaker.CloseLabwareLatchParams(moduleId="input-heater-shaker-id")

    hs_module_substate = decoy.mock(cls=HeaterShakerModuleSubState)
    heater_shaker_hardware = decoy.mock(cls=HeaterShaker)

    decoy.when(
        state_view.modules.get_heater_shaker_module_substate(
            module_id="input-heater-shaker-id"
        )
    ).then_return(hs_module_substate)

    decoy.when(hs_module_substate.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )

    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(heater_shaker_hardware)

    result = await subject.execute(data)
    decoy.verify(await heater_shaker_hardware.close_labware_latch(), times=1)
    assert result == SuccessData(
        public=heater_shaker.CloseLabwareLatchResult(),
    )


async def test_close_labware_latch_virtual(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should no-op for virtual modules."""
    subject = CloseLabwareLatchImpl(state_view=state_view, equipment=equipment)
    data = heater_shaker.CloseLabwareLatchParams(moduleId="input-heater-shaker-id")

    hs_module_substate = decoy.mock(cls=HeaterShakerModuleSubState)

    decoy.when(
        state_view.modules.get_heater_shaker_module_substate(
            module_id="input-heater-shaker-id"
        )
    ).then_return(hs_module_substate)

    decoy.when(hs_module_substate.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )

    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(None)

    result = await subject.execute(data)

    assert result == SuccessData(
        public=heater_shaker.CloseLabwareLatchResult(),
    )
