"""Test wait for tasks."""

from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.actions import ActionDispatcher
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.wait_for_tasks import (
    WaitForTasksImplementation,
    WaitForTasksParams,
    WaitForTasksResult,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.errors.exceptions import TaskFailedError
from opentrons.protocol_engine.execution import RunControlHandler
from opentrons.protocol_engine.execution.task_handler import TaskHandler
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types.tasks import FinishedTask, Task


async def test_wait_for_tasks_implementation_no_error(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    state_view: StateView,
) -> None:
    """It should wait for a list of tasks to complete using the RunControlHandler.

    No tasks have errors so NO exception should be raised.
    """
    subject = WaitForTasksImplementation(
        run_control=run_control, task_handler=real_task_handler, state_view=state_view
    )
    # Tasks to wait for
    task_ids = ["task1", "task2"]
    data = WaitForTasksParams(task_ids=task_ids)

    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return([])
    result = await subject.execute(data)
    for task in task_ids:
        fake_task = decoy.mock(cls=Task)
        decoy.when(state_view.tasks.get(task)).then_return(fake_task)

    decoy.verify(await run_control.wait_for_tasks(task_ids))
    assert result == SuccessData(public=WaitForTasksResult(task_ids=task_ids))


async def test_wait_for_tasks_implementation_with_error(
    decoy: Decoy,
    run_control: RunControlHandler,
    real_task_handler: TaskHandler,
    action_dispatcher: ActionDispatcher,
    model_utils: ModelUtils,
    state_view: StateView,
) -> None:
    """It should wait for a list of tasks to complete using the RunControlHandler.

    One task fails with a TaskFailedError so an exception SHOULD be raised.
    """
    subject = WaitForTasksImplementation(
        run_control=run_control, task_handler=real_task_handler, state_view=state_view
    )
    task_ids = ["task1", "task2"]
    data = WaitForTasksParams(task_ids=task_ids)
    created_timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(created_timestamp)
    decoy.when(state_view.tasks.get_failed_tasks(task_ids)).then_return([task_ids[0]])
    decoy.when(state_view.tasks.get_finished(task_ids[0])).then_return(
        FinishedTask(
            id=task_ids[0],
            createdAt=matchers.Anything(),
            finishedAt=matchers.Anything(),
            error=ErrorOccurrence(
                id="error",
                createdAt=created_timestamp,
                errorType="TaskFailedError",
                detail="detail",
            ),
        )
    )

    with pytest.raises(TaskFailedError) as exc_info:
        await subject.execute(data)

    err = exc_info.value
    assert isinstance(err, TaskFailedError)
    assert err.message == "1 tasks failed."

    for task in task_ids:
        fake_task = decoy.mock(cls=Task)
        decoy.when(state_view.tasks.get(task)).then_return(fake_task)
    decoy.verify(await run_control.wait_for_tasks(task_ids))
