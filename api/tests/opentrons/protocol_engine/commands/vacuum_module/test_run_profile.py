"""Test Vacuum Module run profile command implementation."""

from typing import List, Union

from decoy import Decoy
from typing_extensions import cast

from opentrons.hardware_control.modules import VacuumModule
from opentrons.hardware_control.modules.types import (
    VacuumModuleCycle,
    VacuumModulePowerStep,
    VacuumModulePressureStep,
)
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.run_profile import (
    ProfileType,
    RunProfileImpl,
    RunProfileParams,
    VacuumModuleProfileCycle,
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

    cycle_power_step = VacuumModuleProfilePowerStep(
        enablePump=True,
        holdTimeSeconds=49,
        holdTimeMinutes=48,
        rampRate=2,
        timeoutSeconds=8,
        ventAfter=False,
        percentPower=78,
    )
    cycle_pressure_step = VacuumModuleProfilePressureStep(
        enablePump=True,
        holdTimeSeconds=333,
        holdTimeMinutes=332,
        rampRate=3,
        timeoutSeconds=6,
        ventAfter=True,
        gaugePressureMbar=-400,
    )

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
        VacuumModuleProfileCycle(
            steps=[cycle_pressure_step, cycle_power_step], repetitions=2
        ),
    ]

    vm_power_step = cast(VacuumModuleProfilePowerStep, step_data[0])
    vm_pressure_step = cast(VacuumModuleProfilePressureStep, step_data[1])
    vm_cycle = cast(VacuumModuleProfileCycle, step_data[2])
    expected_hc_steps: List[
        Union[VacuumModulePowerStep, VacuumModulePressureStep, VacuumModuleCycle]
    ] = [
        VacuumModulePowerStep(
            enable_pump=vm_power_step.enablePump,
            hold_time_seconds=vm_power_step.holdTimeSeconds,
            hold_time_minutes=vm_power_step.holdTimeMinutes,
            ramp_rate=vm_power_step.rampRate,
            timeout_seconds=vm_power_step.timeoutSeconds,
            vent_after=vm_power_step.ventAfter,
            percent_power=vm_power_step.percentPower,
        ),
        VacuumModulePressureStep(
            enable_pump=vm_pressure_step.enablePump,
            hold_time_seconds=vm_pressure_step.holdTimeSeconds,
            hold_time_minutes=vm_pressure_step.holdTimeMinutes,
            ramp_rate=vm_pressure_step.rampRate,
            timeout_seconds=vm_pressure_step.timeoutSeconds,
            vent_after=vm_pressure_step.ventAfter,
            gauge_pressure_mbar=vm_pressure_step.gaugePressureMbar,
        ),
        VacuumModuleCycle(
            steps=[
                VacuumModulePressureStep(
                    enable_pump=cycle_pressure_step.enablePump,
                    hold_time_seconds=cycle_pressure_step.holdTimeSeconds,
                    hold_time_minutes=cycle_pressure_step.holdTimeMinutes,
                    ramp_rate=cycle_pressure_step.rampRate,
                    timeout_seconds=cycle_pressure_step.timeoutSeconds,
                    vent_after=cycle_pressure_step.ventAfter,
                    gauge_pressure_mbar=cycle_pressure_step.gaugePressureMbar,
                ),
                VacuumModulePowerStep(
                    enable_pump=cycle_power_step.enablePump,
                    hold_time_seconds=cycle_power_step.holdTimeSeconds,
                    hold_time_minutes=cycle_power_step.holdTimeMinutes,
                    ramp_rate=cycle_power_step.rampRate,
                    timeout_seconds=cycle_power_step.timeoutSeconds,
                    vent_after=cycle_power_step.ventAfter,
                    percent_power=cycle_power_step.percentPower,
                ),
            ],
            repetitions=vm_cycle.repetitions,
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

    # should call execute_profile w the correct steps
    decoy.verify(await vm_hardware.execute_profile(profile=expected_hc_steps))
    assert result == SuccessData(public=expected_result)
