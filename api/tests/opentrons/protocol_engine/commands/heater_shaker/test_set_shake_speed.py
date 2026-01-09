"""Test Heater Shaker set shake speed command implementation."""

import pytest
from decoy import Decoy, matchers

from opentrons.hardware_control.modules import HeaterShaker
from opentrons.protocol_engine.actions import Action, ActionDispatcher, StartTaskAction
from opentrons.protocol_engine.commands import heater_shaker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.heater_shaker.set_shake_speed import (
    SetShakeSpeedImpl,
)
from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    MovementHandler,
    TaskHandler,
)
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.module_substates import (
    HeaterShakerModuleId,
    HeaterShakerModuleSubState,
)
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import MotorAxis
from opentrons.protocol_engine.types.tasks import Task


@pytest.mark.parametrize(
    ("pipette_blocking_hs_shaker", "expect_pipette_retracted"),
    [
        (False, False),
        (True, True),
    ],
)
async def test_set_shake_speed(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    movement: MovementHandler,
    pipette_blocking_hs_shaker: bool,
    expect_pipette_retracted: bool,
) -> None:
    """It should be able to set the module's shake speed."""
    subject = SetShakeSpeedImpl(
        state_view=state_view,
        equipment=equipment,
        movement=movement,
        task_handler=real_task_handler,
    )
    data = heater_shaker.SetShakeSpeedParams(
        moduleId="input-heater-shaker-id", rpm=1234.56, taskId="taskId"
    )

    hs_module_substate = decoy.mock(cls=HeaterShakerModuleSubState)
    hs_hardware = decoy.mock(cls=HeaterShaker)

    decoy.when(
        state_view.modules.get_heater_shaker_module_substate(
            module_id="input-heater-shaker-id"
        )
    ).then_return(hs_module_substate)

    decoy.when(hs_module_substate.module_id).then_return(
        HeaterShakerModuleId("heater-shaker-id")
    )
    decoy.when(model_utils.ensure_id("taskId")).then_return("taskId")
    decoy.when(
        state_view.motion.check_pipette_blocking_hs_shaker(
            HeaterShakerModuleId("heater-shaker-id")
        )
    ).then_return(pipette_blocking_hs_shaker)

    # Stub speed validation from hs module view
    decoy.when(hs_module_substate.validate_target_speed(rpm=1234.56)).then_return(1234)

    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(hs_hardware)
    decoy.when(state_view.motion.get_robot_mount_axes()).then_return(
        [MotorAxis.EXTENSION_Z]
    )
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

    decoy.verify(hs_module_substate.raise_if_labware_latch_not_closed())
    if expect_pipette_retracted:
        decoy.verify(await movement.home([MotorAxis.EXTENSION_Z]))
    decoy.verify(await hs_hardware.set_speed(rpm=1234))

    assert result == SuccessData(
        public=heater_shaker.SetShakeSpeedResult(
            pipetteRetracted=expect_pipette_retracted, taskId="taskId"
        ),
        state_update=(
            update_types.StateUpdate(pipette_location=update_types.CLEAR)
            if expect_pipette_retracted
            else update_types.StateUpdate()
        ),
    )
