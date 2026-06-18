"""Testing suite for the RobotServerPyroResource."""

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
from opentrons.hardware_control.protocols.types import FlexRobotType
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.protocol_engine import DeckType
from opentrons.protocol_engine.resources.camera_provider import (
    CameraProvider,
)
from opentrons.protocol_engine.resources.file_provider import (
    FileProvider,
    UserDefinedCSVCmdFileNameMetadata,
)
from opentrons.util.pyro.pyro_client_async_adapter import (
    AsyncClientPyroObject,
    ClientPyroFunctionWrapper,
)
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
from opentrons_shared_data.data_files import DataFileInfo, MimeType
from opentrons_shared_data.robot.types import RobotTypeEnum
from server_utils.fastapi_utils.app_state import AppState

from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.hardware import HardwareStateStore
from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
    MaintenanceRunOrchestratorStore,
)
from robot_server.runs.run_orchestrator_store import (
    RunOrchestratorStore,
)
from robot_server.runs.run_process_pyro_provider import RunProcessPyroProvider
from robot_server.service.pyro_utils import (
    pyro_resource,
    resource_utilities,
)

TEST_PYRO_TIMEOUT = 5


@pytest.fixture
def mock_feature_flags(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
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
        decoy.when(mock.get_robot_type()).then_return(FlexRobotType)
        return mock
    except ImportError:
        return None  # type: ignore[return-value]


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

    # Initialize the RobotServerPyroResource
    pyro_resource.start_initializing_pyro_resource(app_state)

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
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


async def test_run_hardware_event_callback(
    ot3_hardware_api: OT3API,
    mock_app_state: AppState,
    mock_feature_flags: None,
    mock_run_process_pyro_provider: RunProcessPyroProvider,
    decoy: Decoy,
) -> None:
    """Enforce that the RobotServerPyroResource provides a proxy of a callback.

    It should be provided to the hardware event handler, and recieves a callback proxy in response.
    """
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        hw_api=ot3_hardware_api, app_state=mock_app_state
    )
    # Cast the two Async proxies on the nameserver as a locally useful type
    ot3api = cast(OT3API, ot3_async)
    robot_server_resource = cast(pyro_resource.RobotServerPyroResource, rs_async)

    run_store = RunOrchestratorStore(
        hardware_api=ot3api,
        robot_type="OT-3 Standard",
        deck_type=DeckType("ot3_standard"),
        run_process_pyro_provider=mock_run_process_pyro_provider,
    )

    resource_utilities.register_run_orchestrator_store_to_pyro_resource(
        mock_app_state, run_store
    )

    result = ot3api.register_callback(
        robot_server_resource.create_run_hardware_event_callback()
    )

    assert isinstance(result, ClientPyroFunctionWrapper)

    default_run_door_watcher_result = ot3api.register_callback(
        robot_server_resource.get_default_run_orchestrator_door_watcher_callback()
    )

    assert isinstance(default_run_door_watcher_result, ClientPyroFunctionWrapper)


async def test_maintenance_run_hardware_event_callback(
    ot3_hardware_api: OT3API,
    mock_app_state: AppState,
    mock_feature_flags: None,
    decoy: Decoy,
) -> None:
    """Enforce that the RobotServerPyroResource provides a maintenance run's proxy of a callback.

    It should be provided to the hardware event handler, and recieves a callback proxy in response.
    """
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        hw_api=ot3_hardware_api, app_state=mock_app_state
    )
    # Cast the two Async proxies on the nameserver as a locally useful type
    ot3api = cast(OT3API, ot3_async)
    robot_server_resource = cast(pyro_resource.RobotServerPyroResource, rs_async)

    maintenance_run_store = MaintenanceRunOrchestratorStore(
        hardware_api=ot3api,
        robot_type="OT-3 Standard",
        deck_type=DeckType("ot3_standard"),
    )

    resource_utilities.register_maintenance_run_orchestrator_store_to_pyro_resource(
        mock_app_state, maintenance_run_store
    )

    result = ot3api.register_callback(
        robot_server_resource.create_maintenance_run_hardware_event_callback()
    )

    assert isinstance(result, ClientPyroFunctionWrapper)

    door_watcher_result = ot3api.register_callback(
        robot_server_resource.get_maintenance_run_door_watcher_callback()
    )

    assert isinstance(door_watcher_result, ClientPyroFunctionWrapper)


async def test_camera_provider(
    ot3_hardware_api: OT3API,
    mock_app_state: AppState,
    mock_feature_flags: None,
    decoy: Decoy,
) -> None:
    """Enforce that the RobotServerPyroResource provides a Proxy of the CameraProvider."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        hw_api=ot3_hardware_api, app_state=mock_app_state
    )
    # Cast the two Async proxies on the nameserver as a locally useful type
    robot_server_resource = cast(pyro_resource.RobotServerPyroResource, rs_async)

    empty_cam_provider = CameraProvider()
    resource_utilities.register_camera_provider_to_pyro_resource(
        mock_app_state, empty_cam_provider
    )

    # NOTE: The camera proxy should comeback already wrapped as an AsyncClientPyroObject
    camera_provider = robot_server_resource.get_camera_provider()

    settings = await camera_provider.get_camera_settings()

    # Empty Camera settings defaults all to True, assert the proxy gave us that
    assert settings.cameraEnabled
    assert settings.liveStreamEnabled
    assert settings.errorRecoveryCameraEnabled


async def test_file_provider(
    ot3_hardware_api: OT3API,
    mock_app_state: AppState,
    mock_feature_flags: None,
    decoy: Decoy,
) -> None:
    """Enforce that the RobotServerPyroResource provides a Proxy of the FileProvider."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        hw_api=ot3_hardware_api, app_state=mock_app_state
    )
    # Cast the two Async proxies on the nameserver as a locally useful type
    robot_server_resource = cast(pyro_resource.RobotServerPyroResource, rs_async)

    empty_file_provider = FileProvider()
    resource_utilities.register_file_provider_to_pyro_resource(
        mock_app_state, empty_file_provider
    )

    # NOTE: The camera proxy should comeback already wrapped as an AsyncClientPyroObject
    file_provider = robot_server_resource.get_file_provider()

    results = await file_provider.write_file(
        data=bytes([1, 2, 3]),
        mime_type=MimeType("text/csv"),
        command_metadata=UserDefinedCSVCmdFileNameMetadata(
            command_id="1", prev_command_id="0", file_id=None, filename="hi"
        ),
    )

    assert results == DataFileInfo(
        id="",
        name="",
        file_hash="",
        created_at=results.created_at,
        generated=True,
        stored=False,
        path="",
        mime_type=MimeType("text/csv"),
    )


