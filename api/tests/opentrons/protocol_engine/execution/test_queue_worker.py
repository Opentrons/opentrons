"""Tests for the command QueueWorker in opentrons.protocol_engine."""
import asyncio
import pytest
from decoy import Decoy

from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.execution import CommandExecutor, QueueWorker


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
) -> QueueWorker:
    """Get a QueueWorker instance."""
    return QueueWorker(state_store=state_store, command_executor=command_executor)


async def _flush_tasks() -> None:
    await asyncio.sleep(0)


async def test_wait_for_idle_with_start(subject: QueueWorker) -> None:
    """It should become idle when started."""
    idle_task = asyncio.create_task(subject.wait_for_idle())
    await _flush_tasks()

    assert idle_task.done() is False
    subject.start()

    await _flush_tasks()
    assert idle_task.done() is True


async def test_pulls_jobs_off_queue(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should pull commands off the queue and execute them."""
    decoy.when(state_store.state_view.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        None,
    )

    subject.start()
    assert subject.is_running is True

    await subject.wait_for_idle()

    assert subject.is_running is False
    decoy.verify(
        await command_executor.execute_by_id("command-id-1"),
        await command_executor.execute_by_id("command-id-2"),
    )


# TODO(mc, 2021-07-14): https://github.com/mcous/decoy/issues/41
@pytest.mark.filterwarnings("ignore::decoy.warnings.MiscalledStubWarning")
async def test_stop(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should stop pulling jobs off the queue."""
    decoy.when(state_store.state_view.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        "command-id-3",
        None,
    )

    decoy.when(await command_executor.execute_by_id("command-id-1")).then_do(
        lambda _: subject.stop()
    )

    idle_task = asyncio.create_task(subject.wait_for_idle())

    subject.start()
    await _flush_tasks()

    decoy.verify(await command_executor.execute_by_id("command-id-2"), times=0)
    assert idle_task.done() is False
    assert subject.is_running is False

    subject.start()
    await idle_task

    decoy.verify(await command_executor.execute_by_id("command-id-2"), times=1)


async def test_restart_clears_idle_flag(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should be able to restart after the queue is exhausted."""
    decoy.when(state_store.state_view.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        None,
        "command-id-3",
        "command-id-4",
        None,
    )

    subject.start()

    assert subject.is_running is True
    await subject.wait_for_idle()
    assert subject.is_running is False

    decoy.verify(
        await command_executor.execute_by_id("command-id-1"),
        await command_executor.execute_by_id("command-id-2"),
    )
    decoy.verify(await command_executor.execute_by_id("command-id-3"), times=0)

    subject.start()

    assert subject.is_running is True
    await subject.wait_for_idle()
    assert subject.is_running is False

    decoy.verify(
        await command_executor.execute_by_id("command-id-3"),
        await command_executor.execute_by_id("command-id-4"),
    )
