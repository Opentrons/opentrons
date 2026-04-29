"""Tests to enforce data type serialization for communication between processes."""

import asyncio
import inspect
import socket
import threading
import inspect
from pydantic import BaseModel
from typing import Any, Callable, Dict, List, Literal, Mapping, Optional, Sequence, Set, Union, cast

from datetime import datetime
import pytest
from decoy import Decoy
from Pyro5 import api as pyro
from Pyro5 import nameserver
import Pyro5.errors as errors

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
from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
    MaintenanceRunOrchestratorStore,
)
from robot_server.runs.run_process import (
    DirectedRunProcess,
    register_all_needed_types,
    register_process_types,
)
from robot_server.runs.run_process_entry_point import initialize_run_process
from robot_server.runs.run_process_pyro_provider import RunProcessPyroProvider
from robot_server.service.pyro_utils import pyro_resource, resource_utilities
import opentrons.hardware_control.types as hw_types
import opentrons.hardware_control.dev_types as dev_types
import opentrons.hardware_control.modules.types as module_types
import opentrons.hardware_control.peripherals.types as peripheral_types
import opentrons.types as ot_types
import opentrons.config.types as config_types
from opentrons.hardware_control.ot3_calibration import OT3Transforms
from opentrons.config import gripper_config as gc
from opentrons_shared_data.gripper.gripper_definition import GripperModel
import opentrons_shared_data.pipette.types as pipette_types
from opentrons_shared_data.pipette import (
    load_data as load_pipette_data,
)
from opentrons.config.robot_configs import build_config_ot3
from opentrons.hardware_control.robot_calibration import DeckCalibration
import opentrons.calibration_storage.types as calibration_types
from opentrons.config import robot_configs



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

        loop = asyncio.new_event_loop()
        def _event_loop() -> None:
            asyncio.set_event_loop(loop)
            loop.run_forever()

        loop_thread = threading.Thread(target=_event_loop, daemon=True)
        loop_thread.start()
        mock._loop = loop

        return mock
    except ImportError:
        return None  # type: ignore[return-value]

@pytest.fixture
def mock_config() -> config_types.OT3Config:
    return build_config_ot3({})

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
    hw_api: OT3API, name_server_ready: threading.Event
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
    uri = None
    while retries_counter <= 10:
        # Wait and try again, the resource isnt registered yet
        try:
            uri = ns.lookup("OT3API")
            break
        except Exception:
            await asyncio.sleep(0.01)
            retries_counter += 1

    # Stop waiting for the nameserver, will fail on pyro.resolve (something is wrong with nameserver and/or daemon)
    if uri is None:
        raise TimeoutError("TEST FAILURE ON PYRO NAMESERVER IN OT3API SETUP.")

    uri = pyro.resolve(uri="PYRONAME:OT3API")
    ot3_proxy = pyro.Proxy(uri)  # type: ignore
    ot3_async = AsyncClientPyroObject(ot3_proxy)
    return ot3_async


async def _setup_robot_server_pyro_resource(
    app_state: AppState,
    ot3_api_async_proxy: OT3API,
    name_server_ready: threading.Event,
    run_process_provider: RunProcessPyroProvider,
    deck_configuration_store: DeckConfigurationStore,
) -> pyro_resource.RobotServerPyroResource:
    """Set up a thread running a Pyro resource, register all the needed things to it, and publish it on the Nameserver."""
    pyro_resource.start_initializing_pyro_resource(app_state)

    # Set up all the registered "things" on the robot-server

    run_store = RunOrchestratorStore(
        hardware_api=ot3_api_async_proxy,
        robot_type="OT-3 Standard",
        deck_type=DeckType("ot3_standard"),
        run_process_pyro_provider=run_process_provider,
    )
    resource_utilities.register_run_orchestrator_store_to_pyro_resource(
        app_state, run_store
    )

    # Get the necessary things registered with the "robot server"
    empty_file_provider = FileProvider()
    resource_utilities.register_file_provider_to_pyro_resource(
        app_state, empty_file_provider
    )
    empty_cam_provider = CameraProvider()
    resource_utilities.register_camera_provider_to_pyro_resource(
        app_state, empty_cam_provider
    )
    resource_utilities.register_deck_configuration_store_to_pyro_resource(
        app_state, deck_configuration_store
    )
    resource_utilities.register_notify_publishers_to_pyro_resource(
        app_state,
        lambda: [],  # type: ignore
    )

    ns = pyro.locate_ns()
    retries_counter = 0
    uri = None
    while retries_counter <= 10:
        # Wait and try again, the resource isnt registered yet
        try:
            ns.lookup("OT3API")
            uri = ns.lookup("robot-server-resource")
            break
        except Exception:
            await asyncio.sleep(0.01)
            retries_counter += 1

    # Stop waiting for the nameserver, will fail on pyro.resolve (something is wrong with nameserver and/or daemon)
    if uri is None:
        raise TimeoutError("TEST FAILURE ON PYRO NAMESERVER IN ROBOT SERVER SETUP.")

    rs_async = resource_utilities.get_pyro_resource()
    return rs_async


