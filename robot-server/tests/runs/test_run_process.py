"""Tests for run process."""

import asyncio
import socket
import threading
from typing import cast

from Pyro5 import api as pyro
from Pyro5 import nameserver

from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject
from opentrons.util.pyro.pyro_daemon_utility import PYRO_TIMEOUT

from robot_server.runs.run_process import DirectedRunProcess, register_process_types
from robot_server.runs.run_process_entry_point import initialize_run_process


async def test_run_process_proxy() -> None:
    """Test the run process pyro creation and a proxy can be created that returns data and async commands can be called."""
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

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    ns_thread.start()

    pyro_thread = initialize_run_process("ot-protocol")
    pyro_thread.start()

    # Client-side requests below
    register_process_types()
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

    uri = pyro.resolve(uri="PYRONAME:ot-protocol")
    protocol_proxy = pyro.Proxy(uri)  # type: ignore
    protocol_async = AsyncClientPyroObject(protocol_proxy)
    run_process = cast(DirectedRunProcess, cast(object, protocol_async))

    result = run_process.get_robot_type()
    assert result == "OT-3 Standard"
    # TODO need to get a real or mock orchestrator for most methods to pass
    # await run_process.finish()

    # Clean up client resources.
    protocol_proxy._pyroRelease()  # type: ignore
