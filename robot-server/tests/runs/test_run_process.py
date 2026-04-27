"""Tests for run process."""

import asyncio
import socket
import threading
from typing import cast

import pytest
from decoy import Decoy
from Pyro5 import api as pyro
from Pyro5 import nameserver

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.protocols.types import FlexRobotType
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject
from opentrons.util.pyro.pyro_daemon_utility import PYRO_TIMEOUT, create_pyro_daemon
from server_utils.fastapi_utils.app_state import AppState

from robot_server.runs.run_process import DirectedRunProcess, register_process_types
from robot_server.runs.run_process_entry_point import initialize_run_process
from robot_server.service.pyro_utils import pyro_resource, resource_utilities


@pytest.fixture
def mock_app_state(decoy: Decoy) -> AppState:
    """Get a mock DataFilesStore."""
    return decoy.mock(cls=AppState)


@pytest.fixture
def ot3_hardware_api(decoy: Decoy, request: pytest.FixtureRequest) -> OT3API:
    """Get a mocked out OT3API."""
    request.node.add_marker("ot3_only")
    try:
        from opentrons.hardware_control.ot3api import OT3API

        mock = decoy.mock(cls=OT3API)
        decoy.when(mock.get_robot_type()).then_return(FlexRobotType)
        return mock
    except ImportError:
        return None  # type: ignore[return-value]


async def _host_pyro_nameserver_and_ot3api(
    hw_api: OT3API,
    app_state: AppState,
) -> tuple:  # type: ignore
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

    def _ot3api_pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", hw_api, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    ot3api_thread = threading.Thread(target=_ot3api_pyro_daemon, daemon=True)

    ns_thread.start()
    ot3api_thread.start()

    # Initialize the RobotServerPyroResource
    pyro_resource.start_initializing_pyro_resource(app_state)

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=PYRO_TIMEOUT)
    ns = pyro.locate_ns()

    retries_counter = 0
    while ns.count() < 3:
        # Wait and try again, the resource isnt registered yet
        await asyncio.sleep(0.01)
        retries_counter += 1
        if retries_counter > 10:
            # Stop waiting for the nameserver, will fail on pyro.resolve (something is wrong with nameserver and/or daemon)
            raise TimeoutError("TEST FAILURE ON PYRO NAMESERVER.")

    uri = pyro.resolve(uri="PYRONAME:OT3API")
    ot3_proxy = pyro.Proxy(uri)  # type: ignore
    ot3_async = AsyncClientPyroObject(ot3_proxy)
    rs_async = resource_utilities.get_pyro_resource()

    return (ot3_async, rs_async)


async def test_run_process_proxy(
    mock_app_state: AppState,
    ot3_hardware_api: OT3API,
) -> None:
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
    name_server_ready.wait(timeout=PYRO_TIMEOUT)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        ot3_hardware_api, mock_app_state
    )

    pyro_thread = initialize_run_process()
    pyro_thread.start()

    # Client-side requests below
    register_process_types()
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
