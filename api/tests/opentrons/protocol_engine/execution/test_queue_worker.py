"""Tests for the command QueueWorker in opentrons.protocol_engine."""

from typing import AsyncGenerator, Callable, Generator

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.errors import RunStoppedError
from opentrons.protocol_engine.execution import CommandExecutor, QueueWorker
from opentrons.protocol_engine.state.state import StateStore


class BreakLoopError(Exception):
    """An exception to break out of the worker's wait-for-new-command loop."""


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def command_executor(decoy: Decoy) -> CommandExecutor:
    """Get a mocked out CommandExecutor."""
    return decoy.mock(cls=CommandExecutor)


@pytest.fixture
def command_generator(decoy: Decoy) -> Callable[[], AsyncGenerator[str, None]]:
    """Get a mocked out CommandExecutor."""

    async def generator() -> AsyncGenerator[str, None]:
        yield "command-id-1"
        yield "command-id-2"
        yield "command-id-3"

    return generator


@pytest.fixture
def subject(
    state_store: StateStore,
    command_executor: CommandExecutor,
    command_generator: Callable[[], AsyncGenerator[str, None]],
) -> QueueWorker:
    """Get a QueueWorker instance."""
    return QueueWorker(
        state_store=state_store,
        command_executor=command_executor,
        command_generator=command_generator,
    )


@pytest.fixture(autouse=True)
async def queue_commands(decoy: Decoy, state_store: StateStore) -> None:
    """Load the command queue with 2 queued commands, then stop.

    When state_store.wait_for(...) is called, return "command-id-1" the first time,
    return "command-id-2" the second time, and raise RunStoppedError the third time.
    """

    def get_next_to_execute() -> Generator[str, None, None]:
        yield "command-id-1"
        yield "command-id-2"
        raise RunStoppedError()

    get_next_to_execute_results = get_next_to_execute()

    decoy.when(
        await state_store.wait_for(condition=state_store.commands.get_next_to_execute)
    ).then_do(lambda *args, **kwargs: next(get_next_to_execute_results))


async def test_start_processes_commands(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should pull commands off the queue and execute them."""
    subject.start()

    decoy.verify(
        await command_executor.execute(command_id="command-id-1"),
        times=0,
    )

    await subject.join()

    decoy.verify(
        await command_executor.execute(command_id="command-id-1"),
        await command_executor.execute(command_id="command-id-2"),
    )


async def test_cancel(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should stop pulling jobs if it is cancelled."""
    subject.start()
    subject.cancel()
    await subject.join()

    decoy.verify(
        await command_executor.execute(command_id=matchers.Anything()),
        times=0,
    )
    decoy.verify(command_executor.cancel_tasks("Engine cancelled"), times=1)


async def test_cancel_noops_if_joined(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should noop on cancel if the worker has already been `join`'d."""
    subject.start()
    await subject.join()
    subject.cancel()
    decoy.verify(command_executor.cancel_tasks("Engine commands complete"), times=1)


async def test_unhandled_exception_breaks_loop(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should raise any unhandled exceptions in `join`."""
    decoy.when(await command_executor.execute(command_id="command-id-1")).then_raise(  # type: ignore[func-returns-value]
        RuntimeError("oh no")
    )

    subject.start()

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.join()
    decoy.verify(command_executor.cancel_tasks("Engine failed"), times=1)


async def test_engine_stopped_exception_breaks_loop_gracefully(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should `join` gracefully if a RunStoppedError is raised."""
    decoy.when(
        await state_store.wait_for(condition=state_store.commands.get_next_to_execute)
    ).then_raise(RunStoppedError("oh no"))

    subject.start()
    await subject.join()
    decoy.verify(command_executor.cancel_tasks("Engine commands complete"), times=1)
