"""Tests for the command QueueWorker in opentrons.protocol_engine."""
import asyncio
import pytest
from decoy import Decoy
from typing import AsyncIterable

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
) -> AsyncIterable[QueueWorker]:
    """Get a QueueWorker instance."""
    subject = QueueWorker(state_store=state_store, command_executor=command_executor)
    yield subject
    await subject.wait_for_idle()


async def _flush_tasks() -> None:
    await asyncio.sleep(0)


async def test_pulls_jobs_off_queue(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should pull commands off the queue and execute them."""
    decoy.when(state_store.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        None,
    )

    subject.start()
    await subject.wait_for_idle()

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
    """It should stop pulling jobs off the queue."""
    decoy.when(state_store.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        "command-id-3",
        None,
    )

    decoy.when(await command_executor.execute(command_id="command-id-1")).then_do(
        lambda command_id: subject.stop()
    )

    subject.start()
    await _flush_tasks()

    decoy.verify(await command_executor.execute(command_id="command-id-2"), times=0)

    subject.start()
    await subject.wait_for_idle()

    decoy.verify(await command_executor.execute(command_id="command-id-2"), times=1)


async def test_restart(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should be able to restart after the queue is exhausted."""
    decoy.when(state_store.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        None,
        "command-id-3",
        "command-id-4",
        None,
    )

    subject.start()
    await subject.wait_for_idle()

    decoy.verify(
        await command_executor.execute(command_id="command-id-1"),
        await command_executor.execute(command_id="command-id-2"),
    )
    decoy.verify(await command_executor.execute(command_id="command-id-3"), times=0)

    subject.start()
    await subject.wait_for_idle()

    decoy.verify(
        await command_executor.execute(command_id="command-id-1"),
        await command_executor.execute(command_id="command-id-2"),
        await command_executor.execute(command_id="command-id-3"),
        await command_executor.execute(command_id="command-id-4"),
    )


async def test_refresh(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should be able to refresh the queue without restarting."""
    decoy.when(state_store.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        None,
        "command-id-3",
        "command-id-4",
        None,
    )

    subject.start()
    await subject.wait_for_idle()

    decoy.verify(
        await command_executor.execute(command_id="command-id-1"),
        await command_executor.execute(command_id="command-id-2"),
    )
    decoy.verify(await command_executor.execute(command_id="command-id-3"), times=0)

    subject.refresh()
    await subject.wait_for_idle()

    decoy.verify(
        await command_executor.execute(command_id="command-id-1"),
        await command_executor.execute(command_id="command-id-2"),
        await command_executor.execute(command_id="command-id-3"),
        await command_executor.execute(command_id="command-id-4"),
    )


async def test_play_noop(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should no-op if play is called multiple times."""
    decoy.when(state_store.commands.get_next_queued()).then_return("command-id-1")

    subject.start()
    subject.start()
    subject.start()
    decoy.when(state_store.commands.get_next_queued()).then_return(None)

    await subject.wait_for_idle()

    decoy.verify(
        await command_executor.execute(command_id="command-id-1"),
        times=1,
    )
