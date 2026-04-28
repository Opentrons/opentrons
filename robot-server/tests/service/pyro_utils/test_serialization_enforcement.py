"""Tests to enforce data type serialization for communication between processes."""

import asyncio
import inspect
import socket
import threading
from typing import cast, Any

import pytest
from decoy import Decoy
from Pyro5 import api as pyro
from Pyro5 import nameserver

from opentrons.config import feature_flags
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.protocols.types import FlexRobotType
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.hardware_control.types import DoorState
from opentrons.protocol_engine import DeckType
from opentrons.protocol_engine.resources.camera_provider import (
    CameraProvider,
)
from opentrons.protocol_engine.resources.file_provider import FileProvider
from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject
from opentrons.util.pyro.pyro_daemon_utility import PYRO_TIMEOUT, create_pyro_daemon
from opentrons_shared_data.robot.types import RobotTypeEnum
from server_utils.fastapi_utils.app_state import AppState

from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.runs.run_orchestrator_store import (
    RunOrchestratorStore,
)
from robot_server.runs.run_process import (
    DirectedRunProcess,
    register_all_needed_types,
    register_process_types,
)
from robot_server.runs.run_process_entry_point import initialize_run_process
from robot_server.runs.run_process_pyro_provider import RunProcessPyroProvider
from robot_server.service.pyro_utils import pyro_resource, resource_utilities


@pytest.fixture
def mock_app_state(decoy: Decoy) -> AppState:
    """Get a mock DataFilesStore."""
    return decoy.mock(cls=AppState)


@pytest.fixture
def mock_run_process_pyro_provider(decoy: Decoy) -> RunProcessPyroProvider:
    """A mock RunProcessPyroProvider."""
    return decoy.mock(cls=RunProcessPyroProvider)


@pytest.fixture
def mock_deck_configuration_store(decoy: Decoy) -> DeckConfigurationStore:
    """Get a mock DeckConfigurationStore."""
    return decoy.mock(cls=DeckConfigurationStore)


@pytest.fixture
def mock_feature_flags(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Get a mocked feature flags."""
    for name, func in inspect.getmembers(feature_flags, inspect.isfunction):
        params = inspect.getfullargspec(func)
        mock_get_ff = decoy.mock(func=func)
        if any("robot_type" in p for p in params.args):
            decoy.when(mock_get_ff(RobotTypeEnum.FLEX)).then_return(False)
        else:
            decoy.when(mock_get_ff()).then_return(False)
        monkeypatch.setattr(feature_flags, name, mock_get_ff)


@pytest.fixture
def ot3_hardware_api(decoy: Decoy, request: pytest.FixtureRequest) -> OT3API:
    """Get a mocked out OT3API."""
    request.node.add_marker("ot3_only")
    try:
        from opentrons.hardware_control.ot3api import OT3API

        mock = decoy.mock(cls=OT3API)
        mock._door_state = DoorState.CLOSED
        decoy.when(mock.get_robot_type()).then_return(FlexRobotType)
        return mock
    except ImportError:
        return None  # type: ignore[return-value]

async def _setup_namerserver(name_server_ready: threading.Event) -> None:
    """Set up a thread running the Pyro Nameserver."""
    sock = socket.socket()
    sock.bind(("localhost", 0))
    host, port = sock.getsockname()
    sock.close()

    pyro.config.NS_HOST = host
    pyro.config.NS_PORT = port

    def _nameserver_loop() -> None:
        # start_ns returns (nameserver, daemon, uri)
        _, ns_daemon, _ = nameserver.start_ns(host=host, port=port)  # type: ignore
        name_server_ready.set()
        # Run until the test process exits; thread is marked daemon=True.
        ns_daemon.requestLoop()

    
    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    ns_thread.start()


async def _setup_OT3API_pyro_resource(
    hw_api: OT3API,
    name_server_ready: threading.Event  
) -> OT3API:
    """Set up a thread running an OT3API pyro resource and publish it on the nameserver."""
    
    def _ot3api_pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", hw_api, register_hardware_types)

    ot3api_thread = threading.Thread(target=_ot3api_pyro_daemon, daemon=True)
    ot3api_thread.start()

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
    return ot3_async


async def _setup_robot_server_pyro_resource(
    app_state: AppState,
    name_server_ready: threading.Event
) -> pyro_resource.RobotServerPyroResource:
    """Set up a thread running a Pyro resource, register all the needed things to it, and publish it on the Nameserver."""
    pyro_resource.start_initializing_pyro_resource(app_state)

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
    rs_async = resource_utilities.get_pyro_resource()
    return rs_async

async def _setup_directed_run_process_pyro_resource(
    name_server_ready: threading.Event
) -> DirectedRunProcess:
    """Set up a thread running a Directed run process pyro resource and publish it on the Nameserver."""
    pyro_thread = initialize_run_process()
    pyro_thread.start()

    ns = pyro.locate_ns()

    retries_counter = 0
    while ns.count() < 3:
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
    return run_process
    

async def test_serialization_coverage(
    decoy: Decoy,
    mock_app_state: AppState,
    ot3_hardware_api: OT3API,
    mock_run_process_pyro_provider: RunProcessPyroProvider,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_feature_flags: None,
) -> None:
    """Test to ensure no serialization errors are raised when calling for results from any exposed opentrons process.
    
    This test works by mocking out the processes and then calling all of their ACPO client side equivalents to ensure 
    all methods and attributes exposed through pyro are callable and do not raise a Pyro5.errors.SerializeError as a result.
    """
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(True)

    name_server_ready = threading.Event()

    # NOTE: the order is important, always go: Nameserver -> OT3API -> Robot Server -> Directed Run Process
    # This is the same order as the boot process on the robot
    await _setup_namerserver(name_server_ready=name_server_ready)
    ot3api = await _setup_OT3API_pyro_resource(hw_api=ot3_hardware_api, name_server_ready=name_server_ready)
    robot_server = await _setup_robot_server_pyro_resource(app_state=mock_app_state, name_server_ready=name_server_ready)
    run_process = await _setup_directed_run_process_pyro_resource(name_server_ready=name_server_ready)

    # Grab the inner proxies for all these safely wrapped results, we'll use these to troll through the metadata
    ot3api_proxy: pyro.Proxy = ot3api._proxy  # type: ignore
    robot_server_proxy: pyro.Proxy = robot_server._proxy  # type: ignore
    run_process_proxy: pyro.Proxy = run_process._proxy  # type: ignore

    # Client-side requests below
    register_all_needed_types()
    
    

    # Clean up client resources.
    run_process_proxy._pyroRelease()  # type: ignore