async def _setup_directed_run_process_pyro_resource(
    name_server_ready: threading.Event,
) -> DirectedRunProcess:
    """Set up a thread running a Directed run process pyro resource and publish it on the Nameserver."""
    pyro_thread = initialize_run_process("ot-protocol")
    pyro_thread.start()

    ns = pyro.locate_ns()
    retries_counter = 0
    uri = None
    while retries_counter <= 10:
        # Wait and try again, the resource isnt registered yet
        try:
            ns.lookup("OT3API")
            ns.lookup("robot-server-resource")
            uri = ns.lookup("ot-protocol")
            break
        except Exception:
            await asyncio.sleep(0.01)
            retries_counter += 1

    # Stop waiting for the nameserver, will fail on pyro.resolve (something is wrong with nameserver and/or daemon)
    if uri is None:
        raise TimeoutError(
            "TEST FAILURE ON PYRO NAMESERVER IN DIRECTED RUN PROCESS SETUP."
        )
    protocol_proxy = pyro.Proxy(uri)  # type: ignore
    protocol_async = AsyncClientPyroObject(protocol_proxy)
    run_process = cast(DirectedRunProcess, cast(object, protocol_async))
    return run_process


### Parameters mocked out resource
SKIP_CALLABLE_PROXY = Literal['SKIP_THIS']  # NOTE: We skip these in the initial pass because they are going to be proxy instances
SKIP_KEYS = ["command"] # NOTE: List of keys to skip checks for

