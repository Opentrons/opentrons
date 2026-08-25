"""Test for the Pyro Asynchronous Client Adapter."""

import socket
import threading
from typing import cast
from unittest.mock import patch

import pytest
from decoy import Decoy
from Pyro5 import api as pyro
from Pyro5 import nameserver

import opentrons.hardware_control.types as hw_types
from opentrons.hardware_control import HardwareControlAPI, ThreadManager
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.util.pyro import pyro_client_async_adapter as _get_thread_proxy_module
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
from opentrons.util.pyro.pyro_proxy_utility import wait_for_proxy

TEST_PYRO_TIMEOUT = 5


@pytest.fixture
def managed_obj(ot3_hardware: ThreadManager[OT3API]) -> OT3API:
    """OT3API fixture for tests."""
    managed = ot3_hardware.managed_obj
    assert managed
    return managed


async def test_client_async_on_ot3api(decoy: Decoy, managed_obj: OT3API) -> None:
    """Test the client async adapter on an OT3API ran through a Pyro service."""
    sock = socket.socket()
    sock.bind(("localhost", 0))
    host, port = sock.getsockname()
    sock.close()

    pyro.config.NS_HOST = host
    pyro.config.NS_PORT = port

    name_server_ready = threading.Event()

    def _nameserver_loop() -> None:
        # start_ns returns (nameserver, daemon, uri)
        _, ns_daemon, _ = nameserver.start_ns(host=host, port=port)  # type: ignore
        name_server_ready.set()
        # Run until the test process exits; thread is marked daemon=True.
        ns_daemon.requestLoop()

    def _pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", managed_obj, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    server_thread = threading.Thread(target=_pyro_daemon, daemon=True)

    ns_thread.start()
    server_thread.start()

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)

    # Make an AsyncClientPyroObject out of the proxy, and then typecast it to HardwareControlAPI for helpful typehints
    # This is similar to what a "full" pyro implementation roundtrip will look like
    ot3_async = await wait_for_proxy(proxy_name="OT3API")

    # assert metadata info about an async function
    assert ot3_async.home.__name__ == "home"  # type: ignore
    assert ot3_async.home.__qualname__ == "OT3API.home"  # type: ignore

    casted_ot3api = cast(HardwareControlAPI, ot3_async)

    # Confirm that all these things are awaitable
    await casted_ot3api.home()
    tip_status = await casted_ot3api.get_tip_presence_status(  # type: ignore
        mount=hw_types.OT3Mount.LEFT
    )
    assert tip_status is hw_types.TipStateType.ABSENT

    # Access properties and standard methods with expected results
    door_state = casted_ot3api.door_state
    assert door_state is hw_types.DoorState.CLOSED

    estop_state = casted_ot3api.get_estop_state()
    assert estop_state is hw_types.EstopState.DISENGAGED

    # Clean up client resources.
    ot3_async._proxy._pyroRelease()  # type: ignore


async def test_thread_local_proxy_reuses_connections(
    managed_obj: OT3API,
) -> None:
    """Test that async calls reuse proxies instead of creating a new one per call."""
    sock = socket.socket()
    sock.bind(("localhost", 0))
    host, port = sock.getsockname()
    sock.close()

    pyro.config.NS_HOST = host
    pyro.config.NS_PORT = port

    name_server_ready = threading.Event()

    def _nameserver_loop() -> None:
        _, ns_daemon, _ = nameserver.start_ns(host=host, port=port)  # type: ignore
        name_server_ready.set()
        ns_daemon.requestLoop()

    def _pyro_daemon() -> None:
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", managed_obj, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    server_thread = threading.Thread(target=_pyro_daemon, daemon=True)

    ns_thread.start()
    server_thread.start()

    register_hardware_types()
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)

    ot3_async = await wait_for_proxy(proxy_name="OT3API")
    casted_ot3api = cast(HardwareControlAPI, ot3_async)

    original_get_thread_proxy = _get_thread_proxy_module._get_thread_proxy
    new_proxy_count = 0
    previous_proxy_count = 0

    def counting_get_thread_proxy(
        proxy: pyro.Proxy,
    ) -> pyro.Proxy:
        nonlocal new_proxy_count
        result = original_get_thread_proxy(proxy)

        new_proxy_count += 1
        return result

    call_count = 20
    with patch.object(
        _get_thread_proxy_module, "_get_thread_proxy", counting_get_thread_proxy
    ):
        for _ in range(call_count):
            await casted_ot3api.home()
            assert new_proxy_count == previous_proxy_count + 2
            previous_proxy_count = new_proxy_count

    # With thread-local proxy reuse, new_proxy_count should be double
    # the call_count as of 5/4/26. Each client request creates one proxy and reuses it.
    # Every call creates a proxy then releases it, and result validators create a proxy and release it.
    assert new_proxy_count == call_count * 2, (
        f"Expected two proxies per query but got {new_proxy_count} new proxies for "
        f"{call_count} calls. Each call create a thread local proxy and a "
        f"result validator proxy."
    )

    ot3_async._proxy._pyroRelease()  # type: ignore
