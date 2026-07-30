"""Tests to enforce serialization for dataclasses from the hardware api layer."""

import asyncio
import inspect
import socket
import threading
from dataclasses import is_dataclass
from typing import Any, get_args, get_type_hints, Union, Dict
from pathlib import Path

from datetime import datetime

import opentrons.hardware_control.types as hw_types
import opentrons.hardware_control.dev_types as dev_types
import opentrons.hardware_control.modules.mod_abc as mod_abc
import opentrons.hardware_control.modules.types as module_types
import opentrons.hardware_control.peripherals.types as peripheral_types
import opentrons_shared_data.pipette.types as pipette_types
import opentrons.types as ot_types
import opentrons.config.types as config_types
from opentrons_shared_data.pipette import (
    load_data as load_pipette_data,
)
from opentrons.hardware_control.ot3_calibration import OT3Transforms
from opentrons.hardware_control.robot_calibration import DeckCalibration
import opentrons.calibration_storage.types as calibration_types
from opentrons.config import gripper_config as gc
import opentrons.drivers.types as driver_types
import opentrons.drivers.vacuum_module.types as vac_types

import pytest
from decoy import Decoy
from Pyro5 import api as pyro
from Pyro5 import nameserver

from opentrons_shared_data.robot.types import RobotTypeEnum

from opentrons.config import feature_flags
from opentrons.config.types import RobotConfig
from opentrons.drivers.heater_shaker.simulator import SimulatingDriver
from opentrons.drivers.thermocycler.simulator import (
    SimulatingDriver as ThermocyclerSimulatingDriver,
)
from opentrons.drivers.vacuum_module.simulator import (
    SimulatingDriver as VacuumModuleSimulatingDriver,
)
from opentrons.hardware_control import ThreadManager, modules
from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control.modules import (
    AbsorbanceReader,
    FlexStacker,
    HeaterShaker,
    ModuleModel,
    TempDeck,
    Thermocycler,
    VacuumModule,
)
from opentrons.hardware_control.modules.types import (
    MagneticBlockModel,
    SimulatingModule,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.poller import Poller
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    HARDWARE_CLASS_PACKAGES,
    register_hardware_types,
)
from opentrons.hardware_control.types import DoorState
from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
from opentrons.util.pyro.pyro_serialization import find_opentrons_classes_in_packages
from opentrons_shared_data.gripper import GripperModel

TEST_PYRO_TIMEOUT = 5

# List of types to not validate, always list a reason
_TYPES_TO_SKIP = [
    RobotConfig,  # OT-2 Only
    SimulatingModule,  # Only used in OT3API build methods, irrelevant to clients
]


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
    """Real OT3API backed by the software simulator, bound to a dedicated event loop.

    Pyro serves OT3API by binding class methods to the core object
    (``MethodType(OT3API.method, core_obj)``), so ``decoy.when`` stubs on a mock
    instance do not replace method bodies. A simulator-backed API provides the
    ``_backend``, pipette/gripper handlers, and positions those methods expect.
    """
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


@pytest.fixture
def mock_driver(decoy: Decoy) -> SimulatingDriver:
    """Get a mocked simulating driver."""
    return decoy.mock(cls=SimulatingDriver)


@pytest.fixture
def mock_thermo_driver(decoy: Decoy) -> ThermocyclerSimulatingDriver:
    """Get a mocked simulating driver of the thermocycler."""
    return decoy.mock(cls=ThermocyclerSimulatingDriver)


@pytest.fixture
def mock_vm_driver(decoy: Decoy) -> VacuumModuleSimulatingDriver:
    """Get a mocked simulating driver of the vacuum module."""
    return decoy.mock(cls=VacuumModuleSimulatingDriver)


@pytest.fixture
async def tc_reader_mocked_driver(
    mock_thermo_driver: SimulatingDriver,
) -> modules.thermocycler.ThermocyclerReader:
    """A reader with a mocked driver."""
    return modules.thermocycler.ThermocyclerReader(driver=mock_thermo_driver)  # type: ignore


