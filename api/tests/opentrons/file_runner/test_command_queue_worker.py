"""Tests for the CommandQueueWorker."""

# TODO(mc, 2021-07-06): these tests have a variety of code smells that are
# warning signs for the code under test:
#
# 1. Dependencies of the CommandQueueWorker are only partially mocked
# 2. The worker uses collaboration along with non-trivial branching
#    and looping logic
#
# These concerns should be addressed when this logic is moved into the
# ProtocolEngine core. Some of this logic may be better suited for
# integration or end-to-end smoke tests.

import pytest
import asyncio
from decoy import Decoy, matchers

from opentrons.protocol_engine import ProtocolEngine
from opentrons.file_runner.command_queue_worker import CommandQueueWorker


@pytest.fixture
def engine(decoy: Decoy) -> ProtocolEngine:
    """Get a mock ProtocolEngine."""
    return decoy.mock(cls=ProtocolEngine)


@pytest.fixture
async def subject(engine: ProtocolEngine) -> CommandQueueWorker:
    """Get a CommandQueueWorker test subject with mocked out dependencies."""
    return CommandQueueWorker(engine=engine)


async def flush_event_loop() -> None:
    """Flush out the event loop by using short sleep."""
    await asyncio.sleep(0.1)


async def test_play(
    decoy: Decoy,
    engine: ProtocolEngine,
    subject: CommandQueueWorker,
) -> None:
    """It should signal the ProtocolEngine to execute commands."""
    decoy.when(engine.state_view.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        None,
    )

    result = asyncio.create_task(subject.wait_for_done())
    subject.play()
    await flush_event_loop()

    decoy.verify(
        await engine.execute_command_by_id(command_id="command-id-1"),
        await engine.execute_command_by_id(command_id="command-id-2"),
    )
    assert result.done() is True


async def test_play_noop(
    decoy: Decoy,
    engine: ProtocolEngine,
    subject: CommandQueueWorker,
) -> None:
    """It should no-op if play is called multiple times."""
    decoy.when(engine.state_view.commands.get_next_queued()).then_return(
        "command-id-1",
        None,
    )

    result = asyncio.create_task(subject.wait_for_done())
    subject.play()
    subject.play()
    subject.play()
    await flush_event_loop()

    decoy.verify(
        await engine.execute_command_by_id(command_id=matchers.Anything()),
        times=1,
    )
    assert result.done() is True


async def test_pause(
    decoy: Decoy,
    engine: ProtocolEngine,
    subject: CommandQueueWorker,
) -> None:
    """It should be able to pause sending commands to the engine."""
    decoy.when(engine.state_view.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        "command-id-2",
        None,
    )

    result = asyncio.create_task(subject.wait_for_done())
    subject.play()
    subject.pause()
    await flush_event_loop()

    decoy.verify(
        await engine.execute_command_by_id(command_id="command-id-1"),
        times=1,
    )
    decoy.verify(
        await engine.execute_command_by_id(command_id="command-id-2"),
        times=0,
    )
    assert result.done() is False

    subject.play()
    await flush_event_loop()

    decoy.verify(
        await engine.execute_command_by_id(command_id="command-id-2"),
        times=1,
    )
    assert result.done() is True


async def test_play_no_commands(
    decoy: Decoy,
    engine: ProtocolEngine,
    subject: CommandQueueWorker,
) -> None:
    """It should immediately signal done if no queued commands."""
    decoy.when(engine.state_view.commands.get_next_queued()).then_return(None)

    result = asyncio.create_task(subject.wait_for_done())
    subject.play()
    await flush_event_loop()

    decoy.verify(
        await engine.execute_command_by_id(command_id=matchers.Anything()),
        times=0,
    )
    assert result.done() is True
