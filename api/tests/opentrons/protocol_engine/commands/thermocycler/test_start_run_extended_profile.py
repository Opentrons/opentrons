"""Test Thermocycler start run profile command implementation."""

from typing import List, Union

from decoy import Decoy, matchers

from opentrons.hardware_control.modules import Thermocycler
from opentrons.protocol_engine.actions import Action, ActionDispatcher, StartTaskAction
from opentrons.protocol_engine.commands import thermocycler as tc_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.thermocycler.run_extended_profile import (
    ProfileCycle,
    ProfileStep,
)
from opentrons.protocol_engine.commands.thermocycler.start_run_extended_profile import (
    StartRunExtendedProfileImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, TaskHandler
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates import (
    ThermocyclerModuleId,
    ThermocyclerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types.tasks import Task


async def test_start_run_extended_profile(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should be able to start a specified module's profile run and return a task."""
    subject = StartRunExtendedProfileImpl(
        state_view=state_view, equipment=equipment, task_handler=real_task_handler
    )

    step_data: List[Union[ProfileStep, ProfileCycle]] = [
        ProfileStep(celsius=12.3, holdSeconds=45, rampRate=0.0),
        ProfileCycle(
            steps=[
                ProfileStep(celsius=78.9, holdSeconds=910, rampRate=2.0),
                ProfileStep(celsius=12, holdSeconds=1, rampRate=0.0),
            ],
            repetitions=2,
        ),
        ProfileStep(celsius=45.6, holdSeconds=78, rampRate=2.0),
        ProfileCycle(
            steps=[
                ProfileStep(celsius=56, holdSeconds=11, rampRate=0.0),
                ProfileStep(celsius=34, holdSeconds=10, rampRate=2.0),
            ],
            repetitions=1,
        ),
    ]
    data = tc_commands.StartRunExtendedProfileParams(
        moduleId="input-thermocycler-id",
        profileElements=step_data,
        blockMaxVolumeUl=56.7,
        taskId="task-id",
    )
    tc_module_substate = decoy.mock(cls=ThermocyclerModuleSubState)
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(
        state_view.modules.get_thermocycler_module_substate("input-thermocycler-id")
    ).then_return(tc_module_substate)

    decoy.when(tc_module_substate.module_id).then_return(
        ThermocyclerModuleId("thermocycler-id")
    )

    decoy.when(model_utils.ensure_id("task-id")).then_return("task-id")

    # Stub temperature validation from hs module view
    decoy.when(tc_module_substate.validate_target_block_temperature(12.3)).then_return(
        32.1
    )
    decoy.when(tc_module_substate.validate_target_block_temperature(78.9)).then_return(
        78.9
    )
    decoy.when(tc_module_substate.validate_target_block_temperature(12)).then_return(12)
    decoy.when(tc_module_substate.validate_target_block_temperature(45.6)).then_return(
        65.4
    )
    decoy.when(tc_module_substate.validate_target_block_temperature(56)).then_return(56)
    decoy.when(tc_module_substate.validate_target_block_temperature(34)).then_return(34)

    # Stub volume validation from hs module view
    decoy.when(tc_module_substate.validate_max_block_volume(56.7)).then_return(76.5)
    decoy.when(tc_module_substate.validate_ramp_rate(0.0, 12.3)).then_return(0.0)
    decoy.when(tc_module_substate.validate_ramp_rate(2.0, 78.9)).then_return(2.0)
    decoy.when(tc_module_substate.validate_ramp_rate(0.0, 12.0)).then_return(0.0)
    decoy.when(tc_module_substate.validate_ramp_rate(2.0, 45.6)).then_return(2.0)
    decoy.when(tc_module_substate.validate_ramp_rate(0.0, 56.0)).then_return(0.0)
    decoy.when(tc_module_substate.validate_ramp_rate(2.0, 34.0)).then_return(2.0)

    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(ThermocyclerModuleId("thermocycler-id"))
    ).then_return(tc_hardware)

    task: Task | None = None

    def _capture_task(action: Action) -> None:
        nonlocal task
        assert isinstance(action, StartTaskAction)
        task = action.task

    decoy.when(
        action_dispatcher.dispatch(StartTaskAction(task=matchers.Anything()))  # type: ignore[func-returns-value]
    ).then_do(_capture_task)
    result = await subject.execute(data)
    assert task is not None
    await task.asyncioTask
    decoy.verify(
        await tc_hardware.execute_profile(
            profile=[
                {"temperature": 32.1, "hold_time_seconds": 45, "ramp_rate": 0.0},
                {
                    "steps": [
                        {
                            "temperature": 78.9,
                            "hold_time_seconds": 910,
                            "ramp_rate": 2.0,
                        },
                        {"temperature": 12, "hold_time_seconds": 1, "ramp_rate": 0.0},
                    ],
                    "repetitions": 2,
                },
                {"temperature": 65.4, "hold_time_seconds": 78, "ramp_rate": 2.0},
                {
                    "steps": [
                        {"temperature": 56, "hold_time_seconds": 11, "ramp_rate": 0.0},
                        {"temperature": 34, "hold_time_seconds": 10, "ramp_rate": 2.0},
                    ],
                    "repetitions": 1,
                },
            ],
            volume=76.5,
        ),
        times=1,
    )
    assert result == SuccessData(
        public=tc_commands.StartRunExtendedProfileResult(taskId="task-id")
    )