@pytest.fixture
async def hs_reader_mocked_driver(
    mock_driver: SimulatingDriver,
) -> modules.heater_shaker.HeaterShakerReader:
    """A reader with a mocked driver."""
    return modules.heater_shaker.HeaterShakerReader(driver=mock_driver)


@pytest.fixture
async def td_reader_mocked_driver(
    mock_driver: SimulatingDriver,
) -> modules.tempdeck.TempDeckReader:
    """A reader with a mocked driver."""
    return modules.tempdeck.TempDeckReader(driver=mock_driver)  # type: ignore


@pytest.fixture
async def ar_reader_mocked_driver(
    mock_driver: SimulatingDriver,
) -> modules.absorbance_reader.AbsorbanceReaderReader:
    """A reader with a mocked driver."""
    return modules.absorbance_reader.AbsorbanceReaderReader(driver=mock_driver)  # type: ignore


@pytest.fixture
async def vm_reader_mocked_driver(
    mock_driver: SimulatingDriver,
) -> modules.vacuum_module.VacuumModuleReader:
    """A reader with a mocked driver."""
    return modules.vacuum_module.VacuumModuleReader(driver=mock_driver)  # type: ignore


@pytest.fixture
async def st_reader_mocked_driver(
    mock_driver: SimulatingDriver,
) -> modules.flex_stacker.FlexStackerReader:
    """A reader with a mocked driver."""
    return modules.flex_stacker.FlexStackerReader(driver=mock_driver)  # type: ignore


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
    hw_api: ThreadManager[OT3API],
    name_server_ready: threading.Event,
) -> OT3API:
    """Set up a thread running an OT3API pyro resource and publish it on the nameserver."""

    def _ot3api_pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", hw_api.managed_obj, register_hardware_types)

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
    ot3_async = AsyncClientPyroObject(ot3_proxy, force_synchronous=False)
    return ot3_async  # type: ignore


def _is_namedtuple_instance(cls: Any) -> bool:
    try:
        return issubclass(cls, tuple) and hasattr(cls, "_fields")
    except TypeError:
        return False


def _collect_exposed_dataclasses_and_namedtuples(  # noqa: C901
    original_class: type, acpo_instance: Any
) -> list[type]:
    """Scrape over the provided proxy to gather as much information on exposed dataclasses and named tuples"""
    class_list: list[type] = []
    seen: set[int] = set()
    proxy: pyro.Proxy = acpo_instance._proxy
    proxy._pyroBind()  # type: ignore
    pyro_methods: list[str] = getattr(proxy, "get_pyro_attributes_with_proxy_result")
    pyro_methods.append("get_pyro_async_methods")
    pyro_methods.append("get_pyro_attributes_with_proxy_result")

    def _resolve_type_hints(obj: Any, attr_name: str) -> dict[str, Any]:
        try:
            return get_type_hints(obj)
        except Exception as e:
            raise ValueError(
                f"Could not resolve type hints for {original_class.__name__}.{attr_name}: {e}"
            ) from e

    def _collect_serializable_types(
        hint: Any, collected: list[type], seen: set[int]
    ) -> None:
        if id(hint) in seen:
            return
        seen.add(id(hint))
        if (
            isinstance(hint, type)
            and (is_dataclass(hint) or _is_namedtuple_instance(hint))
            and hint not in _TYPES_TO_SKIP
        ):
            collected.append(hint)
        for arg in get_args(hint):
            for inner in arg if isinstance(arg, list) else [arg]:
                _collect_serializable_types(inner, collected, seen)

    # Scrape the exposed methods
    for method in proxy._pyroMethods:
        if not hasattr(original_class, method):
            continue
        original_class_method = getattr(original_class, method)
        hints = _resolve_type_hints(original_class_method, method)
        if method in pyro_methods:
            hints.pop("return", None)
        for value in hints.values():
            _collect_serializable_types(value, class_list, seen)

    # Scrape the exposed properties
    for attribute in proxy._pyroAttrs:
        if attribute in pyro_methods:
            continue
        original_class_attribute = getattr(original_class, attribute)
        hints = _resolve_type_hints(original_class_attribute.fget, attribute)
        for value in hints.values():
            _collect_serializable_types(value, class_list, seen)

    return class_list


