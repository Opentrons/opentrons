import asyncio
import threading
import weakref
from typing import NoReturn, Optional

import pytest

from opentrons.hardware_control.api import API
from opentrons.hardware_control.modules import ModuleAtPort, SimulatingModule
from opentrons.hardware_control.thread_manager import (
    ThreadManager,
    ThreadManagerException,
)


async def _raise_exception() -> NoReturn:
    raise Exception("oh no")


def test_build_fail_raises_exception() -> None:
    """
    Test that a builder that raises an exception raises
    a ThreadManagerException
    """
    with pytest.raises(ThreadManagerException):
        ThreadManager(_raise_exception)


def test_module_cache_add_entry() -> None:
    """Test that _cached_modules updates correctly."""

    mod_names = {
        "tempdeck": [SimulatingModule(serial_number="111", model="temperatureModuleV2")]
    }
    thread_manager = ThreadManager(
        API.build_hardware_simulator, attached_modules=mod_names
    )

    # Test that module gets added to the cache
    mods = thread_manager.attached_modules
    wrapper_cache = thread_manager._cached_modules.copy()
    assert isinstance(wrapper_cache, weakref.WeakKeyDictionary)
    assert len(wrapper_cache) == 1
    assert mods[0] in wrapper_cache.values()

    # Test that calling attached modules doesn't add duplicate entries to cache
    mods2 = thread_manager.attached_modules
    wrapper_cache2 = thread_manager._cached_modules.copy()
    assert len(wrapper_cache2) == 1
    assert mods == mods2


async def test_module_cache_remove_entry() -> None:
    """Test that module entry gets removed from cache when module detaches."""
    mod_names = {
        "tempdeck": [
            SimulatingModule(serial_number="111", model="temperatureModuleV2")
        ],
        "magdeck": [SimulatingModule(serial_number="222", model="magneticModuleV1")],
    }
    thread_manager = ThreadManager(
        API.build_hardware_simulator, attached_modules=mod_names
    )

    mods_before = thread_manager.attached_modules
    assert len(mods_before) == 2

    loop = thread_manager._loop
    assert loop

    # The coroutine must be called using the threadmanager's loop.
    future = asyncio.run_coroutine_threadsafe(
        thread_manager._backend.module_controls.register_modules(
            removed_mods_at_ports=[
                ModuleAtPort(port="/dev/ot_module_sim_tempdeck111", name="tempdeck")
            ]
        ),
        loop,
    )
    future.result()
    mods_after = thread_manager.attached_modules
    assert len(mods_after) == 1


async def test_wraps_instance() -> None:
    """It should expose the underlying type."""
    thread_manager = ThreadManager(API.build_hardware_simulator)
    assert thread_manager.wraps_instance(API)


class Blocker:
    """Test object for nonblocking construction."""

    @classmethod
    async def build_blocking(
        cls,
        wait_event: asyncio.Event,
        running_event: threading.Event,
        loop: Optional[asyncio.AbstractEventLoop] = None,
    ) -> "Blocker":
        """Build an instance."""
        inst = cls(loop)
        running_event.set()
        await wait_event.wait()
        return inst

    def __init__(self, loop: Optional[asyncio.AbstractEventLoop] = None) -> None:
        """Initialize an instance."""
        self._loop = loop

    async def clean_up(self) -> None:
        """Allows cleanup."""
        pass


def test_nonblocking_via_attr() -> None:
    """Its init should return immediately if the builder has a nonblocking attribute."""

    wait_event = asyncio.Event()
    running_event = threading.Event()
    thread_manager = ThreadManager(  # type: ignore[type-var]
        ThreadManager.nonblocking_builder(Blocker.build_blocking),
        running_event=running_event,
        wait_event=wait_event,
    )

    running_event.wait()
    assert not thread_manager._is_running.is_set()
    assert thread_manager._loop
    thread_manager._loop.call_soon_threadsafe(wait_event.set)
    thread_manager.managed_thread_ready_blocking()
    thread_manager.clean_up()
