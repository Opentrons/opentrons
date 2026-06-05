"""Test Vacuum Module wait for target command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import VacuumModule
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.wait_for_target import (
    WaitForTargetImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.module_substates import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_wait_for_target(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should call down to the hardware controller's wait_for_target function."""
    subject = WaitForTargetImpl(
        state_view=state_view, equipment=equipment, movement=movement
    )
    data = vm_commands.WaitForTargetParams(
        moduleId="input-vacuum-id",
    )
    expected_module_id = VacuumModuleId("vacuum-id")
    expected_result = vm_commands.WaitForTargetResult()

    vm_module_substate = decoy.mock(cls=VacuumModuleSubState)
    vm_hardware = decoy.mock(cls=VacuumModule)

    decoy.when(
        state_view.modules.get_vacuum_module_substate("input-vacuum-id")
    ).then_return(vm_module_substate)

    decoy.when(vm_module_substate.module_id).then_return(expected_module_id)

    # Get attached hardware modules
    decoy.when(equipment.get_module_hardware_api(expected_module_id)).then_return(
        vm_hardware
    )
    result = await subject.execute(data)

    decoy.verify(await vm_hardware.wait_for_target())
    assert result == SuccessData(
        public=expected_result,
        state_update=update_types.StateUpdate(),
    )
