"""Tests for run process."""

import asyncio
import inspect
import socket
import threading
from typing import cast

import pytest
from decoy import Decoy
from Pyro5 import api as pyro
from Pyro5 import nameserver

from opentrons.config import feature_flags
from opentrons.hardware_control.ot3api import OT3API
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
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
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

TEST_PYRO_TIMEOUT = 5


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
def ot3_hardware_api(request: pytest.FixtureRequest) -> OT3API:
    """Real OT3API backed by the software simulator, bound to a dedicated event loop."""
    request.node.add_marker("ot3_only")
    try:
        from opentrons.hardware_control.ot3api import OT3API

        loop = asyncio.new_event_loop()

        def _event_loop() -> None:
            asyncio.set_event_loop(loop)
            loop.run_forever()

        loop_thread = threading.Thread(target=_event_loop, daemon=True)
        loop_thread.start()

        fut = asyncio.run_coroutine_threadsafe(
            OT3API.build_hardware_simulator(
                loop=loop,
                strict_attached_instruments=False,
            ),
            loop,
        )
        api = fut.result(timeout=120)
        api._door_state = DoorState.CLOSED
        return api
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
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", hw_api, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    ot3api_thread = threading.Thread(target=_ot3api_pyro_daemon, daemon=True)

    ns_thread.start()
    ot3api_thread.start()

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
    # Initialize the RobotServerPyroResource
    pyro_resource.start_initializing_pyro_resource(app_state)
    ns = pyro.locate_ns()

    retries_counter = 0
    uri = None
    while retries_counter <= 10:
        # Wait and try again, the resource isnt registered yet
        try:
            uri = ns.lookup("OT3API")
            ns.lookup("robot-server-resource")
            break
        except Exception:
            await asyncio.sleep(0.01)
            retries_counter += 1

    # Stop waiting for the nameserver, will fail on pyro.resolve (something is wrong with nameserver and/or daemon)
    if uri is None:
        raise TimeoutError("TEST FAILURE ON PYRO NAMESERVER.")

    uri = pyro.resolve(uri="PYRONAME:OT3API")
    ot3_proxy = pyro.Proxy(uri)  # type: ignore
    ot3_async = AsyncClientPyroObject(ot3_proxy)
    rs_async = resource_utilities.get_pyro_resource()

    return (ot3_async, rs_async)


async def test_run_process_proxy(
    mock_app_state: AppState,
    ot3_hardware_api: OT3API,
    mock_feature_flags: None,
    decoy: Decoy,
) -> None:
    """Test the run process pyro creation and a proxy can be created that returns data and async commands can be called."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        ot3_hardware_api, mock_app_state
    )

    pyro_thread = initialize_run_process("ot-protocol")
    pyro_thread.start()

    # Client-side requests below
    register_process_types()
    ns = pyro.locate_ns()

    retries_counter = 0
    uri = None
    while retries_counter <= 10:
        # Wait and try again, the resource isnt registered yet
        try:
            uri = ns.lookup("ot-protocol")
            break
        except Exception:
            await asyncio.sleep(0.01)
            retries_counter += 1

    # Stop waiting for the nameserver, will fail on pyro.resolve (something is wrong with nameserver and/or daemon)
    if uri is None:
        raise TimeoutError("TEST FAILURE ON PYRO NAMESERVER.")

    # uri = pyro.resolve(uri="PYRONAME:ot-protocol")
    protocol_proxy = pyro.Proxy(uri)  # type: ignore
    protocol_async = AsyncClientPyroObject(protocol_proxy)
    run_process = cast(DirectedRunProcess, cast(object, protocol_async))

    result = run_process.get_robot_type()
    assert result == "OT-3 Standard"

    # Clean up client resources.
    protocol_proxy._pyroRelease()  # type: ignore


async def test_run_process_create(
    decoy: Decoy,
    mock_app_state: AppState,
    ot3_hardware_api: OT3API,
    mock_run_process_pyro_provider: RunProcessPyroProvider,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_feature_flags: None,
) -> None:
    """Test the run process pyro proxy `create` method can be called to create the run."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)

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
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        ot3_hardware_api, mock_app_state
    )

    run_store = RunOrchestratorStore(
        hardware_api=ot3_async,
        robot_type="OT-3 Standard",
        deck_type=DeckType("ot3_standard"),
        run_process_pyro_provider=mock_run_process_pyro_provider,
    )
    resource_utilities.register_run_orchestrator_store_to_pyro_resource(
        mock_app_state, run_store
    )

    # Get the necessary things registered with the "robot server"
    empty_file_provider = FileProvider()
    resource_utilities.register_file_provider_to_pyro_resource(
        mock_app_state, empty_file_provider
    )
    empty_cam_provider = CameraProvider()
    resource_utilities.register_camera_provider_to_pyro_resource(
        mock_app_state, empty_cam_provider
    )
    resource_utilities.register_deck_configuration_store_to_pyro_resource(
        mock_app_state, mock_deck_configuration_store
    )
    resource_utilities.register_notify_publishers_to_pyro_resource(
        mock_app_state,
        lambda: [],  # type: ignore
    )

    # Proceed with Pyro process testing
    pyro_thread = initialize_run_process("ot-protocol")
    pyro_thread.start()

    # Client-side requests below
    register_all_needed_types()
    ns = pyro.locate_ns()

    retries_counter = 0
    uri = None
    while retries_counter <= 10:
        # Wait and try again, the resource isnt registered yet
        try:
            uri = ns.lookup("ot-protocol")
            break
        except Exception:
            await asyncio.sleep(0.01)
            retries_counter += 1

    # Stop waiting for the nameserver, will fail on pyro.resolve (something is wrong with nameserver and/or daemon)
    if uri is None:
        raise TimeoutError("TEST FAILURE ON PYRO NAMESERVER.")

    protocol_proxy = pyro.Proxy(uri)  # type: ignore
    protocol_async = AsyncClientPyroObject(protocol_proxy)
    run_process = cast(DirectedRunProcess, cast(object, protocol_async))

    result = run_process.get_robot_type()
    assert result == "OT-3 Standard"

    # Ensure that we can run the create action on a proxy run

    await run_process.create(
        run_id="cool-proxy-run",
        labware_offsets=[],
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        protocol=None,
        run_time_param_values=None,
        run_time_param_paths=None,
        proxy_of_callback_for_handling_door_events=run_process.register_hardware_door_event(),
    )

    await run_process.finish()

    # Clean up client resources.
    protocol_proxy._pyroRelease()  # type: ignore
