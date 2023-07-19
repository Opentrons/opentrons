"""Run a `ProtocolEngine` in a worker thread."""

import asyncio
import contextlib
import typing

from opentrons.hardware_control import ThreadManagedHardware
from opentrons.protocol_engine import (
    create_protocol_engine,
    ProtocolEngine,
    Config,
    DeckType,
)

from .async_context_manager_in_thread import async_context_manager_in_thread


@contextlib.contextmanager
def protocol_engine_in_thread(
    hardware: ThreadManagedHardware,
) -> typing.Generator[
    typing.Tuple[ProtocolEngine, asyncio.AbstractEventLoop], None, None
]:
    """Run a `ProtocolEngine` in a worker thread.

    When this context manager is entered, it:

    1. Starts a worker thread.
    2. Starts an asyncio event loop in that worker thread.
    3. Creates and `.play()`s a `ProtocolEngine` in that event loop.
    4. Returns the `ProtocolEngine` and the event loop.
       Use functions like `asyncio.run_coroutine_threadsafe()` to safely interact with
       the `ProtocolEngine` from your thread.

    When this context manager is exited, it:

    1. Cleans up the `ProtocolEngine`.
    2. Stops and cleans up the event loop.
    3. Joins the thread.
    """
    with async_context_manager_in_thread(_protocol_engine(hardware)) as (
        protocol_engine,
        loop,
    ):
        yield protocol_engine, loop


@contextlib.asynccontextmanager
async def _protocol_engine(
    hardware: ThreadManagedHardware,
) -> typing.AsyncGenerator[ProtocolEngine, None]:
    protocol_engine = await create_protocol_engine(
        hardware_api=hardware.wrapped(),
        config=Config(
            robot_type="OT-3 Standard",
            deck_type=DeckType.OT3_STANDARD,
            ignore_pause=True,
            use_virtual_pipettes=True,
            use_virtual_modules=True,
            use_virtual_gripper=True,
            block_on_door_open=False,
        ),
    )
    try:
        protocol_engine.play()
        yield protocol_engine
    finally:
        await protocol_engine.finish()
