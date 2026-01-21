"""Test Thermocycler deactivate block command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import Thermocycler
from opentrons.protocol_engine.commands import thermocycler as tc_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.thermocycler.deactivate_block import (
    DeactivateBlockImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    ThermocyclerModuleId,
    ThermocyclerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_deactivate_block(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to deactivate the specified module's block."""
    subject = DeactivateBlockImpl(state_view=state_view, equipment=equipment)

    data = tc_commands.DeactivateBlockParams(moduleId="input-thermocycler-id")
    expected_module_id = ThermocyclerModuleId("thermocycler-id")
    expected_result = tc_commands.DeactivateBlockResult()

    tc_module_substate = decoy.mock(cls=ThermocyclerModuleSubState)
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(
        state_view.modules.get_thermocycler_module_substate("input-thermocycler-id")
    ).then_return(tc_module_substate)

    decoy.when(tc_module_substate.module_id).then_return(expected_module_id)

    # Get attached hardware modules
    decoy.when(equipment.get_module_hardware_api(expected_module_id)).then_return(
        tc_hardware
    )

    result = await subject.execute(data)

    decoy.verify(await tc_hardware.deactivate_block(), times=1)
    assert result == SuccessData(public=expected_result)
