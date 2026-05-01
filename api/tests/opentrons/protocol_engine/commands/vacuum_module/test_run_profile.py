"""Test Vacuum Module run profile command implementation."""

from decoy import Decoy

from opentrons.hardware_control.modules import VacuumModule
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.run_profile import (
    ProfileType,
    RunProfileImpl,
    RunProfileParams,
    VacuumModuleProfilePowerStep,
    VacuumModuleProfilePressureStep,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.module_substates import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView


async def test_run_profile(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to execute the specified module's profile run."""
    subject = RunProfileImpl(state_view=state_view, equipment=equipment)

    step_data: ProfileType = [
        VacuumModuleProfilePowerStep(
            enablePump=True,
            holdTimeSeconds=100,
            holdTimeMinutes=101,
            rampRate=1,
            timeoutSeconds=7,
            ventAfter=True,
            percentPower=49,
        ),
        VacuumModuleProfilePressureStep(
            enablePump=True,
            holdTimeSeconds=100,
            holdTimeMinutes=101,
            rampRate=1,
            timeoutSeconds=7,
            ventAfter=True,
            gaugePressureMbar=51,
        ),
    ]
    data = RunProfileParams(
        moduleId="input-vacuum_module-id",
        profile=step_data,
    )
    expected_result = vm_commands.RunProfileResult()

    vm_module_substate = decoy.mock(cls=VacuumModuleSubState)
    vm_hardware = decoy.mock(cls=VacuumModule)

    decoy.when(
        state_view.modules.get_vacuum_module_substate("input-vacuum_module-id")
    ).then_return(vm_module_substate)

    decoy.when(vm_module_substate.module_id).then_return(
        VacuumModuleId("vacuum-module-id")
    )
    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(VacuumModuleId("vacuum-module-id"))
    ).then_return(vm_hardware)

    result = await subject.execute(data)

    #    decoy.verify(
    #        await vm_hardware.cycle_temperatures(
    #            steps=[
    #                {"temperature": 32.1, "hold_time_seconds": 45, "ramp_rate": 0.0},
    #                {"temperature": 65.4, "hold_time_seconds": 78, "ramp_rate": 0.0},
    #            ],
    #            repetitions=1,
    #            volume=76.5,
    #        ),
    #        times=1,
    #    )
    assert result == SuccessData(public=expected_result)