PARAMETERS_MOCK_TABLE: Dict[str, Dict[type, Any]] = {
    "axes": {
        Sequence[hw_types.Axis]: [hw_types.Axis.X, hw_types.Axis.Y, hw_types.Axis.Z],
        Optional[List[hw_types.Axis]]: [hw_types.Axis.X, hw_types.Axis.Y, hw_types.Axis.Z],
    },
    "mount": {
        hw_types.OT3Mount: hw_types.OT3Mount.LEFT,
        Union[ot_types.Mount, hw_types.OT3Mount]: ot_types.Mount.LEFT,
        Union[ot_types.Mount, hw_types.OT3Mount, type(None)]: None,
    },
    "duration_s": {float: 1.0, int: 1},
    "primary": {bool: True},
    "critical_point": {Optional[hw_types.CriticalPoint]: hw_types.CriticalPoint.MOUNT},
    "refresh": {bool: True},
    "fail_on_not_homed": {bool: False},
    "axis": {hw_types.Axis: hw_types.Axis.X},
    "module_id": {str: "module-id"},
    "slot": {str: "D1"},
    "offset": {ot_types.Point: ot_types.Point(0, 0, 0)},
    "rate": {float: 1.0},
    "follow_singular_sensor": {Optional[hw_types.InstrumentProbeType]: hw_types.InstrumentProbeType.PRIMARY},
    "skip": {Optional[List[hw_types.Axis]]: [hw_types.Axis.X]},
    "top": {Optional[float]: 1.0},
    "bottom": {Optional[float]: 0.0},
    "blow_out": {Optional[float]: 1.0},
    "drop_tip": {Optional[float]: 1.0},
    "abs_position": {ot_types.Point: ot_types.Point(1, 2, 3)},
    "speed": {Optional[float]: 10.0, float: 10.0},
    "max_speeds": {Optional[Dict[hw_types.Axis, float]]: {hw_types.Axis.X: 100.0}},
    "expect_stalls": {bool: False},
    "which": {List[hw_types.Axis]: [hw_types.Axis.X, hw_types.Axis.Y]},
    "expected_grip_width": {float: 5.0},
    "grip_width_uncertainty_wider": {float: 0.5},
    "grip_width_uncertainty_narrower": {float: 0.5},
    "disable_geometry_grip_check": {bool: False},
    "volume": {Optional[float]: 50.0, float: 50.0},
    "correction_volume": {float: 1.0},
    "kwargs": {Any: {}},
    "machine_pos": {Dict[hw_types.Axis, float]: {hw_types.Axis.X: 0.0}},
    "button": {Optional[bool]: True},
    "rails": {Optional[bool]: True},
    "taskify": {bool: False},
    "instrument_data": {
        dev_types.AttachedGripper: dev_types.AttachedGripper(config=gc.load(GripperModel.v1), id="test"),
        dev_types.AttachedPipette: dev_types.AttachedPipette(
            config=load_pipette_data.load_definition(
                pipette_types.PipetteModelType("p1000"),
                pipette_types.PipetteChannelType(1),
                pipette_types.PipetteVersionType(major=3, minor=3),
                pipette_types.PipetteOEMType(pipette_types.PipetteOEMType.OT),
            ),
            id="fakepip",
        ),
    },
    "position": {Mapping[hw_types.Axis, float]: {hw_types.Axis.X: 0.0}},
    "message": {str: "message"},
    "acceleration": {float: 10.0},
    "subsystems": {Optional[Set[hw_types.SubSystem]]: [hw_types.SubSystem.gantry_x]},
    "force": {bool: False},
    "aspirate": {Optional[float]: 1.0},
    "dispense": {Optional[float]: 1.0},
    "state": {hw_types.StatusBarState: hw_types.StatusBarState.IDLE},
    "home_after": {bool: False},
    "ignore_plunger": {bool: False},
    "scrape_type": {hw_types.TipScrapeType: hw_types.TipScrapeType.NONE},
    "push_out": {Optional[float]: 1.0},
    "is_full_dispense": {bool: False},
    "enabled": {bool: True},
    "expected": {hw_types.TipStateType: hw_types.TipStateType.ABSENT},
    "presses": {Optional[int]: 1},
    "increment": {Optional[float]: 1.0},
    "tip_length": {float: 10.0},
    "allow_home_other": {bool: False},
    "require": {
        Optional[
            Dict[
                ot_types.Mount,
                Literal[
                    "p10_single",
                    "p10_multi",
                    "p20_single_gen2",
                    "p20_multi_gen2",
                    "p50_single",
                    "p50_multi",
                    "p50_single_flex",
                    "p50_multi_flex",
                    "p300_single",
                    "p300_multi",
                    "p300_single_gen2",
                    "p300_multi_gen2",
                    "p1000_single",
                    "p1000_single_gen2",
                    "p1000_single_flex",
                    "p1000_multi_flex",
                    "p1000_multi_em_flex",
                    "p1000_96",
                    "p200_96",
                ],
            ]
        ]: {ot_types.Mount.LEFT: "p1000_single"}
    },
    "skip_if_would_block": {bool: False},
    "model": {
        Union[
            module_types.MagneticModuleModel,
            module_types.TemperatureModuleModel,
            module_types.ThermocyclerModuleModel,
            module_types.HeaterShakerModuleModel,
            module_types.MagneticBlockModel,
            module_types.AbsorbanceReaderModel,
            module_types.FlexStackerModuleModel,
            module_types.VacuumModuleModel,
        ]: module_types.ThermocyclerModuleModel.THERMOCYCLER_V2,
        peripheral_types.BarcodeScannerModel: peripheral_types.BarcodeScannerModel.BARCODE_SCANNER_V1,
    },
    "sim_serial": {Optional[str]: "SIM123"},
    "distance": {float: 5.0},
    "margin": {float: 1.0},
    "probe": {
        hw_types.GripperProbe: hw_types.GripperProbe.FRONT,
        Optional[hw_types.InstrumentProbeType]: None,
    },
    "tiprack_diameter": {float: 5.0},
    "force_newtons": {Optional[float]: 1.0},
    "stay_engaged": {bool: False},
    "to_default": {bool: False},
    "pause_type": {hw_types.PauseType: hw_types.PauseType.PAUSE},
    "req_instr": {
        Optional[
            Literal[
                "p10_single",
                "p10_multi",
                "p20_single_gen2",
                "p20_multi_gen2",
                "p50_single",
                "p50_multi",
                "p50_single_flex",
                "p50_multi_flex",
                "p300_single",
                "p300_multi",
                "p300_single_gen2",
                "p300_multi_gen2",
                "p1000_single",
                "p1000_single_gen2",
                "p1000_single_flex",
                "p1000_multi_flex",
                "p1000_multi_em_flex",
                "p1000_96",
                "p200_96",
            ]
        ]: "p1000_single_flex"
    },
    "config": {Union[config_types.OT3Config, config_types.RobotConfig]: mock_config},  # CASEY NOTE: we know were serializing these right now, but we need to add them to this test eventually - make a todo?
    "z_speed": {float: 10.0},
    "samples_for_baselining": {int: 1},
    "sample_time_sec": {float: 0.1},
    "liquid_class": {str: "water"},
    "acquire_lock": {bool: False},
    "delta": {ot_types.Point: ot_types.Point(0, 0, 1)},
    "gantry_load": {config_types.GantryLoad: config_types.GantryLoad.HIGH_THROUGHPUT_1000},
    "serial_number": {str: "SERIAL123"},
    "disengage_before_stopping": {bool: False},
    "moving_axis": {hw_types.Axis: hw_types.Axis.Z_L},
    "target_pos": {float: 1.0},
    "pass_settings": {config_types.CapacitivePassSettings: config_types.CapacitivePassSettings(
            prep_distance_mm=1.0,
            max_overrun_distance_mm=2.0,
            speed_mm_per_s=3.0,
            sensor_threshold_pf=5.0
        )
    },
    "retract_after": {bool: False},
    "back_left_nozzle": {Optional[str]: "A1"},
    "front_right_nozzle": {Optional[str]: "H12"},
    "starting_nozzle": {Optional[str]: "A1"},
    "jaw_width_mm": {int: 10},
    "begin": {ot_types.Point: ot_types.Point(0, 0, 0)},
    "end": {ot_types.Point: ot_types.Point(1, 1, 1)},
    "speed_mm_s": {float: 5.0},
    "turn_on": {bool: True},
    "duty_cycle": {int: 50},
    "refresh_state": {bool: True},
    "listener": {Callable[[hw_types.StatusBarUpdateEvent], None]: SKIP_CALLABLE_PROXY}, # CASEY NOTE: might be able to ignore because this will go to the proxy ones
    "cp_override": {Optional[hw_types.CriticalPoint]: hw_types.CriticalPoint.MOUNT},
    "robot_calibration": {
        "OT3Transforms": OT3Transforms(
            deck_calibration=DeckCalibration(
                attitude= [[0.0, 1.0]],
                source= calibration_types.SourceType.default,
                status= calibration_types.CalibrationStatus(
                    markedBad=False,
                    source=calibration_types.SourceType.default,
                    markedAt=datetime.now(),
                ),
                belt_attitude = None,
                last_modified = datetime.now(),
                pipette_calibrated_with = None,
                tiprack = None,
            ),
            carriage_offset=ot_types.Point(1,1,1),
            left_mount_offset=ot_types.Point(1,1,1),
            right_mount_offset=ot_types.Point(1,1,1),
            gripper_mount_offset=ot_types.Point(1,1,1),
        ),
    },
    "prep_after": {bool: False},
    "recalibrate_jaw_width": {bool: False},
    "uv_duration_s": {int: 1},
    "max_z_dist": {float: 1.0},
    "probe_settings": {Optional[config_types.LiquidProbeSettings]: config_types.LiquidProbeSettings(
            mount_speed=1.0,
            plunger_speed=2.0,
            plunger_impulse_time=3.0,
            sensor_threshold_pascals=4.0,
            aspirate_while_sensing=False,
            z_overlap_between_passes_mm=5.0,
            plunger_reset_offset=6.0,
            samples_for_baselining=1,
            sample_time_sec=7.0,
        )
    },
    "force_both_sensors": {bool: False},
    "response_queue": {
        Optional[asyncio.Queue[Dict[hw_types.PipetteSensorId, List[hw_types.PipetteSensorData]]]]: None # CASEY NOTE may have to come back to this one
    },
    "check_bounds": {hw_types.MotionChecks: hw_types.MotionChecks.NONE},
    "end_point": {ot_types.Point: ot_types.Point(1, 1, 1)},
    "movement_delay": {Optional[float]: 0.0},
    "end_critical_point": {Optional[hw_types.CriticalPoint]: hw_types.CriticalPoint.MOUNT},
    "tip_volume": {float: 50.0},
    "notify_publishers": {Callable[[], None]: SKIP_CALLABLE_PROXY},
    "run_orchestrator_store": {"RunOrchestratorStore": cast(RunOrchestratorStore, object())},
    "camera_provider": {CameraProvider: CameraProvider()},
    "maintenance_run_orchestrator_store": {
        "MaintenanceRunOrchestratorStore": cast(MaintenanceRunOrchestratorStore, object())
    },
    "file_provider": {FileProvider: FileProvider()},
    "deck_configuration_store": {"DeckConfigurationStore": mock_deck_configuration_store},
}

 # ERROR COLLECTION LISTS
