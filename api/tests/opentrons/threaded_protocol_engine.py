import asyncio
import concurrent.futures
import contextlib
import threading
import typing
from opentrons.hardware_control import ThreadManagedHardware

from opentrons.protocol_engine import create_protocol_engine, ProtocolEngine, Config


@contextlib.contextmanager
def protocol_engine_in_thread(
    hardware: ThreadManagedHardware
) -> typing.Generator[typing.Tuple[ProtocolEngine, asyncio.AbstractEventLoop], None, None]:
    protocol_engine: typing.Optional[ProtocolEngine] = None
    loop: typing.Optional[asyncio.AbstractEventLoop] = None
    task: typing.Optional["asyncio.Task[None]"] = None

    thread_has_initialized = threading.Event()

    def _in_thread() -> None:
        async def _in_loop() -> None:
            try:
                nonlocal protocol_engine
                nonlocal loop
                nonlocal task

                assert hardware.managed_obj is not None
                protocol_engine =  await create_protocol_engine(
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
                loop = asyncio.get_running_loop()
                task = asyncio.current_task()

                protocol_engine.play()

                thread_has_initialized.set()

                wait_until_cancelled = asyncio.Event()
                await wait_until_cancelled.wait()

            finally:
                thread_has_initialized.set()

        asyncio.run(_in_loop())

    thread = threading.Thread(target=_in_thread)
    thread.start()

    thread_has_initialized.wait()

    if protocol_engine is None or loop is None or task is None:
        # There was some error doing initialization in the other thread.
        # Raise it.
        thread.join()
        assert False

    try:
        yield protocol_engine, loop

    finally:
        loop.call_soon_threadsafe(task.cancel)
        thread.join()
