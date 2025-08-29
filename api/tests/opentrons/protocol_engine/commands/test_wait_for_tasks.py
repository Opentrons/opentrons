"""Test wait for tasks."""
import asyncio
from datetime import datetime
from decoy import Decoy, matchers
from opentrons.protocol_engine.commands.command import SuccessData

from opentrons.protocol_engine.commands.wait_for_tasks import (
    WaitForTasksParams,
    WaitForTasksResult,
    WaitForTasksImplementation,
)
from opentrons.protocol_engine.types.tasks import Task
from opentrons.protocol_engine.execution.task_handler import TaskHandler
from opentrons.protocol_engine.execution import RunControlHandler
from opentrons.protocol_engine.actions import ActionDispatcher, Action, StartTaskAction
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.state import StateView


async def test_wait_for_tasks_implementation(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    state_view: StateView,
) -> None:
    """It should wait for a list of tasks to complete using the RunControlHandler."""
    subject = WaitForTasksImplementation(
        run_control=run_control, task_handler=real_task_handler, state_view=state_view
    )
    task_ids = ["task1", "task2"]
    created_timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(created_timestamp)
    data = WaitForTasksParams(task_ids=task_ids)
    task: Task | None = None
    task_ran = asyncio.Event()

    def _mock_action(action: Action) -> None:
        nonlocal task
        if isinstance(action, StartTaskAction):
            task = action.task
            task_ran.set()
        else:
            raise RuntimeError("Wrong kind of action.")

    decoy.when(
        action_dispatcher.dispatch(
            StartTaskAction(
                task=Task(
                    id="task1",
                    createdAt=created_timestamp,
                    asyncioTask=matchers.Anything(),
                )
            )
        )
    ).then_do(_mock_action)
    decoy.when(
        action_dispatcher.dispatch(
            StartTaskAction(
                task=Task(
                    id="task2",
                    createdAt=created_timestamp,
                    asyncioTask=matchers.Anything(),
                )
            )
        )
    ).then_do(_mock_action)
    result = await subject.execute(data)
    assert result == SuccessData(public=WaitForTasksResult(task_ids=task_ids))
    # await task_ran.wait()
    # assert task
    # await task.asyncioTask
    # decoy.when(await run_control.wait_for_tasks(matchers.Anything())).then_return(None)
