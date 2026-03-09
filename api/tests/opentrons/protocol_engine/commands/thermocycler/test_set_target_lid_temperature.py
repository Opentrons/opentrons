"""Test Thermocycler set lid temperature command implementation."""

from decoy import Decoy, matchers

from opentrons.hardware_control.modules import Thermocycler
from opentrons.protocol_engine.actions import Action, ActionDispatcher, StartTaskAction
from opentrons.protocol_engine.commands import thermocycler as tc_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.thermocycler.set_target_lid_temperature import (
    SetTargetLidTemperatureImpl,
    SetTargetLidTemperatureResult,
)
from opentrons.protocol_engine.execution import EquipmentHandler, TaskHandler
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.module_substates import (
    ThermocyclerModuleId,
    ThermocyclerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types.tasks import Task


async def test_set_target_lid_temperature(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should be able to set the specified module's target temperature."""
    subject = SetTargetLidTemperatureImpl(
        state_view=state_view, equipment=equipment, task_handler=real_task_handler
    )

    data = tc_commands.SetTargetLidTemperatureParams(
        moduleId="input-thermocycler-id", celsius=12.3, taskId="taskId"
    )
    tc_commands.SetTargetLidTemperatureResult(
        targetLidTemperature=45.6, taskId="taskId"
    )

    tc_module_substate = decoy.mock(cls=ThermocyclerModuleSubState)
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(
        state_view.modules.get_thermocycler_module_substate("input-thermocycler-id")
    ).then_return(tc_module_substate)

    decoy.when(tc_module_substate.module_id).then_return(
        ThermocyclerModuleId("thermocycler-id")
    )
    decoy.when(model_utils.ensure_id("taskId")).then_return("taskId")

    # Stub temperature validation from hs module view
    decoy.when(tc_module_substate.validate_target_lid_temperature(12.3)).then_return(
        45.6
    )

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

    decoy.verify(await tc_hardware.set_target_lid_temperature(celsius=45.6))
    decoy.verify(await tc_hardware.wait_for_lid_target())
    assert result == SuccessData(
        public=SetTargetLidTemperatureResult(targetLidTemperature=45.6, taskId="taskId")
    )
