"""Test Heater-Shaker start set temperature command implementation."""

from decoy import Decoy, matchers

from opentrons.hardware_control.modules import HeaterShaker
from opentrons.protocol_engine.actions import Action, ActionDispatcher, StartTaskAction
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.heater_shaker.set_target_temperature import (
    SetTargetTemperatureImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, TaskHandler
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleId,
    HeaterShakerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types.tasks import Task


async def test_set_target_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should be able to set the specified module's target temperature."""
    subject = SetTargetTemperatureImpl(
        state_view=state_view, equipment=equipment, task_handler=real_task_handler
    )

    data = heater_shaker.SetTargetTemperatureParams(
        moduleId="input-heater-shaker-id", celsius=12.3, taskId="taskId"
    )

    hs_module_substate = decoy.mock(cls=HeaterShakerModuleSubState)
    hs_hardware = decoy.mock(cls=HeaterShaker)

    decoy.when(
        state_view.modules.get_heater_shaker_module_substate(
            module_id="input-heater-shaker-id"
        )
    ).then_return(hs_module_substate)

    decoy.when(model_utils.ensure_id("taskId")).then_return("taskId")
    decoy.when(hs_module_substate.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )

    # Stub temperature validation from hs module view
    decoy.when(
        hs_module_substate.validate_target_temperature(celsius=12.3)
    ).then_return(45.6)

    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)

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
    decoy.verify(await hs_hardware.start_set_temperature(celsius=45.6), times=1)
    decoy.verify(await hs_hardware.await_temperature(awaiting_temperature=45.6))
    assert result == SuccessData(
        public=heater_shaker.SetTargetTemperatureResult(taskId="taskId"),
    )
