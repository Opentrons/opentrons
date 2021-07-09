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
    return decoy.create_decoy(spec=ProtocolEngine)


@pytest.fixture
def subject(
    loop: asyncio.AbstractEventLoop,
    engine: ProtocolEngine,
) -> CommandQueueWorker:
    """Get a CommandQueueWorker test subject with mocked out dependencies."""
    return CommandQueueWorker(loop=loop, engine=engine)


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

    subject.play()
    await subject.wait_for_done()

    decoy.verify(
        await engine.execute_command_by_id(command_id="command-id-1"),
        await engine.execute_command_by_id(command_id="command-id-2"),
    )


async def test_pause(
    decoy: Decoy,
    engine: ProtocolEngine,
    subject: CommandQueueWorker,
) -> None:
    """It should be able to pause sending commands to the engine."""
    decoy.when(engine.state_view.commands.get_next_queued()).then_return(
        "command-id-1",
        "command-id-2",
        None,
    )

    wait_for_done = asyncio.create_task(subject.wait_for_done())
    subject.play()
    subject.pause()

    # flush mock executions
    await asyncio.sleep(0)

    decoy.verify(
        await engine.execute_command_by_id(command_id="command-id-1"),
        times=1,
    )
    decoy.verify(
        await engine.execute_command_by_id(command_id="command-id-2"),
        times=0,
    )
    assert wait_for_done.done() is False

    subject.play()

    # TODO(mc, 2021-07-07): this timeout may be a source of flakiness, and its
    # necessity in this test is code smell
    await asyncio.wait_for(subject.wait_for_done(), timeout=0.1)

    decoy.verify(
        await engine.execute_command_by_id(command_id="command-id-2"),
        times=1,
    )


async def test_play_no_commands(
    decoy: Decoy,
    engine: ProtocolEngine,
    subject: CommandQueueWorker,
) -> None:
    """It should immediately signal done if no queued commands."""
    decoy.when(engine.state_view.commands.get_next_queued()).then_return(None)

    subject.play()

    # TODO(mc, 2021-07-07): this timeout may be a source of flakiness, and its
    # necessity in this test is code smell
    await asyncio.wait_for(subject.wait_for_done(), timeout=0.1)

    decoy.verify(
        await engine.execute_command_by_id(command_id=matchers.Anything()),
        times=0,
    )