async def test_serialization_coverage(
    decoy: Decoy,
    ot3_hardware: ThreadManager[OT3API],
    mock_driver: SimulatingDriver,
    tc_reader_mocked_driver: modules.thermocycler.ThermocyclerReader,
    hs_reader_mocked_driver: modules.heater_shaker.HeaterShakerReader,
    td_reader_mocked_driver: modules.tempdeck.TempDeckReader,
    vm_reader_mocked_driver: modules.vacuum_module.VacuumModuleReader,
    ar_reader_mocked_driver: modules.absorbance_reader.AbsorbanceReaderReader,
    st_reader_mocked_driver: modules.flex_stacker.FlexStackerReader,
    mock_feature_flags: None,
) -> None:
    """Test will check for serialization coverage of dataclasses and named tuples exposed by the OT3API and subsequent Module APIs."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(True)

    wrapped_api = ot3_hardware.wrapped()
    wrapped_api._backend.module_controls = decoy.mock(cls=AttachedModulesControl)
    tc = decoy.mock(cls=Thermocycler)
    hs = decoy.mock(cls=HeaterShaker)
    td = decoy.mock(cls=TempDeck)
    td_2 = decoy.mock(cls=TempDeck)
    vm = decoy.mock(cls=VacuumModule)
    st = decoy.mock(cls=FlexStacker)
    ar = decoy.mock(cls=AbsorbanceReader)
    decoy.when(wrapped_api._backend.module_controls.available_modules).then_return(
        [tc, hs, td, td_2, vm, st, ar]
    )
    for mod in wrapped_api._backend.module_controls.available_modules:
        decoy.when(mod._driver).then_return(mock_driver)  # type: ignore

    # Mock out the pollers for these modules that will be stopped
    decoy.when(tc._poller).then_return(Poller(tc_reader_mocked_driver, interval=0.01))
    decoy.when(hs._poller).then_return(Poller(hs_reader_mocked_driver, interval=0.01))
    decoy.when(td._poller).then_return(Poller(td_reader_mocked_driver, interval=0.01))
    decoy.when(td_2._poller).then_return(Poller(td_reader_mocked_driver, interval=0.01))
    decoy.when(vm._poller).then_return(Poller(vm_reader_mocked_driver, interval=0.01))
    decoy.when(st._poller).then_return(Poller(st_reader_mocked_driver, interval=0.01))
    decoy.when(ar._poller).then_return(Poller(ar_reader_mocked_driver, interval=0.01))

    name_server_ready = threading.Event()

    await _setup_namerserver(name_server_ready=name_server_ready)
    ot3api_async_instance = await _setup_OT3API_pyro_resource(
        ot3_hardware,
        name_server_ready,
    )

    # Assert that there are as many testable proxy modules as there are actual modules for integration coverage
    # DEVELOPER NOTE: if this part is failing, you need to add a missing module to the module mocks above.
    modules_list_NO_MAG_BLOCK = tuple(
        arg for arg in get_args(ModuleModel) if arg != MagneticBlockModel
    )
    assert len(ot3api_async_instance.attached_modules) == len(modules_list_NO_MAG_BLOCK)

    # Collect classes from the OT3API
    class_cover_list = _collect_exposed_dataclasses_and_namedtuples(
        original_class=OT3API, acpo_instance=ot3api_async_instance
    )

    hardware_registry_class_list = find_opentrons_classes_in_packages(
        HARDWARE_CLASS_PACKAGES
    )
    hardware_registry_class_list = list(set(hardware_registry_class_list))

    # Collect classes from the Module APIs
    mod_counter = 0
    for module in wrapped_api.attached_modules:
        class_cover_list = (
            class_cover_list
            + _collect_exposed_dataclasses_and_namedtuples(
                original_class=module.__class__,
                acpo_instance=ot3api_async_instance.attached_modules[mod_counter],
            )
        )
        class_cover_list = list(set(class_cover_list))
        mod_counter += 1

    for item in class_cover_list:
        if hasattr(item, "to_pyro_dict") and hasattr(item, "from_pyro_dict"):
            return_type = get_type_hints(item.from_pyro_dict).get("return")
            try:
                assert return_type is item
            except Exception as e:
                raise ValueError(
                    f"{e} - type missmatch for 'from_pyro_dict' of type: {item}"
                )
        elif is_dataclass(item) or _is_namedtuple_instance(item):
            raise ValueError(f"Pyro Serialization missing for {item}.")


async def test_module_registration_coverage(
    decoy: Decoy,
    ot3_hardware: ThreadManager[OT3API],
    mock_driver: SimulatingDriver,
    tc_reader_mocked_driver: modules.thermocycler.ThermocyclerReader,
    hs_reader_mocked_driver: modules.heater_shaker.HeaterShakerReader,
    td_reader_mocked_driver: modules.tempdeck.TempDeckReader,
    vm_reader_mocked_driver: modules.vacuum_module.VacuumModuleReader,
    ar_reader_mocked_driver: modules.absorbance_reader.AbsorbanceReaderReader,
    st_reader_mocked_driver: modules.flex_stacker.FlexStackerReader,
    mock_feature_flags: None,
) -> None:
    """Test will check for to see if the hardware class package used in registration covers exposed dataclasses and namedtuples."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(True)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(True)

    wrapped_api = ot3_hardware.wrapped()
    wrapped_api._backend.module_controls = decoy.mock(cls=AttachedModulesControl)
    tc = decoy.mock(cls=Thermocycler)
    hs = decoy.mock(cls=HeaterShaker)
    td = decoy.mock(cls=TempDeck)
    td_2 = decoy.mock(cls=TempDeck)
    vm = decoy.mock(cls=VacuumModule)
    st = decoy.mock(cls=FlexStacker)
    ar = decoy.mock(cls=AbsorbanceReader)
    decoy.when(wrapped_api._backend.module_controls.available_modules).then_return(
        [tc, hs, td, td_2, vm, st, ar]
    )
    for mod in wrapped_api._backend.module_controls.available_modules:
        decoy.when(mod._driver).then_return(mock_driver)  # type: ignore

    # Mock out the pollers for these modules that will be stopped
    decoy.when(tc._poller).then_return(Poller(tc_reader_mocked_driver, interval=0.01))
    decoy.when(hs._poller).then_return(Poller(hs_reader_mocked_driver, interval=0.01))
    decoy.when(td._poller).then_return(Poller(td_reader_mocked_driver, interval=0.01))
    decoy.when(td_2._poller).then_return(Poller(td_reader_mocked_driver, interval=0.01))
    decoy.when(vm._poller).then_return(Poller(vm_reader_mocked_driver, interval=0.01))
    decoy.when(st._poller).then_return(Poller(st_reader_mocked_driver, interval=0.01))
    decoy.when(ar._poller).then_return(Poller(ar_reader_mocked_driver, interval=0.01))

    name_server_ready = threading.Event()

    await _setup_namerserver(name_server_ready=name_server_ready)
    ot3api_async_instance = await _setup_OT3API_pyro_resource(
        ot3_hardware,
        name_server_ready,
    )

    # Assert that there are as many testable proxy modules as there are actual modules for integration coverage
    # DEVELOPER NOTE: if this part is failing, you need to add a missing module to the module mocks above.
    modules_list_NO_MAG_BLOCK = tuple(
        arg for arg in get_args(ModuleModel) if arg != MagneticBlockModel
    )
    assert len(ot3api_async_instance.attached_modules) == len(modules_list_NO_MAG_BLOCK)

    # Collect classes from the OT3API
    class_cover_list = _collect_exposed_dataclasses_and_namedtuples(
        original_class=OT3API, acpo_instance=ot3api_async_instance
    )

    hardware_registry_class_list = find_opentrons_classes_in_packages(
        HARDWARE_CLASS_PACKAGES
    )
    hardware_registry_class_list = list(set(hardware_registry_class_list))

    # Collect classes from the Module APIs
    mod_counter = 0
    for module in wrapped_api.attached_modules:
        class_cover_list = (
            class_cover_list
            + _collect_exposed_dataclasses_and_namedtuples(
                original_class=module.__class__,
                acpo_instance=ot3api_async_instance.attached_modules[mod_counter],
            )
        )
        class_cover_list = list(set(class_cover_list))
        mod_counter += 1

    assert set(class_cover_list) == set(hardware_registry_class_list)

