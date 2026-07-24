"""Test Vacuum Module start set vacuum command implementation."""

from decoy import Decoy, matchers

from opentrons.hardware_control.modules import VacuumModule
from opentrons.protocol_engine.actions.action_dispatcher import ActionDispatcher
from opentrons.protocol_engine.actions.actions import Action, StartTaskAction
from opentrons.protocol_engine.commands import vacuum_module as vm_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.vacuum_module.start_set_vacuum_pressure import (
    StartSetVacuumPressureImpl,
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


async def test_start_set_vacuum_presure(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should call down to the hardware controller's start_set_vacuum_pressure function."""
    subject = StartSetVacuumPressureImpl(
        state_view=state_view,
        equipment=equipment,
        movement=movement,
        task_handler=real_task_handler,
        model_utils=model_utils,
    )

    gauge_pressure = -444.0
    pressure_rate = 5.5
    duration_s = 100
    timeout_s = 60

    data = vm_commands.StartSetVacuumPressureParams(
        moduleId="input-vacuum-id",
        gaugePressure=gauge_pressure,
        duration=duration_s,
        rate=pressure_rate,
        timeout=timeout_s,
        taskId="taskId",
    )
    expected_module_id = VacuumModuleId("vacuum-id")
    expected_result = vm_commands.StartSetVacuumPressureResult(taskId="taskId")

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
    decoy.when(vm_hardware.pump_running).then_return(False)

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
        await vm_hardware.set_vacuum_state(
            True,
            gauge_pressure,
            duration_s,
            rate=pressure_rate,
            timeout_s=timeout_s,
            vent_after=True,
        )
    )

    expected_state_update = update_types.StateUpdate()
    expected_state_update.update_vacuum_module_pump_engaged("input-vacuum-id", False)

    assert result == SuccessData(
        public=expected_result,
        state_update=expected_state_update,
    )


async def test_start_set_vacuum_pressure_waits_to_equalize(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should wait for pressure equalization when equalizeTimeout is set."""
    subject = StartSetVacuumPressureImpl(
        state_view=state_view,
        equipment=equipment,
        movement=movement,
        task_handler=real_task_handler,
        model_utils=model_utils,
    )

    data = vm_commands.StartSetVacuumPressureParams(
        moduleId="input-vacuum-id",
        gaugePressure=-444.0,
        duration=10,
        equalizeTimeout=30,
        taskId="taskId",
    )
    expected_module_id = VacuumModuleId("vacuum-id")

    vm_module_substate = decoy.mock(cls=VacuumModuleSubState)
    vm_hardware = decoy.mock(cls=VacuumModule)

    decoy.when(
        state_view.modules.get_vacuum_module_substate("input-vacuum-id")
    ).then_return(vm_module_substate)
    decoy.when(model_utils.ensure_id("taskId")).then_return("taskId")
    decoy.when(vm_module_substate.module_id).then_return(expected_module_id)
    decoy.when(equipment.get_module_hardware_api(expected_module_id)).then_return(
        vm_hardware
    )
    decoy.when(vm_hardware.pump_running).then_return(False)

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
        await vm_hardware.wait_for_pressure_equalization(30),
        times=1,
    )
    assert result.public.taskId == "taskId"
