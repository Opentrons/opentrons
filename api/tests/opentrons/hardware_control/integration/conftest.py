import asyncio
import threading
from typing import AsyncGenerator, Iterator

import pytest

from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.emulation.module_server import ModuleStatusClient
from opentrons.hardware_control.emulation.module_server.helpers import wait_emulators
from opentrons.hardware_control.emulation.scripts import run_app, run_smoothie
from opentrons.hardware_control.emulation.settings import (
    PipetteSettings,
    Settings,
    SmoothieSettings,
)
from opentrons.hardware_control.emulation.types import ModuleType


@pytest.fixture(scope="session")
def emulator_settings() -> Settings:
    """Emulator settings"""
    return Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p20_multi_v2.0", id="P3HMV202020041605"),
            right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        ),
    )


@pytest.fixture(scope="session")
def emulation_app(emulator_settings: Settings) -> Iterator[None]:
    """Run the emulators"""
    modules = [
        ModuleType.Magnetic,
        ModuleType.Temperature,
        ModuleType.Thermocycler,
        ModuleType.Heatershaker,
    ]
    in_thread_loop = asyncio.new_event_loop()

    def _run_app(thread_loop: asyncio.AbstractEventLoop) -> None:
        asyncio.set_event_loop(thread_loop)

        async def _main_task() -> None:
            await asyncio.gather(
                run_smoothie.run(emulator_settings),
                run_app.run(emulator_settings, modules=[m.value for m in modules]),
            )

        try:
            thread_loop.run_until_complete(_main_task())
        except Exception:
            # this exception is from stopping the loop in the way that we will when
            # the fixture closes (by just, well, stopping the loop, and then cleaning
            # stuff up later). We can ignore it.
            pass

        thread_loop.run_until_complete(thread_loop.shutdown_asyncgens())
        thread_loop.close()

    async def _wait_ready() -> None:
        c = await ModuleStatusClient.connect(
            host="localhost",
            port=emulator_settings.module_server.port,
            interval_seconds=0.1,
        )
        await wait_emulators(client=c, modules=modules, timeout=5)
        c.close()

    def _run_wait_ready() -> None:
        asyncio.run(_wait_ready())

    # these threads are daemonized to make ctrl-c behavior a little better
    # Start the emulator thread.
    t = threading.Thread(target=_run_app, args=(in_thread_loop,))
    t.daemon = True
    t.start()

    # Start the wait for emulator ready thread and wait for it to terminate.
    ready_proc = threading.Thread(target=_run_wait_ready)
    ready_proc.daemon = True
    ready_proc.start()
    ready_proc.join()

    yield
    in_thread_loop.call_soon_threadsafe(in_thread_loop.stop)
    t.join()


@pytest.fixture
async def execution_manager() -> AsyncGenerator[ExecutionManager, None]:
    em = ExecutionManager()
    yield em
    await em.cancel()


@pytest.fixture
def poll_interval_seconds() -> float:
    """The polling interval used for the module tests.

    If too fast, tests may fail due to stale data in the serial buffers.
    If too slow, tests will take too long and may time out.
    """
    return 0.01
