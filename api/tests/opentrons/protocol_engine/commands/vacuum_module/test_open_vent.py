"""Test Vacuum Module Open Vent command implementation."""

from decoy import Decoy

from opentrons.drivers.vacuum_module.types import VentState
from opentrons.hardware_control.modules import VacuumModule
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.open_vent import (
    OpenVentImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.module_substates import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_open_vent(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should call down to the hardware controller's set_vent_state function with VentState.OPENED."""
    subject = OpenVentImpl(
        state_view=state_view, equipment=equipment, movement=movement
    )

    data = vm_commands.OpenVentParams(moduleId="input-vacuum-id")
    expected_module_id = VacuumModuleId("vacuum-id")
    expected_result = vm_commands.OpenVentResult()

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

    decoy.verify(await vm_hardware.set_vent_state(VentState.OPENED))
    assert result == SuccessData(
        public=expected_result,
        state_update=update_types.StateUpdate(),
    )


async def test_open_vent_waits_to_equalize(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should wait for pressure equalization when equalizeTimeout is set."""
    subject = OpenVentImpl(
        state_view=state_view, equipment=equipment, movement=movement
    )

    data = vm_commands.OpenVentParams(moduleId="input-vacuum-id", equalizeTimeout=30)
    expected_module_id = VacuumModuleId("vacuum-id")

    vm_module_substate = decoy.mock(cls=VacuumModuleSubState)
    vm_hardware = decoy.mock(cls=VacuumModule)

    decoy.when(
        state_view.modules.get_vacuum_module_substate("input-vacuum-id")
    ).then_return(vm_module_substate)
    decoy.when(vm_module_substate.module_id).then_return(expected_module_id)
    decoy.when(equipment.get_module_hardware_api(expected_module_id)).then_return(
        vm_hardware
    )

    result = await subject.execute(data)

    decoy.verify(
        await vm_hardware.set_vent_state(VentState.OPENED),
        await vm_hardware.wait_for_pressure_equalization(30),
    )
    expected_state_update = update_types.StateUpdate()
    expected_state_update.update_vacuum_module_residual_vacuum(
        "input-vacuum-id", residual_vacuum=False
    )
    assert result == SuccessData(
        public=vm_commands.OpenVentResult(),
        state_update=expected_state_update,
    )
