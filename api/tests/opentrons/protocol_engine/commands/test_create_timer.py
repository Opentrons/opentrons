"""Test create timer command."""

import asyncio
from datetime import datetime

from decoy import Decoy, matchers

from opentrons.protocol_engine.actions import Action, ActionDispatcher, StartTaskAction
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.create_timer import (
    CreateTimerImplementation,
    CreateTimerParams,
    CreateTimerResult,
)
from opentrons.protocol_engine.execution import RunControlHandler
from opentrons.protocol_engine.execution.task_handler import TaskHandler
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.types.tasks import Task


async def test_create_timer_implementation(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
) -> None:
    """It should create a task to await the duration using the RunControlHandler."""
    subject = CreateTimerImplementation(
        run_control=run_control,
        task_handler=real_task_handler,
    )
    data = CreateTimerParams(time=42.0, task_id="taskid")
    created_timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(created_timestamp)
    decoy.when(model_utils.ensure_id("taskid")).then_return("taskid")
    task_ran = asyncio.Event()
    task: Task | None = None

    def _mock_action(action: Action) -> None:
        nonlocal task
        if isinstance(action, StartTaskAction):
            task = action.task
            task_ran.set()
        else:
            raise RuntimeError("Wrong kind of action.")

    decoy.when(
        action_dispatcher.dispatch(  # type: ignore[func-returns-value]
            StartTaskAction(
                task=Task(
                    id="taskid",
                    createdAt=created_timestamp,
                    asyncioTask=matchers.Anything(),
                )
            )
        )
    ).then_do(_mock_action)
    result = await subject.execute(data)
    assert result == SuccessData(public=CreateTimerResult(task_id="taskid", time=42.0))
    await task_ran.wait()
    assert task
    await task.asyncioTask
    decoy.verify(await run_control.wait_for_duration(seconds=42.0))
