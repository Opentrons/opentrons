"""Tests for the command QueueWorker in opentrons.protocol_engine."""
import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.errors import ProtocolEngineStoppedError
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
def subject(
    state_store: StateStore,
    command_executor: CommandExecutor,
) -> QueueWorker:
    """Get a QueueWorker instance."""
    return QueueWorker(state_store=state_store, command_executor=command_executor)


@pytest.fixture(autouse=True)
async def queue_commands(decoy: Decoy, state_store: StateStore) -> None:
    """Load the command queue with 2 queued commands, then stop."""
    decoy.when(
        await state_store.wait_for(condition=state_store.commands.get_next_queued)
    ).then_return("command-id-1", "command-id-2")

    decoy.when(state_store.commands.get_stop_requested()).then_return(
        False, False, True
    )


async def test_start_processes_commands(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should pull commands off the queue and execute them."""
    decoy.when(
        await state_store.wait_for(condition=state_store.commands.get_next_queued)
    ).then_return("command-id-1", "command-id-2")

    decoy.when(state_store.commands.get_stop_requested()).then_return(
        False, False, True
    )

    subject.start()

    decoy.verify(
        await command_executor.execute(command_id=matchers.Anything()),
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


async def test_unhandled_exception_breaks_loop(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should raise any unhandled exceptions in `join`."""
    decoy.when(await command_executor.execute(command_id="command-id-1")).then_raise(
        RuntimeError("oh no")
    )

    subject.start()

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.join()


async def test_engine_stopped_exception_breaks_loop_gracefully(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    subject: QueueWorker,
) -> None:
    """It should `join` gracefully if a ProtocolEngineStoppedError is raised."""
    decoy.when(
        await state_store.wait_for(condition=state_store.commands.get_next_queued)
    ).then_raise(ProtocolEngineStoppedError("oh no"))

    subject.start()
    await subject.join()


