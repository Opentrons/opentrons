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

    async def _task() -> None:
        task_ran.set()

    created_timestamp = datetime.now()
    decoy.when(model_utils.get_timestamp()).then_return(created_timestamp)
    task = await subject.create_task(_task())
    await asyncio.wait_for(task_ran.wait(), timeout=0.25)
    await task.asyncioTask
    assert task.createdAt == created_timestamp


async def test_uses_passed_id(
    subject: TaskHandler, decoy: Decoy, model_utils: ModelUtils
) -> None:
    """Should use provided id."""
    decoy.when(model_utils.ensure_id("testid1")).then_return("checked testid1")
    task = await subject.create_task(asyncio.sleep(0), id="testid1")
    assert task.id == "checked testid1"


async def test_generates_id(
    subject: TaskHandler, decoy: Decoy, model_utils: ModelUtils
) -> None:
    """It should generate an id if no id is provided."""
    decoy.when(model_utils.ensure_id(None)).then_return("testid2")
    task = await subject.create_task(asyncio.sleep(0))
    assert task.id == "testid2"
