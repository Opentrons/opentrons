"""Test Vacuum Module stop vacuum command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import VacuumModule
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.stop_vacuum import (
    StopVacuumImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.module_substates import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_stop_vacuum(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should call down to the hardware controller's stop_vacuum function."""
    subject = StopVacuumImpl(
        state_view=state_view, equipment=equipment, movement=movement
    )

    data = vm_commands.StopVacuumParams(moduleId="input-vacuum-id")
    expected_module_id = VacuumModuleId("vacuum-id")
    expected_result = vm_commands.StopVacuumResult()

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

    decoy.verify(await vm_hardware.set_vacuum_state(enable_vacuum=False))

    expected_state_update = update_types.StateUpdate()
    expected_state_update.update_vacuum_module_pump_engaged("input-vacuum-id", False)

    assert result == SuccessData(
        public=expected_result,
        state_update=expected_state_update,
    )
