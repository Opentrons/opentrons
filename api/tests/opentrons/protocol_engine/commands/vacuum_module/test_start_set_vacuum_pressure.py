"""Test Vacuum Module start set vacuum command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import VacuumModule
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.start_set_vacuum_pressure import (
    StartSetVacuumPressureImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.module_substates import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_start_set_vacuum_presure(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
) -> None:
    """It should call down to the hardware controller's start_set_vacuum_pressure function."""
    subject = StartSetVacuumPressureImpl(
        state_view=state_view, equipment=equipment, movement=movement
    )

    gauge_pressure = 444.0
    pressure_rate = 5.5
    duration_s = 100
    timeout_s = 60

    data = vm_commands.StartSetVacuumPressureParams(
        moduleId="input-vacuum-id",
        gaugePressure=gauge_pressure,
        duration=duration_s,
        rate=pressure_rate,
        timeout=timeout_s,
    )
    expected_module_id = VacuumModuleId("vacuum-id")
    expected_result = vm_commands.StartSetVacuumPressureResult()

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
        await vm_hardware.set_vacuum_state(
            True,
            gauge_pressure,
            duration_s,
            rate=pressure_rate,
            timeout_s=timeout_s,
            vent_after=True,
        )
    )
    assert result == SuccessData(
        public=expected_result,
        state_update=update_types.StateUpdate(),
    )
