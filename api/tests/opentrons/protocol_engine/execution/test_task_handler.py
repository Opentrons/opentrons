"""Task handler."""

import asyncio
from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.codes import ErrorCodes
from opentrons_shared_data.errors.exceptions import RoboticsInteractionError

from opentrons.protocol_engine.actions import (
    ActionDispatcher,
    FinishTaskAction,
    StartTaskAction,
)
from opentrons.protocol_engine.errors import ErrorOccurrence
from opentrons.protocol_engine.execution.task_handler import TaskHandler
from opentrons.protocol_engine.resources import (
    ModelUtils,
)
from opentrons.protocol_engine.state.state import (
    StateStore,
)
from opentrons.protocol_engine.types import Task


@pytest.fixture
def subject(
    state_store: StateStore,
    model_utils: ModelUtils,
    action_dispatcher: ActionDispatcher,
) -> TaskHandler:
    """Get a task handler to test."""
    return TaskHandler(
        state_store=state_store,
        model_utils=model_utils,
        action_dispatcher=action_dispatcher,
    )


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=ModelUtils)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mock action dispatcher."""
    return decoy.mock(cls=ActionDispatcher)


async def test_create_task(
    subject: TaskHandler,
    decoy: Decoy,
    model_utils: ModelUtils,
    action_dispatcher: ActionDispatcher,
) -> None:
    """Create a task and run it."""
    task_ran = asyncio.Event()

    async def _task(task_handler: TaskHandler) -> None:
        task_ran.set()

    created_timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(created_timestamp)
    decoy.when(model_utils.ensure_id(None)).then_return("create_timestamp")

    task = await subject.create_task(_task)
    await asyncio.wait_for(task_ran.wait(), timeout=0.25)
    await task.asyncioTask
    await asyncio.sleep(0.25)
    assert task.createdAt == created_timestamp
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task=task)),
        action_dispatcher.dispatch(
            FinishTaskAction(
                task_id=matchers.Anything(), finished_at=matchers.Anything(), error=None
            )
        ),
        times=1,
    )


async def test_uses_passed_id(
    subject: TaskHandler,
    decoy: Decoy,
    model_utils: ModelUtils,
    action_dispatcher: ActionDispatcher,
) -> None:
    """Should use provided id."""

    async def _task(task_handler: TaskHandler) -> None:
        await asyncio.sleep(0)

    finished_at = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(finished_at)
    decoy.when(model_utils.ensure_id("testid1")).then_return("checked testid1")
    task = await subject.create_task(_task, id="testid1")
    assert task.id == "checked testid1"
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task)),
        times=1,
    )
    await task.asyncioTask
    decoy.verify(
        action_dispatcher.dispatch(
            FinishTaskAction(
                task_id="checked testid1", finished_at=finished_at, error=None
            )
        ),
        times=1,
    )


async def test_generates_id(
    subject: TaskHandler,
    decoy: Decoy,
    model_utils: ModelUtils,
    action_dispatcher: ActionDispatcher,
) -> None:
    """It should generate an id if no id is provided."""

    async def _task(task_handler: TaskHandler) -> None:
        await asyncio.sleep(0)

    finished_at = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(finished_at)
    decoy.when(model_utils.ensure_id(None)).then_return("testid2")
    task = await subject.create_task(_task)
    assert task.id == "testid2"
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task)),
        times=1,
    )
    await task.asyncioTask
    decoy.verify(
        action_dispatcher.dispatch(
            FinishTaskAction(task_id="testid2", finished_at=finished_at, error=None)
        ),
        times=1,
    )


async def test_generates_error(
    subject: TaskHandler,
    decoy: Decoy,
    model_utils: ModelUtils,
    action_dispatcher: ActionDispatcher,
) -> None:
    """It should generate an error."""

    async def _task(task_handler: TaskHandler) -> None:
        await asyncio.Event().wait()

    finished_at = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(finished_at)
    decoy.when(model_utils.generate_id()).then_return("errorid")
    decoy.when(model_utils.ensure_id(None)).then_return("testid2")
    task = await subject.create_task(_task)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task)),
        times=1,
    )
    task.asyncioTask.cancel(msg="hello")
    try:
        await asyncio.wait_for(task.asyncioTask, timeout=0.25)
    except asyncio.CancelledError:
        pass
    decoy.verify(
        action_dispatcher.dispatch(
            FinishTaskAction(
                task_id="testid2",
                finished_at=finished_at,
                error=ErrorOccurrence.model_construct(
                    id="errorid",
                    createdAt=finished_at,
                    isDefined=False,
                    errorType=matchers.Anything(),
                    errorCode=ErrorCodes.GENERAL_ERROR.value.code,
                    detail=matchers.Anything(),
                    errorInfo=matchers.Anything(),
                    wrappedErrors=matchers.Anything(),
                ),
            )
        ),
        times=1,
    )


async def test_generates_enumerated_error(
    subject: TaskHandler,
    decoy: Decoy,
    model_utils: ModelUtils,
    action_dispatcher: ActionDispatcher,
) -> None:
    """It should generate an enumerated error."""

    async def _task(task_handler: TaskHandler) -> None:
        raise RoboticsInteractionError()

    finished_at = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(finished_at)
    decoy.when(model_utils.generate_id()).then_return("errorid")
    decoy.when(model_utils.ensure_id(None)).then_return("testid2")
    task = await subject.create_task(_task)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task)),
        times=1,
    )
    try:
        await asyncio.wait_for(task.asyncioTask, timeout=0.25)
    except (asyncio.CancelledError, RoboticsInteractionError):
        pass
    decoy.verify(
        action_dispatcher.dispatch(
            FinishTaskAction(
                task_id="testid2",
                finished_at=finished_at,
                error=ErrorOccurrence.model_construct(
                    id="errorid",
                    createdAt=finished_at,
                    isDefined=False,
                    errorType=matchers.Anything(),
                    errorCode=ErrorCodes.ROBOTICS_INTERACTION_ERROR.value.code,
                    detail=matchers.Anything(),
                    errorInfo=matchers.Anything(),
                    wrappedErrors=matchers.Anything(),
                ),
            )
        ),
        times=1,
    )


async def test_generates_cancelled_error(
    subject: TaskHandler,
    decoy: Decoy,
    model_utils: ModelUtils,
    action_dispatcher: ActionDispatcher,
) -> None:
    """It should generate an cancelled error."""

    async def _task(task_handler: TaskHandler) -> None:
        await asyncio.Event().wait()

    finished_at = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(finished_at)
    decoy.when(model_utils.generate_id()).then_return("errorid")
    decoy.when(model_utils.ensure_id(None)).then_return("testid2")
    task = await subject.create_task(_task)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task)),
        times=1,
    )
    task.asyncioTask.cancel(msg="Cancel task")
    try:
        await asyncio.wait_for(task.asyncioTask, timeout=0.25)
    except asyncio.CancelledError:
        pass
    decoy.verify(
        action_dispatcher.dispatch(
            FinishTaskAction(
                task_id="testid2",
                finished_at=finished_at,
                error=ErrorOccurrence.model_construct(
                    id="errorid",
                    createdAt=finished_at,
                    isDefined=False,
                    errorType=matchers.Anything(),
                    errorCode=ErrorCodes.GENERAL_ERROR.value.code,
                    detail=matchers.StringMatching(r"(CancelledError)|(Cancel Task)"),
                    errorInfo=matchers.Anything(),
                    wrappedErrors=matchers.Anything(),
                ),
            )
        ),
        times=1,
    )


async def test_synchronization_cancel_latest(
    subject: TaskHandler, decoy: Decoy, action_dispatcher: ActionDispatcher
) -> None:
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
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task1)),
        times=1,
    )
    task2 = await subject.create_task(task_2_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task2)),
        times=1,
    )
    await asyncio.wait_for(
        asyncio.gather(task1.asyncioTask, task2.asyncioTask, return_exceptions=True),
        timeout=1,
    )
    assert task1.asyncioTask.done()
    assert task1.asyncioTask.exception() is None
    assert task2.asyncioTask.done()
    assert task2.asyncioTask.cancelled()


async def test_synchronization_cancel_latest_only_cancels_one_group_id(
    subject: TaskHandler, decoy: Decoy, action_dispatcher: ActionDispatcher
) -> None:
    """Tests cancel_latest synchronization only affects the specified group id."""
    group_id1 = "groupid1"
    group_id2 = "groupid2"

    task1_started = asyncio.Event()
    task2_started = asyncio.Event()
    task3_started = asyncio.Event()

    async def task_1_method(task_handler: TaskHandler) -> None:
        """First run method should proceed (task2 gets cancelled)."""
        async with task_handler.synchronize_cancel_latest(group_id1):
            task1_started.set()
            await asyncio.sleep(0.25)

    async def task_2_method(task_handler: TaskHandler) -> None:
        """Second run method will be canceled (latest)."""
        await task1_started.wait()
        try:
            async with task_handler.synchronize_cancel_latest(group_id1):
                task2_started.set()
                await asyncio.sleep(0.1)
        except asyncio.CancelledError:
            task2_started.set()
            raise

    async def task_3_method(task_handler: TaskHandler) -> None:
        """Third run method (different group) should still be running."""
        async with task_handler.synchronize_cancel_latest(group_id2):
            task3_started.set()
            await asyncio.sleep(0.25)

    task1 = await subject.create_task(task_1_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task1)),
        times=1,
    )
    task3 = await subject.create_task(task_3_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task3)),
        times=1,
    )
    await task1_started.wait()
    await task3_started.wait()

    task2 = await subject.create_task(task_2_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task2)),
        times=1,
    )
    await task2_started.wait()

    assert not task1.asyncioTask.cancelled()
    assert task2.asyncioTask.cancelled()
    assert not task3.asyncioTask.cancelled()
    assert not task3.asyncioTask.done()


async def test_synchronization_cancel_previous(
    subject: TaskHandler, decoy: Decoy, action_dispatcher: ActionDispatcher
) -> None:
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
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task1)),
        times=1,
    )
    task2 = await subject.create_task(task_2_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task2)),
        times=1,
    )
    await asyncio.wait_for(
        asyncio.gather(task1.asyncioTask, task2.asyncioTask, return_exceptions=True),
        timeout=0.25,
    )
    assert task2.asyncioTask.done()
    assert task2.asyncioTask.exception() is None
    assert task1.asyncioTask.done()
    assert task1.asyncioTask.cancelled()


async def test_synchronization_cancel_previous_only_cancels_one_group_id(
    subject: TaskHandler, decoy: Decoy, action_dispatcher: ActionDispatcher
) -> None:
    """Tests cancel_previous synchronization only affects the specified group id."""
    group_id1 = "groupid1"
    group_id2 = "groupid2"

    task1_started = asyncio.Event()
    task2_started = asyncio.Event()
    task3_started = asyncio.Event()

    async def task_1_method(task_handler: TaskHandler) -> None:
        """First run method that will get canceled."""
        async with task_handler.synchronize_cancel_previous(group_id1):
            task1_started.set()
            try:
                await asyncio.sleep(0)
            except asyncio.CancelledError:
                raise

    async def task_2_method(task_handler: TaskHandler) -> None:
        """Second run method will finish."""
        async with task_handler.synchronize_cancel_previous(group_id1):
            task2_started.set()

    async def task_3_method(task_handler: TaskHandler) -> None:
        """Third run method should still be running."""
        async with task_handler.synchronize_cancel_previous(group_id2):
            task3_started.set()
            await asyncio.sleep(0.25)

    task1 = await subject.create_task(task_1_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task1)),
        times=1,
    )
    task3 = await subject.create_task(task_3_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task3)),
        times=1,
    )
    await task1_started.wait()
    await task3_started.wait()
    task2 = asyncio.create_task(task_2_method(subject))
    await task2_started.wait()

    assert task1.asyncioTask.cancelled() or task1.asyncioTask.done()
    assert not task2.cancelled()
    assert not task3.asyncioTask.cancelled()
    assert not task3.asyncioTask.done()


async def test_synchronization_sequential(
    subject: TaskHandler, decoy: Decoy, action_dispatcher: ActionDispatcher
) -> None:
    """Test sequential synchronization."""
    task_queue: "asyncio.Queue[str]" = asyncio.Queue()
    task1_started = asyncio.Event()
    task2_started = asyncio.Event()

    async def task_1_method(task_handler: TaskHandler) -> None:
        """First task will finish first."""
        async with task_handler.synchronize_sequential("test"):
            task_queue.put_nowait("task1started")
            task1_started.set()
            task_queue.put_nowait("task1finishedwaiting")
            await task2_started.wait()
            task_queue.put_nowait("task1finished")

    async def task_3_method() -> None:
        task2_started.set()
        task_queue.put_nowait("task2started")

    async def task_2_method(task_handler: TaskHandler) -> None:
        """Second task will finish second."""
        await task1_started.wait()
        synchronizer = task_handler.synchronize_sequential("test")
        await asyncio.gather(synchronizer.__aenter__(), task_3_method())
        await synchronizer.__aexit__(None, None, None)

    task1 = await subject.create_task(task_1_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task1)),
        times=1,
    )
    task2 = await subject.create_task(task_2_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task2)),
        times=1,
    )
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


async def test_synchronize_concurrent(
    subject: TaskHandler, decoy: Decoy, action_dispatcher: ActionDispatcher
) -> None:
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
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task1)),
        times=1,
    )
    task2 = await subject.create_task(task_2_method)
    decoy.verify(
        action_dispatcher.dispatch(StartTaskAction(task2)),
        times=1,
    )
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


async def test_cancel_all(
    subject: TaskHandler, decoy: Decoy, state_store: StateStore
) -> None:
    """Test cancel all."""
    mock_tasks = [decoy.mock(cls=Task) for i in range(3)]
    decoy.when(state_store.tasks.get_all_current()).then_return(mock_tasks)
    subject.cancel_all("cancel all")
    for task in mock_tasks:
        decoy.verify(task.asyncioTask.cancel(msg="cancel all"))
