"""Test Temperature Module's set target temperature command implementation."""

from decoy import Decoy, matchers

from opentrons.hardware_control.modules import TempDeck
from opentrons.protocol_engine.actions import Action, ActionDispatcher, StartTaskAction
from opentrons.protocol_engine.commands import temperature_module
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.temperature_module.set_target_temperature import (
    SetTargetTemperatureImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, TaskHandler
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates import (
    TemperatureModuleId,
    TemperatureModuleSubState,
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

    data = temperature_module.SetTargetTemperatureParams(
        moduleId="tempdeck-id", celsius=1.23, taskId="taskId"
    )

    module_substate = decoy.mock(cls=TemperatureModuleSubState)
    tempdeck_hardware = decoy.mock(cls=TempDeck)

    decoy.when(
        state_view.modules.get_temperature_module_substate(module_id="tempdeck-id")
    ).then_return(module_substate)
    decoy.when(model_utils.ensure_id("taskId")).then_return("taskId")
    decoy.when(module_substate.module_id).then_return(
        TemperatureModuleId("tempdeck-id")
    )

    # Stub temperature validation
    decoy.when(module_substate.validate_target_temperature(celsius=1.23)).then_return(1)

    # Get stubbed hardware module
    decoy.when(
        equipment.get_module_hardware_api(TemperatureModuleId("tempdeck-id"))
    ).then_return(tempdeck_hardware)

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
        await tempdeck_hardware.start_set_temperature(celsius=1),
        times=1,
    )
    decoy.verify(await tempdeck_hardware.await_temperature(awaiting_temperature=1))
    assert result == SuccessData(
        public=temperature_module.SetTargetTemperatureResult(
            targetTemperature=1, taskId="taskId"
        ),
    )
