"""Tests for TaskQueue."""
import pytest
import asyncio
from typing import Any
from opentrons.protocol_runner.task_queue import TaskQueue, TaskQueuePhase


async def test_is_started() -> None:
    """It should report if the task queue has been started."""
    subject = TaskQueue()

    assert subject.is_started() is False
    subject.start()
    assert subject.is_started() is True


async def test_add_run_task() -> None:
    """It should be able to add a task for the "run" phase."""
    run_result = False

    async def run_task() -> None:
        nonlocal run_result
        run_result = True

    subject = TaskQueue()
    subject.add(phase=TaskQueuePhase.RUN, func=run_task)
    subject.start()
    await subject.join()

    assert run_result is True


async def test_add_cleanup_task() -> None:
    """It should be able to add a task for the "cleanup" phase."""
    cleanup_result = False

    async def cleanup_task() -> None:
        nonlocal cleanup_result
        cleanup_result = True

    subject = TaskQueue()
    subject.add(phase=TaskQueuePhase.CLEANUP, func=cleanup_task)
    subject.start()
    await subject.join()

    assert cleanup_result is True


async def test_passes_args() -> None:
    """It should be able to add a task for the "cleanup" phase."""
    run_args = None
    cleanup_args = None

    async def run_task(*args: Any, **kwargs: Any) -> None:
        nonlocal run_args
        run_args = (args, kwargs)

    async def cleanup_task(*args: Any, **kwargs: Any) -> None:
        nonlocal cleanup_args
        cleanup_args = (args, kwargs)

    subject = TaskQueue()
    subject.add(TaskQueuePhase.RUN, run_task, 1, 2, hello="world")
    subject.add(TaskQueuePhase.CLEANUP, cleanup_task, "a", "b", fizz="buzz")
    subject.start()
    await subject.join()

    assert run_args == ((1, 2), {"hello": "world"})
    assert cleanup_args == (("a", "b"), {"fizz": "buzz"})


async def test_cleanup_always_runs() -> None:
    """It should be able to add a task for the "cleanup" phase."""
    cleanup_result = False

    async def run_task() -> None:
        raise RuntimeError("oh no")

    async def cleanup_task() -> None:
        nonlocal cleanup_result
        cleanup_result = True

    subject = TaskQueue()
    subject.add(TaskQueuePhase.RUN, func=run_task)
    subject.add(TaskQueuePhase.CLEANUP, func=cleanup_task)
    subject.start()

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.join()

    assert cleanup_result is True


async def test_join_waits_for_start() -> None:
    """It should wait until the queue is started when join is called."""
    subject = TaskQueue()
    join_task = asyncio.create_task(subject.join())

    await asyncio.sleep(0)
    assert join_task.done() is False

    subject.start()
    await join_task
