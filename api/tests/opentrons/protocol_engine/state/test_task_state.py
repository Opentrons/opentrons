"""Tests for TaskState+TaskStore+TaskView trifecta."""

import asyncio
from datetime import datetime

import pytest

from opentrons.protocol_engine.actions.actions import (
    FinishTaskAction,
    StartTaskAction,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.state.tasks import TaskStore, TaskView
from opentrons.protocol_engine.types import FinishedTask, Task


@pytest.fixture
def subject() -> TaskStore:
    """Create a TaskStore fixture."""
    return TaskStore()


async def test_get_current(subject: TaskStore) -> None:
    """It should get a current task by ID."""
    task_id = "task-123"
    timestamp = datetime.now()
    asyncio_task = asyncio.create_task(asyncio.sleep(0))
    subject._state.current_tasks_by_id[task_id] = Task(
        id=task_id,
        createdAt=timestamp,
        asyncioTask=asyncio_task,
    )

    view = TaskView(subject._state)
    result = view.get_current(task_id)

    assert isinstance(result, Task)
    assert result.id == task_id
    assert result.createdAt == timestamp
    assert result.asyncioTask is asyncio_task
    await asyncio_task


async def test_get_finished(subject: TaskStore) -> None:
    """It should get a finished task by ID."""
    task_id = "task-123"
    timestamp = datetime.now()
    timestamp2 = datetime.now()
    error = None
    asyncio_task = asyncio.create_task(asyncio.sleep(0))

    subject._state.finished_tasks_by_id[task_id] = FinishedTask(
        id=task_id, createdAt=timestamp, finishedAt=timestamp2, error=error
    )

    view = TaskView(subject._state)
    result = view.get_finished(task_id)

    assert isinstance(result, FinishedTask)
    assert result.id == task_id
    assert result.createdAt == timestamp
    assert result.finishedAt == timestamp2
    assert result.error == error
    await asyncio_task


async def test_get(subject: TaskStore) -> None:
    """It should get all tasks (finished and current)."""
    task_id_current = "task-current"
    timestamp = datetime.now()
    asyncio_task_1 = asyncio.create_task(asyncio.sleep(0))
    subject._state.current_tasks_by_id[task_id_current] = Task(
        id=task_id_current,
        createdAt=timestamp,
        asyncioTask=asyncio_task_1,
    )

    task_id_finished = "task-finished"
    timestamp2 = datetime.now()
    timestamp3 = datetime.now()
    error = None
    subject._state.finished_tasks_by_id[task_id_finished] = FinishedTask(
        id=task_id_finished, createdAt=timestamp2, finishedAt=timestamp3, error=error
    )
    view = TaskView(subject._state)
    # Check current task
    result = view.get("task-current")
    assert isinstance(result, Task)
    assert result.id == task_id_current
    assert result.createdAt == timestamp
    assert result.asyncioTask is asyncio_task_1
    await asyncio_task_1
    # Check finished task
    result_finished = view.get("task-finished")
    assert isinstance(result_finished, FinishedTask)
    assert result_finished.id == task_id_finished
    assert result_finished.createdAt == timestamp2
    assert result_finished.finishedAt == timestamp3
    assert result_finished.error == error


async def test_get_summary(subject: TaskStore) -> None:
    """It should get a summary of all tasks."""
    task_id_1 = "task-123"
    task_id_2 = "task-456"
    task_id_3 = "task-789"
    timestamp_1 = datetime.now()
    timestamp_2 = datetime.now()
    timestamp_3 = datetime.now()
    timestamp_4 = datetime.now()
    asyncio_task_1 = asyncio.create_task(asyncio.sleep(0))
    asyncio_task_2 = asyncio.create_task(asyncio.sleep(0))

    subject._state.current_tasks_by_id[task_id_1] = Task(
        id=task_id_1,
        createdAt=timestamp_1,
        asyncioTask=asyncio_task_1,
    )
    subject._state.current_tasks_by_id[task_id_2] = Task(
        id=task_id_2,
        createdAt=timestamp_2,
        asyncioTask=asyncio_task_2,
    )
    subject._state.finished_tasks_by_id[task_id_3] = FinishedTask(
        id=task_id_1,
        createdAt=timestamp_3,
        finishedAt=timestamp_4,
        error=None,
    )

    view = TaskView(subject._state)
    summary = view.get_summary()

    assert len(summary) == 3
    assert summary[0].id == task_id_1
    assert summary[0].createdAt == timestamp_1
    assert summary[0].finishedAt is None
    assert summary[0].error is None

    assert summary[1].id == task_id_2
    assert summary[1].createdAt == timestamp_2
    assert summary[1].finishedAt is None
    assert summary[1].error is None

    assert summary[2].id == task_id_3
    assert summary[2].createdAt == timestamp_3
    assert summary[2].finishedAt is timestamp_4
    assert summary[2].error is None

    await asyncio.gather(asyncio_task_1, asyncio_task_2)


async def test_handle_start_task_action(subject: TaskStore) -> None:
    """It should store data about a start task action."""
    timestamp_1 = datetime.now()
    task_id_1 = "task123"
    asyncio_task_1 = asyncio.create_task(asyncio.sleep(0))
    await asyncio.gather(asyncio_task_1)

    action_started = StartTaskAction(
        task=Task(
            id=task_id_1,
            createdAt=timestamp_1,
            asyncioTask=asyncio_task_1,
        )
    )
    subject.handle_action(action_started)
    task = subject._state.current_tasks_by_id[task_id_1]
    assert task.id == task_id_1
    assert task.createdAt == timestamp_1
    assert task.asyncioTask == asyncio_task_1


async def test_handle_finish_task_action(subject: TaskStore) -> None:
    """It should store data about a finish task action."""
    timestamp_1 = datetime.now()
    timestamp_2 = datetime.now()
    task_id_1 = "task123"
    asyncio_task_1 = asyncio.create_task(asyncio.sleep(0))
    await asyncio.gather(asyncio_task_1)

    action_started = StartTaskAction(
        task=Task(
            id=task_id_1,
            createdAt=timestamp_1,
            asyncioTask=asyncio_task_1,
        )
    )
    subject.handle_action(action_started)
    assert task_id_1 in subject._state.current_tasks_by_id
    action_finished = FinishTaskAction(
        task_id=task_id_1, finished_at=timestamp_2, error=None
    )
    subject.handle_action(action_finished)
    task_finished = subject._state.finished_tasks_by_id[task_id_1]
    assert isinstance(task_finished, FinishedTask)
    assert task_finished.id == task_id_1
    assert task_finished.createdAt == timestamp_1
    assert task_finished.finishedAt == timestamp_2
    assert task_finished.error is None
    assert task_id_1 not in subject._state.current_tasks_by_id


async def test_all_tasks_finished_or_any_task_failed(subject: TaskStore) -> None:
    """It should return false if there are no finished tasks and true if there are."""
    # Returns False because only task is current
    task_id_current = "task-current"
    timestamp = datetime.now()
    asyncio_task = asyncio.create_task(asyncio.sleep(0))
    subject._state.current_tasks_by_id[task_id_current] = Task(
        id=task_id_current,
        createdAt=timestamp,
        asyncioTask=asyncio_task,
    )
    view = TaskView(subject._state)
    result = view.all_tasks_finished_or_any_task_failed(task_id_current)
    assert result is False
    await asyncio_task
    # returns true because task is finished
    task_id_finished = "task-finished"
    timestamp2 = datetime.now()
    timestamp3 = datetime.now()
    error = None
    asyncio_task = asyncio.create_task(asyncio.sleep(0))

    subject._state.finished_tasks_by_id[task_id_finished] = FinishedTask(
        id=task_id_finished, createdAt=timestamp2, finishedAt=timestamp3, error=error
    )
    view = TaskView(subject._state)
    result = view.all_tasks_finished_or_any_task_failed({task_id_finished})
    assert result

    # returns true because 1 task has error
    subject._state.finished_tasks_by_id[task_id_finished] = FinishedTask(
        id=task_id_finished, createdAt=timestamp2, finishedAt=timestamp3, error=error
    )
    task_id_error = "task-error"
    timestamp2 = datetime.now()
    timestamp3 = datetime.now()
    error = ErrorOccurrence(
        id="error",
        createdAt=datetime.now(),
        errorType="TaskFailedError",
        detail="detail",
    )
    asyncio_task = asyncio.create_task(asyncio.sleep(0))

    subject._state.finished_tasks_by_id[task_id_error] = FinishedTask(
        id=task_id_error, createdAt=timestamp2, finishedAt=timestamp3, error=error
    )

    view = TaskView(subject._state)
    result = view.all_tasks_finished_or_any_task_failed(
        {task_id_finished, task_id_error}
    )
    assert result


def test_get_failed_tasks(subject: TaskStore) -> None:
    """It should return a list of failed tasks."""
    task_id_error = "task-error"
    timestamp2 = datetime.now()
    timestamp3 = datetime.now()
    error = ErrorOccurrence(
        id="error",
        createdAt=datetime.now(),
        errorType="TaskFailedError",
        detail="detail",
    )
    subject._state.finished_tasks_by_id[task_id_error] = FinishedTask(
        id=task_id_error, createdAt=timestamp2, finishedAt=timestamp3, error=error
    )
    task_id_error_2 = "task-error-2"
    timestamp2 = datetime.now()
    timestamp3 = datetime.now()
    error = ErrorOccurrence(
        id="error",
        createdAt=datetime.now(),
        errorType="TaskFailedError",
        detail="detail",
    )
    subject._state.finished_tasks_by_id[task_id_error_2] = FinishedTask(
        id=task_id_error_2, createdAt=timestamp2, finishedAt=timestamp3, error=error
    )
    view = TaskView(subject._state)
    result = view.get_failed_tasks({task_id_error})

    assert len(result) == 1
    assert result[0] == task_id_error
