import asyncio
import contextlib
import typing
from opentrons.hardware_control import ThreadManagedHardware

from opentrons.protocol_engine import create_protocol_engine, ProtocolEngine, Config


from .async_object_to_thread import async_object_to_thread


@contextlib.contextmanager
def protocol_engine_in_thread(
    hardware: ThreadManagedHardware,
) -> typing.Generator[
    typing.Tuple[ProtocolEngine, asyncio.AbstractEventLoop], None, None
]:
    with async_object_to_thread(_make_protocol_engine(hardware)) as (
        protocol_engine,
        loop,
    ):
        yield protocol_engine, loop


@contextlib.asynccontextmanager
async def _make_protocol_engine(
    hardware: ThreadManagedHardware,
) -> typing.AsyncGenerator[ProtocolEngine, None]:
    assert (
        hardware.managed_obj is not None
    )  # TODO: Uhh what is managed_obj and why am I using it
    protocol_engine = await create_protocol_engine(
        hardware_api=hardware.managed_obj,
        config=Config(
            robot_type="OT-3 Standard",
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
