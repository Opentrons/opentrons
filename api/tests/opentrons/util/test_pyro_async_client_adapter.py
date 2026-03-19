"""Test for the Pyro Asynchronous Client Adapter."""

import asyncio
import socket
import threading
from typing import cast

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
from opentrons.util.pyro_client_async_adapter import AsyncClientPyroObject
from opentrons.util.pyro_daemon_utility import PYRO_TIMEOUT, create_pyro_daemon


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
        name_server_ready.wait(timeout=PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", managed_obj, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    server_thread = threading.Thread(target=_pyro_daemon, daemon=True)

    ns_thread.start()
    server_thread.start()

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=PYRO_TIMEOUT)
    ns = pyro.locate_ns()

    retries_counter = 0
    while ns.count() < 2:
        # Wait and try again, the resource isnt registered yet
        await asyncio.sleep(0.01)
        retries_counter += 1
        if retries_counter > 10:
            # Stop waiting for the nameserver, will fail on pyro.resolve (something is wrong with nameserver and/or daemon)
            raise TimeoutError("TEST FAILURE ON PYRO NAMESERVER.")

    uri = pyro.resolve(uri="PYRONAME:OT3API")
    ot3_proxy = pyro.Proxy(uri)  # type: ignore

    # Make an AsyncClientPyroObject out of the proxy, and then typecast it to HardwareControlAPI for helpful typehints
    # This is similar to what a "full" pyro implementation roundtrip will look like
    ot3_async = AsyncClientPyroObject(ot3_proxy)
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
    ot3_proxy._pyroRelease()  # type: ignore
