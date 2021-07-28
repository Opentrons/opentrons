"""Tests for the command QueueWorker in opentrons.protocol_engine."""
import asyncio
import pytest
from decoy import Decoy, matchers
from typing import Any, AsyncIterable

from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.execution import CommandExecutor, QueueWorker


class BreakLoopError(Exception):
    """An exception to break out of the worker's wait-for-new-command loop."""

    pass


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def command_executor(decoy: Decoy) -> CommandExecutor:
    """Get a mocked out CommandExecutor."""
    return decoy.mock(cls=CommandExecutor)


@pytest.fixture
async def subject(
    state_store: StateStore,
    command_executor: CommandExecutor,
) -> AsyncIterable[QueueWorker]:
    """Get a QueueWorker instance."""
    subject = QueueWorker(state_store=state_store, command_executor=command_executor)
    yield subject

    try:
        await subject.stop()
    except BreakLoopError:
        pass


@pytest.fixture(autouse=True)
async def queue_commands(decoy: Decoy, state_store: StateStore) -> None:
    """Load the command queue with 2 queued commands, then a break.

    Since `state_store.wait_for` will not return a `None` command ID,
    we raise to make sure the tests stop no matter what.
    """
    call_count = 0

    def _get_next_queued_command(condition: Any) -> str:
        nonlocal call_count
        call_count = call_count + 1

        if call_count < 3:
            return f"command-id-{call_count}"
        else:
            raise BreakLoopError()

    decoy.when(
        await state_store.wait_for(condition=state_store.commands.get_next_queued)
    ).then_do(_get_next_queued_command)


# TODO(mc, 2021-07-27): the need for flush tasks in these tests a bit smelly.
# Explore solutions like [AnyIO](https://anyio.readthedocs.io) for better async
# task management that could make the QueueWorker interface more explicit.
async def _flush_tasks() -> None:
    await asyncio.sleep(0)


async def test_start_processes_commands(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should pull commands off the queue and execute them."""
    subject.start()

    decoy.verify(
        await command_executor.execute(command_id=matchers.Anything()),
        times=0,
    )

    await _flush_tasks()

    decoy.verify(
        await command_executor.execute(command_id="command-id-1"),
        await command_executor.execute(command_id="command-id-2"),
    )


async def test_stop(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should stop pulling jobs once it is stopped."""
    subject.start()
    await subject.stop()

    decoy.verify(
        await command_executor.execute(command_id=matchers.Anything()),
        times=0,
    )


async def test_unhandled_exception_breaks_loop(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should raise any unhandled exceptions in `stop`."""
    decoy.when(await command_executor.execute(command_id="command-id-1")).then_raise(
        RuntimeError("oh no")
    )

    subject.start()
    await _flush_tasks()

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.stop()
