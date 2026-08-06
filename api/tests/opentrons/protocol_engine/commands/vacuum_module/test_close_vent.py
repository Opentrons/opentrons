"""Test Vacuum Module Close Vent command implementation."""

from decoy import Decoy

from opentrons.drivers.vacuum_module.types import VentState
from opentrons.hardware_control.modules import VacuumModule
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.close_vent import (
    CloseVentImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.module_substates import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_close_vent(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should call down to the hardware controller's set_vent_state function with VentState.CLOSED."""
    subject = CloseVentImpl(
        state_view=state_view, equipment=equipment, movement=movement
    )

    data = vm_commands.CloseVentParams(moduleId="input-vacuum-id")
    expected_module_id = VacuumModuleId("vacuum-id")
    expected_result = vm_commands.CloseVentResult()

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

    decoy.verify(await vm_hardware.set_vent_state(VentState.CLOSED))
    assert result == SuccessData(
        public=expected_result,
        state_update=update_types.StateUpdate(),
    )