CLASS_TYPE_MOCK_TABLE: Dict[type, Any] = {
    hw_types.Axis: hw_types.Axis.X,
    hw_types.OT3Mount: hw_types.OT3Mount.LEFT,
    ot_types.Mount: ot_types.Mount.LEFT,
    hw_types.CriticalPoint: hw_types.CriticalPoint.MOUNT,
    ot_types.Point: ot_types.Point(1, 2, 3),
    hw_types.InstrumentProbeType: hw_types.InstrumentProbeType.PRIMARY,
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
    hw_types.SubSystem: hw_types.SubSystem.gantry_x,
    hw_types.StatusBarState: hw_types.StatusBarState.IDLE,
    hw_types.TipScrapeType: hw_types.TipScrapeType.LEFT_ONE_COL,
    hw_types.TipStateType: hw_types.TipStateType.ABSENT,
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
    hw_types.GripperProbe: hw_types.GripperProbe.FRONT,
    hw_types.InstrumentProbeType: None,
    hw_types.PauseType: hw_types.PauseType.PAUSE,
    config_types.GantryLoad: config_types.GantryLoad.HIGH_THROUGHPUT_1000,
    config_types.CapacitivePassSettings: config_types.CapacitivePassSettings(
        prep_distance_mm=1.0,
        max_overrun_distance_mm=2.0,
        speed_mm_per_s=3.0,
        sensor_threshold_pf=5.0
    ),
    hw_types.CriticalPoint: hw_types.CriticalPoint.MOUNT,
    OT3Transforms: OT3Transforms(
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
    config_types.LiquidProbeSettings: config_types.LiquidProbeSettings(
        mount_speed=1.0,
        plunger_speed=2.0,
        plunger_impulse_time=3.0,
        sensor_threshold_pascals=4.0,
        aspirate_while_sensing=False,
        z_overlap_between_passes_mm=5.0,
        plunger_reset_offset=6.0,
        samples_for_baselining=1,
        sample_time_sec=7.0,
    ),
    hw_types.PipetteSensorId: hw_types.PipetteSensorId.S1,
    hw_types.PipetteSensorData: hw_types.PipetteSensorData(sensor_type=hw_types.PipetteSensorType.capacitive, _as_int=0x01, _as_float=0x01),
    hw_types.MotionChecks: hw_types.MotionChecks.HIGH,
    driver_types.ABSMeasurementConfig: driver_types.ABSMeasurementConfig(measure_mode=driver_types.ABSMeasurementMode.SINGLE, sample_wavelengths=[100, 200], reference_wavelength=100),
    module_types.BundledFirmware: module_types.BundledFirmware(version="v1", path=Path("coolpath")),
    vac_types.PumpState: vac_types.PumpState(target_rpm=0.1, current_rpm=0.2, target_pwm=1.5, current_pwm=2.5, pump_running=False, manual_control=True),
    hw_types.ModuleConnectedNotification: hw_types.ModuleConnectedNotification(module_serial="123", name="coolmod", port="456", event=hw_types.HardwareEventType.MODULE_CONNECTED)
}

 # ERROR COLLECTION LISTS



def test_serialization_validation() -> None:
    """Test to check if types registered in the hardware class package properly serialize and deserialize."""

    hardware_registry_class_list = find_opentrons_classes_in_packages(
            HARDWARE_CLASS_PACKAGES
        )
    hardware_registry_class_list = list(set(hardware_registry_class_list))

    for clazz in hardware_registry_class_list:
        try:
            serializable_dict = clazz.to_pyro_dict(CLASS_TYPE_MOCK_TABLE[clazz])
        except KeyError as e:
            raise KeyError(f"{e} - Mock data missing for type {clazz}")

        deserialized_output = clazz.from_pyro_dict("dummy_classname", serializable_dict)
        assert deserialized_output == CLASS_TYPE_MOCK_TABLE[clazz]