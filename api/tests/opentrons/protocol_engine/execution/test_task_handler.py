"""Task handler."""

import pytest
import asyncio
from datetime import datetime
from decoy import Decoy
from opentrons.protocol_engine.execution.task_handler import TaskHandler
from opentrons.protocol_engine.state.state import (
    StateStore,
)
from opentrons.protocol_engine.resources import (
    ModelUtils,
)


@pytest.fixture
def subject(state_store: StateStore, model_utils: ModelUtils) -> TaskHandler:
    """Get a task handler to test."""
    return TaskHandler(state_store=state_store, model_utils=model_utils)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=ModelUtils)


async def test_create_task(
    subject: TaskHandler, decoy: Decoy, model_utils: ModelUtils
) -> None:
    """Create a task and run it."""
    task_ran = asyncio.Event()

    async def _task(task_handler: TaskHandler) -> None:
        task_ran.set()

    created_timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(created_timestamp)
    task = await subject.create_task(_task)
    await asyncio.wait_for(task_ran.wait(), timeout=0.25)
    await task.asyncioTask
    assert task.createdAt == created_timestamp


async def test_uses_passed_id(
    subject: TaskHandler, decoy: Decoy, model_utils: ModelUtils
) -> None:
    """Should use provided id."""

    async def _task(task_handler: TaskHandler) -> None:
        await asyncio.sleep(0)

    decoy.when(model_utils.ensure_id("testid1")).then_return("checked testid1")
    task = await subject.create_task(_task, id="testid1")
    assert task.id == "checked testid1"


async def test_generates_id(
    subject: TaskHandler, decoy: Decoy, model_utils: ModelUtils
) -> None:
    """It should generate an id if no id is provided."""

    async def _task(task_handler: TaskHandler) -> None:
        await asyncio.sleep(0)

    decoy.when(model_utils.ensure_id(None)).then_return("testid2")
    task = await subject.create_task(_task)
    assert task.id == "testid2"


async def test_synchronization_cancel_latest(subject: TaskHandler) -> None:
    """Test cancel_lastest synchronization."""
    task1_started = asyncio.Event()
    task2_canceled = asyncio.Event()

    async def task_1_method(task_handler: TaskHandler) -> None:
        """First run method that will proceed."""
        async with task_handler.synchronize_cancel_latest("test"):
            task1_started.set()
            await task2_canceled.wait()

    async def task_2_method(task_handler: TaskHandler) -> None:
        """Second run method that will get canceled."""
        await task1_started.wait()
        try:
            async with task_handler.synchronize_cancel_latest("test"):
                await asyncio.sleep(0)
        except asyncio.CancelledError:
            task2_canceled.set()
            raise

    task1 = await subject.create_task(task_1_method)
    task2 = await subject.create_task(task_2_method)
    await asyncio.wait_for(
        asyncio.gather(task1.asyncioTask, task2.asyncioTask, return_exceptions=True),
        timeout=0.25,
    )
    assert task1.asyncioTask.done()
    assert task1.asyncioTask.exception() is None
    assert task2.asyncioTask.done()
    assert task2.asyncioTask.cancelled()


async def test_synchronization_cancel_previous(subject: TaskHandler) -> None:
    """Test cancel_previous synchronization."""
    task1_started = asyncio.Event()
    task1_canceled = asyncio.Event()

    async def task_1_method(task_handler: TaskHandler) -> None:
        """First run method that will get canceled."""
        async with task_handler.synchronize_cancel_previous("test"):
            task1_started.set()
            await task1_canceled.wait()

    async def task_2_method(task_handler: TaskHandler) -> None:
        """Second run method will finish."""
        await task1_started.wait()
        async with task_handler.synchronize_cancel_previous("test"):
            await asyncio.sleep(0)

    task1 = await subject.create_task(task_1_method)
    task2 = await subject.create_task(task_2_method)
    await asyncio.wait_for(
        asyncio.gather(task1.asyncioTask, task2.asyncioTask, return_exceptions=True),
        timeout=0.25,
    )
    assert task2.asyncioTask.done()
    assert task2.asyncioTask.exception() is None
    assert task1.asyncioTask.done()
    assert task1.asyncioTask.cancelled()


async def test_synchronization_sequential(subject: TaskHandler) -> None:
    """Test sequential synchronization."""
    task_queue: "asyncio.Queue[str]" = asyncio.Queue()
    task1_started = asyncio.Event()
    task2_started = asyncio.Event()

    async def task_1_method(task_handler: TaskHandler) -> None:
        """First task will finish first."""
        async with task_handler.synchronize_sequential("test"):
            task_queue.put_nowait("task1started")
            task1_started.set()
            await task2_started.wait()
            task_queue.put_nowait("task1finishedwaiting")
        task_queue.put_nowait("task1finished")

    async def task_3_method() -> None:
        task2_started.set()

    async def task_2_method(task_handler: TaskHandler) -> None:
        """Second task will finish second."""
        await task1_started.wait()
        synchronizer = task_handler.synchronize_sequential("test")
        await asyncio.gather(synchronizer.__aenter__(), task_3_method())
        task_queue.put_nowait("task2started")
        await synchronizer.__aexit__(None, None, None)

    task1 = await subject.create_task(task_1_method)
    task2 = await subject.create_task(task_2_method)
    await asyncio.wait((task1.asyncioTask, task2.asyncioTask), timeout=0.25)
    assert task1.asyncioTask.done()
    assert task2.asyncioTask.done()
    events: list[str] = []
    while not task_queue.empty():
        events.append(task_queue.get_nowait())
    assert events == [
        "task1started",
        "task1finishedwaiting",
        "task2started",
        "task1finished",
    ]


async def test_synchronize_concurrent(subject: TaskHandler) -> None:
    """Test concurrent synchronization."""
    task_queue: "asyncio.Queue[str]" = asyncio.Queue()
    task1_started = asyncio.Event()
    task2_started = asyncio.Event()

    async def task_1_method(task_handler: TaskHandler) -> None:
        """Task 1 starts and doesn't finish until task 2 has started."""
        async with task_handler.synchronize_concurrent("test"):
            task_queue.put_nowait("task1started")
            task1_started.set()
            await task2_started.wait()
        task_queue.put_nowait("task1finished")

    async def task_2_method(task_handler: TaskHandler) -> None:
        """Task 2 starts concurrently with task 1."""
        await task1_started.wait()
        async with task_handler.synchronize_concurrent("test"):
            task_queue.put_nowait("task2started")
            task2_started.set()
        task_queue.put_nowait("task2finished")

    task1 = await subject.create_task(task_1_method)
    task2 = await subject.create_task(task_2_method)
    await asyncio.wait((task1.asyncioTask, task2.asyncioTask), timeout=0.25)
    assert task1.asyncioTask.done()
    assert task2.asyncioTask.done()
    events: list[str] = []
    while not task_queue.empty():
        events.append(task_queue.get_nowait())
    assert set(events) == {
        "task1started",
        "task2started",
        "task1finished",
        "task2finished",
    }
    assert max(events.index("task1started"), events.index("task2started")) < min(
        events.index("task1finished"), events.index("task2finished")
    )