class ErrorCollections(BaseModel):
    missing_serialization_list: list[Any] # NOTE: If errors are collected in this it means we haven't serialized a datatype for Pyro5/Serpent
    missing_params_list: list[Any] # NOTE: If errors are collected in this it means we are missing mocks/dummy data for a given param/type pairing in the PARAMETERS_MOCK_TABLE
    alternative_errors_list: list[Any] # NOTE: If errors are collected in this it means some unknown alternative issue occurred during a request.
                                 # Cases that result in alternative errors include a type being serialized incorrected (such as an Enum turing into a string),
                                 # or a body not being fully mocked (no backend on OT3API for example).

async def _collect_proxy_attribute_information(original_class: type, acpo_instance: Any) -> ErrorCollections:
    """Scrape over the provided proxy to gather as much information on parameters, mock errors and serialization as possible."""
    missing_serialization_list = []
    missing_params_list = []
    alternative_errors_list = []
    # Grab the inner proxies for all these safely wrapped results, we'll use these to troll through the metadata
    proxy: pyro.Proxy = acpo_instance._proxy  # type: ignore
    proxy._pyroBind()  # type: ignore

    # COLLECT INFORMATION FROM ALL THE EXPOSED METHODS
    proxy_methods: list[str] = getattr(proxy, "get_pyro_attributes_with_proxy_result")
    async_methods: dict[str, dict[str, Any]] = getattr(proxy, "get_pyro_async_methods")

    for method in proxy._pyroMethods:
        if method not in proxy_methods:
            ot3_async_wrapped_method = getattr(acpo_instance, method)
            original_class_method = getattr(original_class, method)
            kwargs: Dict[str, Any] = {}
            return_type: type = None
            for key, value in original_class_method.__annotations__.items():
                if key is not "return" and key not in SKIP_KEYS:
                    try:
                        kwargs[key] = PARAMETERS_MOCK_TABLE[key][value]
                    except KeyError as e:
                        missing_params_list.append("key: " + str(key) + " - type: " + str(value))
                else:
                    return_type = type(value)
            try:
                if SKIP_CALLABLE_PROXY not in kwargs.values() and not any(item in kwargs.keys() for item in SKIP_KEYS):
                    if method in async_methods.keys():
                        result = await ot3_async_wrapped_method(**kwargs)
                        assert isinstance(result, return_type) # CASEY NOTE: we technically must have deserialized correctly  if we didnt get an error, right? - no, because if it returns None due to mocks thats an error too?
                    else:
                        result = ot3_async_wrapped_method(**kwargs)
                        assert isinstance(result, return_type)
            except Exception as e:
                if "serialize" in str(e):
                    missing_serialization_list.append(str(e))
                else:
                    alternative_errors_list.append(f" Method {method} encountered: "+str(e))
    
    # COLLECT ALL THE INFORMATION ON THE EXPOSED PROPERTIES
    for attribute in proxy._pyroAttrs:
        if attribute not in proxy_methods:
            try:
                ot3_async_wrapped_attribute_result = getattr(acpo_instance, attribute)
                # other logic in here?
                try:
                    original_class_attribute = getattr(original_class, attribute)
                    return_type = inspect.signature(original_class_attribute.fget).return_annotation
                    if not isinstance(ot3_async_wrapped_attribute_result, return_type):
                        alternative_errors_list.append(f"ERROR: Result of property {attribute} is type: {type(ot3_async_wrapped_attribute_result)} when expected: {return_type}")

                except AttributeError:
                    # Some of the attributes are Pyro-object only metadata so this may fail. This is fine so long as the wrapped async getattr doesn't throw.
                    pass
                
            except Exception as e:
                if "serialize" in str(e):
                    missing_serialization_list.append(str(e))
                else:
                    alternative_errors_list.append(str(e))
    
    # CASEY NOTE --- right here we should scrape any proxy result that returns a wrapped class like modules and then troll through those like above - maybe move the above to be in generic callers
    # THAT GENERIC CALLERS THING WILL NEED TO HAPPEN
    # CASEY NOTE: try the inner proxies that come from get_pyro_attributes_with_proxy_result for each of these APIs as well! <-- THIS WILL BE REALLY IMPORTANT TO DO
    return ErrorCollections(
        missing_serialization_list=missing_serialization_list,
        missing_params_list=missing_params_list,
        alternative_errors_list=alternative_errors_list,
    )

