"""Test for the Pyro Synchronous Adapter."""

import asyncio
import inspect
import socket
import threading
from types import FunctionType
from typing import TypeVar

import pytest
from Pyro5 import api as pyro
from Pyro5 import nameserver

import opentrons.hardware_control.types as hw_types
from opentrons.hardware_control import ThreadManager
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.util.pyro.pyro_daemon_utility import PYRO_TIMEOUT, create_pyro_daemon
from opentrons.util.pyro.pyro_synchronous_adapter import (
    DaemonUtility,
    PyroSynchronousObject,
)


@pytest.fixture
def managed_obj(ot3_hardware: ThreadManager[OT3API]) -> OT3API:
    """OT3API fixture for tests."""
    managed = ot3_hardware.managed_obj
    assert managed
    return managed


def test_pyro_synchronous_adapter_ot3api(managed_obj: OT3API) -> None:
    """Test that the PyroSynchronousObject creates a fully adapted class of OT3API public methods and properties."""
    utility = DaemonUtility(daemon=pyro.Daemon())  # type: ignore
    pyro_object = PyroSynchronousObject(managed_obj, utility)
    pyro_object_members = [name for name, attr in inspect.getmembers(pyro_object)]

    # The PyroSynchronousObject should only adapt public properties, functions and async functions from a base class.
    for name, attr in inspect.getmembers(managed_obj):
        if (
            "__" not in name
            and not name.startswith("_")
            and (
                isinstance(attr, property)
                or isinstance(attr, FunctionType)
                or asyncio.iscoroutinefunction(attr)
            )
            and not (inspect.ismethod(attr) and inspect.isclass(attr.__self__))
        ):
            assert name in pyro_object_members

        # Now check to ensure that things thate aren't supposed to be there (like private methods) aren't present
        if "__" not in name and (name.startswith("_") or isinstance(attr, TypeVar)):
            assert name not in pyro_object_members


async def test_pyro_client_server_ot3api(managed_obj: OT3API) -> None:
    """Test the daemon utility using a nameserver against client requests."""
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

    # Access property, method and async method, assert expected response between client and server
    door_state = ot3_proxy.door_state
    assert door_state is hw_types.DoorState.CLOSED

    estop_state = ot3_proxy.get_estop_state()
    assert estop_state is hw_types.EstopState.DISENGAGED

    tip_status = ot3_proxy.get_tip_presence_status(mount=hw_types.OT3Mount.LEFT)
    assert tip_status is hw_types.TipStateType.ABSENT

    # Clean up client resources.
    ot3_proxy._pyroRelease()  # type: ignore
