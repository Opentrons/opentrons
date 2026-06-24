"""Test Vacuum Module start set vacuum power command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import VacuumModule
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.start_set_vacuum_power import (
    StartSetVacuumPowerImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.module_substates import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_start_set_vacuum_power(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should call down to the hardware controller's start_set_vacuum_pressure function."""
    subject = StartSetVacuumPowerImpl(
        state_view=state_view, equipment=equipment, movement=movement
    )

    duty_cycle = 77

    data = vm_commands.StartSetVacuumPowerParams(
        moduleId="input-vacuum-id", percentPower=duty_cycle
    )
    expected_module_id = VacuumModuleId("vacuum-id")
    expected_result = vm_commands.StartSetVacuumPowerResult()

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

    decoy.verify(
        await vm_hardware.set_pump_state(
            True,
            duty_cycle=duty_cycle,
            duration_s=None,
            timeout_s=None,
            rate=None,
            vent_after=True,
        )
    )
    assert result == SuccessData(
        public=expected_result,
        state_update=update_types.StateUpdate(),
    )
