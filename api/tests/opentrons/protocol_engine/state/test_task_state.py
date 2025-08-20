"""Tests for TaskState+TaskStore+TaskView trifecta."""
import pytest
from opentrons.protocol_engine.state.tasks import TaskStore, TaskView
from opentrons.protocol_engine.types import Task
from datetime import datetime
import asyncio


@pytest.fixture
def subject() -> TaskStore:
    """Create a TaskStore fixture."""
    return TaskStore()


async def test_get(subject: TaskStore) -> None:
    """It should get a task by ID."""
    task_id = "task-123"
    timestamp = datetime.now()
    asyncio_task = asyncio.create_task(asyncio.sleep(0))
    subject._state.tasks_by_id[task_id] = Task(
        id=task_id,
        createdAt=timestamp,
        finishedAt=None,
        asyncioTask=asyncio_task,
        error=None,
    )

    view = TaskView(subject._state)
    result = view.get(task_id)

    assert result.id == task_id
    assert result.createdAt == timestamp
    assert result.asyncioTask is asyncio_task
    assert result.finishedAt is None
    assert result.error is None
    await asyncio_task


async def test_get_summary(subject: TaskStore) -> None:
    """It should get a summary of all tasks."""
    task_id_1 = "task-123"
    task_id_2 = "task-456"
    timestamp_1 = datetime.now()
    timestamp_2 = datetime.now()
    asyncio_task_1 = asyncio.create_task(asyncio.sleep(0))
    asyncio_task_2 = asyncio.create_task(asyncio.sleep(0))
    subject._state.tasks_by_id[task_id_1] = Task(
        id=task_id_1,
        createdAt=timestamp_1,
        finishedAt=None,
        asyncioTask=asyncio_task_1,
        error=None,
    )
    subject._state.tasks_by_id[task_id_2] = Task(
        id=task_id_2,
        createdAt=timestamp_2,
        finishedAt=None,
        asyncioTask=asyncio_task_2,
        error=None,
    )

    view = TaskView(subject._state)
    summary = view.get_summary()

    assert len(summary) == 2
    assert summary[0].id == task_id_1
    assert summary[0].createdAt == timestamp_1
    assert summary[0].finishedAt is None
    assert summary[0].error is None

    assert summary[1].id == task_id_2
    assert summary[1].createdAt == timestamp_2
    assert summary[1].finishedAt is None
    assert summary[1].error is None
    await asyncio.gather(asyncio_task_1, asyncio_task_2)