async def test_deck_config(
    ot3_hardware_api: OT3API,
    mock_app_state: AppState,
    mock_feature_flags: None,
    mock_deck_configuration_store: DeckConfigurationStore,
    decoy: Decoy,
) -> None:
    """Enforce that the RobotServerPyroResource provides the DeckConfigurationType."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        hw_api=ot3_hardware_api, app_state=mock_app_state
    )
    # Cast the two Async proxies on the nameserver as a locally useful type
    robot_server_resource = cast(pyro_resource.RobotServerPyroResource, rs_async)

    resource_utilities.register_deck_configuration_store_to_pyro_resource(
        mock_app_state, mock_deck_configuration_store
    )

    deck_config_data = await robot_server_resource.get_deck_configuration()
    assert (
        deck_config_data == await mock_deck_configuration_store.get_deck_configuration()
    )


async def test_notify_publisher(
    ot3_hardware_api: OT3API,
    mock_app_state: AppState,
    mock_feature_flags: None,
    decoy: Decoy,
) -> None:
    """Enforce that the RobotServerPyroResource provides a Proxy of the Notify Publisher."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        hw_api=ot3_hardware_api, app_state=mock_app_state
    )
    # Cast the two Async proxies on the nameserver as a locally useful type
    robot_server_resource = cast(pyro_resource.RobotServerPyroResource, rs_async)

    resource_utilities.register_notify_publishers_to_pyro_resource(
        mock_app_state,
        lambda: [],  # type: ignore
    )

    result = robot_server_resource.get_notify_publishers()

    assert isinstance(result, ClientPyroFunctionWrapper)


async def test_run_hardware_state_update_callback(
    ot3_hardware_api: OT3API,
    mock_app_state: AppState,
    mock_feature_flags: None,
    mock_run_process_pyro_provider: RunProcessPyroProvider,
    decoy: Decoy,
) -> None:
    """Enforce that the RobotServerPyroResource provides a proxy of a callback.

    It should be provided to the hardware state update handler, and recieves a callback proxy in response.
    """
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        hw_api=ot3_hardware_api, app_state=mock_app_state
    )
    # Cast the two Async proxies on the nameserver as a locally useful type
    ot3api = cast(OT3API, ot3_async)
    robot_server_resource = cast(pyro_resource.RobotServerPyroResource, rs_async)

    run_store = RunOrchestratorStore(
        hardware_api=ot3api,
        robot_type="OT-3 Standard",
        deck_type=DeckType("ot3_standard"),
        run_process_pyro_provider=mock_run_process_pyro_provider,
    )

    resource_utilities.register_run_orchestrator_store_to_pyro_resource(
        mock_app_state, run_store
    )

    hardware_store = HardwareStateStore(hardware_resource=ot3_hardware_api)

    resource_utilities.register_hardware_state_store_to_pyro_resource(
        mock_app_state, hardware_store
    )

    hardware_event_callback = ot3api.register_callback(
        robot_server_resource.create_hardware_state_update_callback()
    )

    assert isinstance(hardware_event_callback, ClientPyroFunctionWrapper)


async def test_run_engine_state_update_callback(
    ot3_hardware_api: OT3API,
    mock_app_state: AppState,
    mock_feature_flags: None,
    mock_run_process_pyro_provider: RunProcessPyroProvider,
    decoy: Decoy,
) -> None:
    """Enforce that the RobotServerPyroResource provides a proxy of a callback.

    It should be provided to the engine state update handler, and recieves a callback proxy in response.
    """
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    ot3_async, rs_async = await _host_pyro_nameserver_and_ot3api(
        hw_api=ot3_hardware_api, app_state=mock_app_state
    )
    # Cast the two Async proxies on the nameserver as a locally useful type
    ot3api = cast(OT3API, ot3_async)
    robot_server_resource = cast(pyro_resource.RobotServerPyroResource, rs_async)

    run_store = RunOrchestratorStore(
        hardware_api=ot3api,
        robot_type="OT-3 Standard",
        deck_type=DeckType("ot3_standard"),
        run_process_pyro_provider=mock_run_process_pyro_provider,
    )

    resource_utilities.register_run_orchestrator_store_to_pyro_resource(
        mock_app_state, run_store
    )

    engine_event_callback = robot_server_resource.get_engine_updates_callback()

    assert isinstance(engine_event_callback, ClientPyroFunctionWrapper)
