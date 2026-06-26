"""Test Vacuum Module start set vacuum power command implementation."""

from decoy import Decoy, matchers

from opentrons.hardware_control.modules import VacuumModule
from opentrons.protocol_engine.actions.action_dispatcher import ActionDispatcher
from opentrons.protocol_engine.actions.actions import Action, StartTaskAction
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.start_set_vacuum_power import (
    StartSetVacuumPowerImpl,
)
from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler
from opentrons.protocol_engine.execution.task_handler import TaskHandler
from opentrons.protocol_engine.resources.model_utils import ModelUtils
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.module_substates import (
    VacuumModuleId,
    VacuumModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types.tasks import Task


async def test_start_set_vacuum_power(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should call down to the hardware controller's start_set_vacuum_pressure function."""
    subject = StartSetVacuumPowerImpl(
        state_view=state_view,
        equipment=equipment,
        movement=movement,
        task_handler=real_task_handler,
    )

    duty_cycle = 77

    data = vm_commands.StartSetVacuumPowerParams(
        moduleId="input-vacuum-id", percentPower=duty_cycle, taskId="taskId"
    )
    expected_module_id = VacuumModuleId("vacuum-id")
    expected_result = vm_commands.StartSetVacuumPowerResult(taskId="taskId")

    vm_module_substate = decoy.mock(cls=VacuumModuleSubState)
    vm_hardware = decoy.mock(cls=VacuumModule)

    decoy.when(
        state_view.modules.get_vacuum_module_substate("input-vacuum-id")
    ).then_return(vm_module_substate)
    decoy.when(model_utils.ensure_id("taskId")).then_return("taskId")

    decoy.when(vm_module_substate.module_id).then_return(expected_module_id)

    # Get attached hardware modules
    decoy.when(equipment.get_module_hardware_api(expected_module_id)).then_return(
        vm_hardware
    )
    decoy.when(vm_hardware.pump_running).then_return(True)

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
        await vm_hardware.set_pump_state(
            True,
            duty_cycle=duty_cycle,
            duration_s=None,
            timeout_s=None,
            rate=None,
            vent_after=True,
        )
    )
    expected_state_update = update_types.StateUpdate()
    expected_state_update.update_vacuum_module_pump_engaged("input-vacuum-id", True)

    assert result == SuccessData(
        public=expected_result,
        state_update=expected_state_update,
    )