def _raise_if_errors(process: str, error_collection: ErrorCollections) -> None:
    """Raise when errors found in a given process interface.

    NOTE: The raise in order of priority. The goal is to identify anything that hasn't been serialized, but in order to do that we need to be sure that:
        1. All expected parameters are full mocked out or filled with valid dummy data
        2. All callable methods/attributes are capable of being called successfully
    """
    if len(error_collection.missing_params_list) > 0:
        raise AttributeError(f"PROCESS: {process} - MISSING PARAMS IN MOCK TABLE:\n{''.join(str(param) + "\n" for param in error_collection.missing_params_list)}")
    
    if len(error_collection.alternative_errors_list) > 0:
        raise ValueError(f"PROCESS: {process} - ERRORS DURING INTERPROCESS COVERAGE TESTS:\n{''.join(str(error) + "\n" for error in error_collection.alternative_errors_list)}")
    
    # NOTE: If this raises, its time to add some new serializations to an appropriate process library! Get to it!
    if len(error_collection.missing_serialization_list) > 0:
        raise ValueError(f"PROCESS: {process} - MISSING PYRO/SERPENT SERIALIZATIONS - TOTAL UNSERIALIZED: {len(error_collection.missing_serialization_list)}\n{''.join(str(serializaiton) + "\n" for serializaiton in error_collection.missing_serialization_list)}")
    


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
    ot3api = await _setup_OT3API_pyro_resource(
        hw_api=ot3_hardware_api, name_server_ready=name_server_ready
    )
    robot_server = await _setup_robot_server_pyro_resource(
        app_state=mock_app_state,
        name_server_ready=name_server_ready,
        ot3_api_async_proxy=ot3api,
        run_process_provider=mock_run_process_pyro_provider,
        deck_configuration_store=mock_deck_configuration_store,
    )
    run_process = await _setup_directed_run_process_pyro_resource(
        name_server_ready=name_server_ready
    )

    # Check the OT3API process for serialization, parameter or alternative errors
    #ot3_error_collection = await _collect_proxy_attribute_information(original_class=OT3API, acpo_instance=ot3api)
    #_raise_if_errors(process="OT3API", error_collection=ot3_error_collection)

    # Check the ROBOT-SERVER process for serialization, parameter or alternative errors
    # robot_server_error_collection = await _collect_proxy_attribute_information(original_class=pyro_resource.RobotServerPyroResource, acpo_instance=robot_server)
    # _raise_if_errors(process="ROBOT-SERVER", error_collection=robot_server_error_collection)

    # Check the DIRECTED-RUN process for serialization, parameter or alternative errors
    directed_run_error_collection = await _collect_proxy_attribute_information(original_class=DirectedRunProcess, acpo_instance=run_process)
    _raise_if_errors(process="DIRECTED-RUN", error_collection=directed_run_error_collection)
