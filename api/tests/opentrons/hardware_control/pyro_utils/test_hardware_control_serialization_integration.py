"""Tests to enforce serialization for dataclasses from the hardware api layer."""

import asyncio
import enum
import inspect
import socket
import threading
from dataclasses import is_dataclass
from datetime import datetime
from enum import StrEnum
from pathlib import Path
from typing import Any, Dict, get_args, get_type_hints

import pytest
from decoy import Decoy
from pydantic import BaseModel
from Pyro5 import api as pyro
from Pyro5 import nameserver

import opentrons_hardware.firmware_bindings.messages.message_definitions as hw_message_defs
import opentrons_hardware.firmware_bindings.messages.payloads as hw_message_payloads
import opentrons_hardware.firmware_bindings.utils as hw_binding_utils
import opentrons_shared_data.pipette.types as pipette_types
from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.errors.categories import ErrorCategories
from opentrons_shared_data.errors.exceptions import CommunicationError
from opentrons_shared_data.gripper import GripperModel
from opentrons_shared_data.pipette import (
    load_data as load_pipette_data,
)
from opentrons_shared_data.robot.types import RobotTypeEnum

import opentrons.calibration_storage.types as calibration_types
import opentrons.config.types as config_types
import opentrons.drivers.flex_stacker.types as stacker_types
import opentrons.drivers.rpi_drivers.types as rpi_types
import opentrons.drivers.types as driver_types
import opentrons.drivers.vacuum_module.types as vac_types
import opentrons.hardware_control.dev_types as dev_types
import opentrons.hardware_control.instruments.ot3.instrument_calibration as instr_calibration_types
import opentrons.hardware_control.modules.module_calibration as mod_cal
import opentrons.hardware_control.modules.types as module_types
import opentrons.hardware_control.peripherals.types as peripheral_types
import opentrons.hardware_control.types as hw_types
import opentrons.hardware_control.util as hw_util
import opentrons.types as ot_types
from opentrons.calibration_storage.ot3.models.v1 import CalibrationStatus
from opentrons.config import feature_flags
from opentrons.config import gripper_config as gc
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
from opentrons.hardware_control.ot3_calibration import OT3Transforms
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.poller import Poller
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    HARDWARE_CLASS_PACKAGES,
    HARDWARE_ENUM_PACKAGES,
    HARDWARE_PYDANTIC_PACKAGES,
    register_hardware_types,
)
from opentrons.hardware_control.robot_calibration import DeckCalibration
from opentrons.hardware_control.types import DoorState
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
from opentrons.util.pyro.pyro_proxy_utility import wait_for_proxy
from opentrons.util.pyro.pyro_serialization import (
    find_enums_in_packages,
    find_opentrons_classes_in_packages,
    find_pydantic_classes_in_packages,
)

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

    ot3_async = await wait_for_proxy(proxy_name="OT3API")
    return ot3_async  # type: ignore


async def _setup_and_validate_modules_on_OT3API_and_nameserver(
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
) -> OT3API:
    """This sets up a nameserver, an OT3API and modules for testing suites to crawl over."""
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

    return ot3api_async_instance


def _is_namedtuple_instance(cls: Any) -> bool:
    try:
        return issubclass(cls, tuple) and hasattr(cls, "_fields")
    except TypeError:
        return False


def _collect_serializable_types(  # noqa: C901
    hint: Any, collected: list[type], seen: set[int], type_qualifier: str
) -> None:
    if id(hint) in seen:
        return
    seen.add(id(hint))
    if type_qualifier == "dataclass_namedtuple":
        if (
            isinstance(hint, type)
            and (is_dataclass(hint) or _is_namedtuple_instance(hint))
            and hint not in _TYPES_TO_SKIP
        ):
            collected.append(hint)
    elif type_qualifier == "enum":
        try:
            if (
                issubclass(hint, enum.Enum)
                and hint is not enum.Enum
                and hint not in _TYPES_TO_SKIP
            ):
                collected.append(hint)
        except TypeError:
            # wrapped arguments can be capture on recursive checks
            pass
    elif type_qualifier == "pydantic":
        if (
            issubclass(hint, BaseModel)
            and hint is not BaseModel
            and hint not in _TYPES_TO_SKIP
        ):
            collected.append(hint)
    else:
        raise ValueError(f"Invalid type qualifier for test: {type_qualifier}")
    for arg in get_args(hint):
        for inner in arg if isinstance(arg, list) else [arg]:
            _collect_serializable_types(inner, collected, seen, type_qualifier)


def _collect_exposed_types(  # noqa: C901
    original_class: type, acpo_instance: Any, type_qualifier: str
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

    # Scrape the exposed methods
    for method in proxy._pyroMethods:
        if not hasattr(original_class, method):
            continue
        original_class_method = getattr(original_class, method)
        hints = _resolve_type_hints(original_class_method, method)
        if method in pyro_methods:
            hints.pop("return", None)
        for value in hints.values():
            _collect_serializable_types(value, class_list, seen, type_qualifier)

    # Scrape the exposed properties
    for attribute in proxy._pyroAttrs:
        if attribute in pyro_methods:
            continue
        original_class_attribute = getattr(original_class, attribute)
        hints = _resolve_type_hints(original_class_attribute.fget, attribute)
        for value in hints.values():
            _collect_serializable_types(value, class_list, seen, type_qualifier)

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
    wrapped_api = ot3_hardware.wrapped()
    ot3api_async_instance = await _setup_and_validate_modules_on_OT3API_and_nameserver(
        decoy,
        ot3_hardware,
        mock_driver,
        tc_reader_mocked_driver,
        hs_reader_mocked_driver,
        td_reader_mocked_driver,
        vm_reader_mocked_driver,
        ar_reader_mocked_driver,
        st_reader_mocked_driver,
        mock_feature_flags,
    )

    # Collect classes from the OT3API
    class_cover_list = _collect_exposed_types(
        original_class=OT3API,
        acpo_instance=ot3api_async_instance,
        type_qualifier="dataclass_namedtuple",
    )

    hardware_registry_class_list = find_opentrons_classes_in_packages(
        HARDWARE_CLASS_PACKAGES
    )
    hardware_registry_class_list = list(set(hardware_registry_class_list))

    # Collect classes from the Module APIs
    mod_counter = 0
    for module in wrapped_api.attached_modules:
        class_cover_list = class_cover_list + _collect_exposed_types(
            original_class=module.__class__,
            acpo_instance=ot3api_async_instance.attached_modules[mod_counter],
            type_qualifier="dataclass_namedtuple",
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
    wrapped_api = ot3_hardware.wrapped()
    ot3api_async_instance = await _setup_and_validate_modules_on_OT3API_and_nameserver(
        decoy,
        ot3_hardware,
        mock_driver,
        tc_reader_mocked_driver,
        hs_reader_mocked_driver,
        td_reader_mocked_driver,
        vm_reader_mocked_driver,
        ar_reader_mocked_driver,
        st_reader_mocked_driver,
        mock_feature_flags,
    )

    # Collect classes from the OT3API
    class_cover_list = _collect_exposed_types(
        original_class=OT3API,
        acpo_instance=ot3api_async_instance,
        type_qualifier="dataclass_namedtuple",
    )

    hardware_registry_class_list = find_opentrons_classes_in_packages(
        HARDWARE_CLASS_PACKAGES
    )
    hardware_registry_class_list = list(set(hardware_registry_class_list))

    # Collect classes from the Module APIs
    mod_counter = 0
    for module in wrapped_api.attached_modules:
        class_cover_list = class_cover_list + _collect_exposed_types(
            original_class=module.__class__,
            acpo_instance=ot3api_async_instance.attached_modules[mod_counter],
            type_qualifier="dataclass_namedtuple",
        )
        class_cover_list = list(set(class_cover_list))
        mod_counter += 1

    # Because dataclasses/named tuples use bespoke `to_pyro_dict` and `from_pyro_dict` serialization
    # the types exposed by the Pyro interface should always be the same as the types registered.
    assert set(class_cover_list) == set(hardware_registry_class_list)


async def test_enum_registration_coverage(
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
    """Test will check for to see if the hardware class package used in registration covers all exposed enums."""
    wrapped_api = ot3_hardware.wrapped()
    ot3api_async_instance = await _setup_and_validate_modules_on_OT3API_and_nameserver(
        decoy,
        ot3_hardware,
        mock_driver,
        tc_reader_mocked_driver,
        hs_reader_mocked_driver,
        td_reader_mocked_driver,
        vm_reader_mocked_driver,
        ar_reader_mocked_driver,
        st_reader_mocked_driver,
        mock_feature_flags,
    )

    # Collect classes from the OT3API
    class_cover_list = _collect_exposed_types(
        original_class=OT3API,
        acpo_instance=ot3api_async_instance,
        type_qualifier="enum",
    )

    hardware_registry_class_list = find_enums_in_packages(HARDWARE_ENUM_PACKAGES)
    hardware_registry_class_list = list(set(hardware_registry_class_list))

    # Collect classes from the Module APIs
    mod_counter = 0
    for module in wrapped_api.attached_modules:
        class_cover_list = class_cover_list + _collect_exposed_types(
            original_class=module.__class__,
            acpo_instance=ot3api_async_instance.attached_modules[mod_counter],
            type_qualifier="enum",
        )
        class_cover_list = list(set(class_cover_list))
        mod_counter += 1

    # This test uses <= because the `find_enums_in_packages` crawler is actually finding more enums than there are
    # exposed via the Pyro interface. We just want to make sure all the exposed ones are in that registry.
    assert set(class_cover_list) <= set(hardware_registry_class_list)


async def test_pydantic_registration_coverage(
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
    """Test will check for to see if the hardware class package used in registration covers all exposed pydantic models."""
    wrapped_api = ot3_hardware.wrapped()
    ot3api_async_instance = await _setup_and_validate_modules_on_OT3API_and_nameserver(
        decoy,
        ot3_hardware,
        mock_driver,
        tc_reader_mocked_driver,
        hs_reader_mocked_driver,
        td_reader_mocked_driver,
        vm_reader_mocked_driver,
        ar_reader_mocked_driver,
        st_reader_mocked_driver,
        mock_feature_flags,
    )

    # Collect classes from the OT3API
    class_cover_list = _collect_exposed_types(
        original_class=OT3API,
        acpo_instance=ot3api_async_instance,
        type_qualifier="pydantic",
    )

    hardware_registry_class_list = find_pydantic_classes_in_packages(
        HARDWARE_PYDANTIC_PACKAGES
    )
    hardware_registry_class_list = list(set(hardware_registry_class_list))

    # Collect classes from the Module APIs
    mod_counter = 0
    for module in wrapped_api.attached_modules:
        class_cover_list = class_cover_list + _collect_exposed_types(
            original_class=module.__class__,
            acpo_instance=ot3api_async_instance.attached_modules[mod_counter],
            type_qualifier="pydantic",
        )
        class_cover_list = list(set(class_cover_list))
        mod_counter += 1

    # This test uses <= because the `find_pydantic_classes_in_packages` crawler is actually finding more pydantic models than
    # there are exposed via the Pyro interface. We just want to make sure all the exposed ones are in that registry.
    assert set(class_cover_list) <= set(hardware_registry_class_list)


# Mock out the data types that are known to leave the hardware layer
CLASS_TYPE_MOCK_TABLE: Dict[type, Any] = {
    hw_types.Axis: hw_types.Axis.X,
    hw_types.OT3Mount: hw_types.OT3Mount.LEFT,
    ot_types.Mount: ot_types.Mount.LEFT,
    hw_types.CriticalPoint: hw_types.CriticalPoint.MOUNT,
    ot_types.Point: ot_types.Point(1, 2, 3),
    hw_types.InstrumentProbeType: hw_types.InstrumentProbeType.PRIMARY,
    dev_types.AttachedGripper: dev_types.AttachedGripper(
        config=gc.load(GripperModel.v1), id="test"
    ),
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
    peripheral_types.BarcodeScannerModel: peripheral_types.BarcodeScannerModel.BARCODE_SCANNER_V1,
    hw_types.GripperProbe: hw_types.GripperProbe.FRONT,
    hw_types.InstrumentProbeType: None,
    hw_types.PauseType: hw_types.PauseType.PAUSE,
    config_types.GantryLoad: config_types.GantryLoad.HIGH_THROUGHPUT_1000,
    config_types.CapacitivePassSettings: config_types.CapacitivePassSettings(
        prep_distance_mm=1.0,
        max_overrun_distance_mm=2.0,
        speed_mm_per_s=3.0,
        sensor_threshold_pf=5.0,
    ),
    hw_types.CriticalPoint: hw_types.CriticalPoint.MOUNT,
    OT3Transforms: OT3Transforms(
        deck_calibration=DeckCalibration(
            attitude=[[0.0, 1.0]],
            source=calibration_types.SourceType.default,
            status=calibration_types.CalibrationStatus(
                markedBad=False,
                source=calibration_types.SourceType.default,
                markedAt=datetime.now(),
            ),
            belt_attitude=None,
            last_modified=datetime.now(),
            pipette_calibrated_with=None,
            tiprack=None,
        ),
        carriage_offset=ot_types.Point(1, 1, 1),
        left_mount_offset=ot_types.Point(1, 1, 1),
        right_mount_offset=ot_types.Point(1, 1, 1),
        gripper_mount_offset=ot_types.Point(1, 1, 1),
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
    hw_types.PipetteSensorData: hw_types.PipetteSensorData(
        sensor_type=hw_types.PipetteSensorType.capacitive, _as_int=0x01, _as_float=0x01
    ),
    hw_types.MotionChecks: hw_types.MotionChecks.HIGH,
    driver_types.ABSMeasurementConfig: driver_types.ABSMeasurementConfig(
        measure_mode=driver_types.ABSMeasurementMode.SINGLE,
        sample_wavelengths=[100, 200],
        reference_wavelength=100,
    ),
    module_types.BundledFirmware: module_types.BundledFirmware(
        version="v1", path=Path("coolpath")
    ),
    vac_types.PumpState: vac_types.PumpState(
        target_rpm=0.1,
        current_rpm=0.2,
        target_pwm=1.5,
        current_pwm=2.5,
        pump_running=False,
        manual_control=True,
    ),
    rpi_types.USBPort: rpi_types.USBPort(
        name="USB",
        port_number=10,
        port_group=rpi_types.PortGroup.MAIN,
        hub=True,
        hub_port=11,
        device_path="cooldevpath",
    ),
    hw_types.HepaUVState: hw_types.HepaUVState(
        light_on=True, uv_duration_s=100, remaining_time_s=60
    ),
    hw_types.HepaFanState: hw_types.HepaFanState(fan_on=True, duty_cycle=10),
    hw_types.EstopStateNotification: hw_types.EstopStateNotification(
        event=hw_types.HardwareEventType.ESTOP_CHANGE,
        old_state=hw_types.EstopState.DISENGAGED,
        new_state=hw_types.EstopState.PHYSICALLY_ENGAGED,
    ),
    hw_types.DoorStateNotification: hw_types.DoorStateNotification(
        event=hw_types.HardwareEventType.DOOR_SWITCH_CHANGE,
        new_state=DoorState.CLOSED,
        module_serial=None,
    ),
    hw_types.ModuleConnectedNotification: hw_types.ModuleConnectedNotification(
        module_serial="123",
        name="coolmod",
        port="456",
        event=hw_types.HardwareEventType.MODULE_CONNECTED,
    ),
    hw_types.ModuleDisconnectedNotification: hw_types.ModuleDisconnectedNotification(
        event=hw_types.HardwareEventType.MODULE_DISCONNECTED,
        module_model=module_types.ThermocyclerModuleModel.THERMOCYCLER_V2,
        port="123",
        module_serial="ABCDF4",
    ),
    hw_types.SubsystemConnectionNotification: hw_types.SubsystemConnectionNotification(
        event=hw_types.HardwareEventType.SUBSYSTEM_CONNECTION
    ),
    hw_types.AsynchronousModuleErrorNotification: hw_types.AsynchronousModuleErrorNotification(
        exception=CommunicationError(
            code=ErrorCodes.COMMUNICATION_ERROR,
            message="BIG_ERRORS",
            detail={"apple": "pie", "cheese": "cake"},
            wrapping=[
                CommunicationError(
                    code=ErrorCodes.COMMUNICATION_ERROR,
                    message="BIG_ERRORS_INNER",
                    detail={"apple_inner": "pie_inner", "cheese_inner": "cake_inner"},
                    wrapping=None,
                ),
            ],
        ),
        module_serial="1234ABC",
        module_model=module_types.VacuumModuleModel.VACUUM_MODULE_V1,
        port="1",
        event=hw_types.HardwareEventType.ASYNCHRONOUS_MODULE_ERROR,
    ),
    hw_types.ErrorMessageNotification: hw_types.ErrorMessageNotification(
        event=hw_types.HardwareEventType.ERROR_MESSAGE, message="AGGA"
    ),
    hw_types.StatusBarUpdateEvent: hw_types.StatusBarUpdateEvent(
        state=hw_types.StatusBarState.SOFTWARE_ERROR, enabled=True
    ),
    hw_types.EstopOverallStatus: hw_types.EstopOverallStatus(
        state=hw_types.EstopState.DISENGAGED,
        left_physical_state=hw_types.EstopPhysicalStatus.ENGAGED,
        right_physical_state=hw_types.EstopPhysicalStatus.DISENGAGED,
    ),
    instr_calibration_types.GripperCalibrationOffset: instr_calibration_types.GripperCalibrationOffset(
        status=instr_calibration_types.CalibrationStatus(
            markedBad=False,
            source=calibration_types.SourceType.factory,
            markedAt=datetime.now(),
        ),
        offset=ot_types.Point(0.1, 0.2, 0.3),
        source=calibration_types.SourceType.calibration_check,
        last_modified=datetime.now(),
    ),
    instr_calibration_types.PipetteOffsetSummary: instr_calibration_types.PipetteOffsetSummary(
        offset=ot_types.Point(0.1, 0.2, 0.3),
        source=calibration_types.SourceType.calibration_check,
        status=calibration_types.CalibrationStatus(
            markedBad=False,
            source=calibration_types.SourceType.factory,
            markedAt=datetime.now(),
        ),
        last_modified=datetime.now(),
        reasonability_check_failures=[
            instr_calibration_types.ReasonabilityCheckFailure(
                kind="inconsistent-pipette-offset",
                offsets={ot_types.Mount.RIGHT: ot_types.Point(0.1, 0.2, 0.3)},
                limit=5.1,
            )
        ],
    ),
    mod_cal.ModuleCalibrationOffset: mod_cal.ModuleCalibrationOffset(
        offset=ot_types.Point(0.1, 0.2, 0.3),
        module_id="id",
        module=module_types.ModuleType.THERMOCYCLER,
        source=calibration_types.SourceType.factory,
        status=CalibrationStatus(
            markedBad=False,
            source=calibration_types.SourceType.calibration_check,
            markedAt=datetime.now(),
        ),
        mount=hw_types.OT3Mount.LEFT,
        instrument_id="123",
        last_modified=datetime.now(),
        slot="D1",
    ),
    vac_types.VacuumState: vac_types.VacuumState(
        target_gauge_pressure=1.1,
        current_gauge_pressure=2.2,
        pressure_abs_a=3.3,
        pressure_abs_b=4.4,
        pressure_atm=5.5,
        vacuum_enabled=True,
        vacuum_duration=100,
        vent_state=vac_types.VentState.OPENED,
    ),
    stacker_types.TOFMeasurementResult: stacker_types.TOFMeasurementResult(
        sensor=stacker_types.TOFSensor.X,
        kind=stacker_types.MeasurementKind.HISTOGRAM,
        bins={1: [1.0, 2.1]},
    ),
    hw_types.HardwareFeatureFlags: hw_types.HardwareFeatureFlags(
        False, True, True, True
    ),
    stacker_types.LEDPattern: stacker_types.LEDPattern.PULSE,
    vac_types.LEDPattern: vac_types.LEDPattern.STATIC,
    module_types.AbsorbanceReaderModel: module_types.AbsorbanceReaderModel.ABSORBANCE_READER_V1,
    hw_types.GripperJawState: hw_types.GripperJawState.UNHOMED,
    stacker_types.StackerAxis: stacker_types.StackerAxis.X,
    module_types.ModuleType: module_types.ModuleType.THERMOCYCLER,
    module_types.HeaterShakerModuleModel: module_types.HeaterShakerModuleModel.HEATER_SHAKER_V1,
    vac_types.VentState: vac_types.VentState.CLOSED,
    module_types.LidStatus: module_types.LidStatus.ON,
    hw_types.HardwareEventType: hw_types.HardwareEventType.DOOR_SWITCH_CHANGE,
    calibration_types.SourceType: calibration_types.SourceType.default,
    module_types.StackerAxisState: module_types.StackerAxisState.UNKNOWN,
    ot_types.PipetteMountType: ot_types.PipetteMountType.LEFT,
    hw_types.UpdateState: hw_types.UpdateState.queued,
    ot_types.TransferTipPolicy: ot_types.TransferTipPolicy.ONCE,
    module_types.VacuumModuleStatus: module_types.VacuumModuleStatus.IDLE,
    driver_types.AbsorbanceReaderDeviceState: driver_types.AbsorbanceReaderDeviceState.OK,
    pipette_types.Quirks: pipette_types.Quirks.pickupTipShake,
    GripperModel: GripperModel.v1,
    vac_types.HardwareRevision: vac_types.HardwareRevision.NFF,
    config_types.OT3AxisKind: config_types.OT3AxisKind.X,
    ot_types.DeckSlotName: ot_types.DeckSlotName.SLOT_1,
    pipette_types.PipetteChannelType: pipette_types.PipetteChannelType.SINGLE_CHANNEL,
    hw_types.ExecutionState: hw_types.ExecutionState.RUNNING,
    hw_types.EstopAttachLocation: hw_types.EstopAttachLocation.LEFT,
    ot_types.OT3MountType: ot_types.OT3MountType.LEFT,
    driver_types.HeaterShakerLabwareLatchStatus: driver_types.HeaterShakerLabwareLatchStatus.IDLE_CLOSED,
    module_types.SpeedStatus: module_types.SpeedStatus.IDLE,
    module_types.VacuumModuleModel: module_types.VacuumModuleModel.VACUUM_MODULE_V1,
    module_types.LatchState: module_types.LatchState.CLOSED,
    pipette_types.LiquidClasses: pipette_types.LiquidClasses.default,
    module_types.MagneticBlockModel: module_types.MagneticBlockModel.MAGNETIC_BLOCK_V1,
    module_types.FlexStackerStatus: module_types.FlexStackerStatus.IDLE,
    driver_types.AbsorbanceReaderLidStatus: driver_types.AbsorbanceReaderLidStatus.ON,
    module_types.VacuumOperationMode: module_types.VacuumOperationMode.POWER,
    ot_types.NozzleConfigurationType: ot_types.NozzleConfigurationType.FULL,
    driver_types.ABSMeasurementMode: driver_types.ABSMeasurementMode.SINGLE,
    module_types.TemperatureModuleModel: module_types.TemperatureModuleModel.TEMPERATURE_V1,
    module_types.MagneticStatus: module_types.MagneticStatus.DISENGAGED,
    pipette_types.PipetteOEMType: pipette_types.PipetteOEMType.OT,
    peripheral_types.PeripheralType: peripheral_types.PeripheralType.BARCODE_SCANNER,
    pipette_types.PipetteModelType: pipette_types.PipetteModelType.p1000,
    hw_types.HardwareAction: hw_types.HardwareAction.ASPIRATE,
    hw_types.BoardRevision: hw_types.BoardRevision.UNKNOWN,
    module_types.VentStatus: module_types.VentStatus.CLOSED,
    module_types.HeaterShakerStatus: module_types.HeaterShakerStatus.IDLE,
    hw_types.EstopPhysicalStatus: hw_types.EstopPhysicalStatus.ENGAGED,
    vac_types.LEDColor: vac_types.LEDColor.RED,
    DoorState: DoorState.CLOSED,
    module_types.HopperDoorState: module_types.HopperDoorState.CLOSED,
    hw_types.PipetteSensorType: hw_types.PipetteSensorType.capacitive,
    ot_types.StagingSlotName: ot_types.StagingSlotName.SLOT_A4,
    module_types.PlatformState: module_types.PlatformState.RETRACTED,
    ot_types.MeniscusTrackingTarget: ot_types.MeniscusTrackingTarget.START,
    module_types.ThermocyclerModuleModel: module_types.ThermocyclerModuleModel.THERMOCYCLER_V2,
    module_types.TemperatureStatus: module_types.TemperatureStatus.IDLE,
    pipette_types.AvailableUnits: pipette_types.AvailableUnits.mm,
    module_types.AbsorbanceReaderStatus: module_types.AbsorbanceReaderStatus.IDLE,
    ot_types.AxisType: ot_types.AxisType.X,
    ot_types.MountType: ot_types.MountType.LEFT,
    hw_types.PipetteSubType: hw_types.PipetteSubType.pipette_single,
    driver_types.AbsorbanceReaderPlatePresence: driver_types.AbsorbanceReaderPlatePresence.PRESENT,
    pipette_types.PipetteGenerationType: pipette_types.PipetteGenerationType.GEN2,
    module_types.MagneticModuleModel: module_types.MagneticModuleModel.MAGNETIC_V2,
    pipette_types.PipetteNameType: pipette_types.PipetteNameType.P1000_SINGLE,
    vac_types.GCODE: vac_types.GCODE.GET_DEVICE_INFO,
    pipette_types.PipetteTipType: pipette_types.PipetteTipType.t1000,
    driver_types.ThermocyclerLidStatus: driver_types.ThermocyclerLidStatus.CLOSED,
    hw_types.EstopState: hw_types.EstopState.DISENGAGED,
    module_types.FlexStackerModuleModel: module_types.FlexStackerModuleModel.FLEX_STACKER_V1,
    stacker_types.TOFSensorState: stacker_types.TOFSensorState.MEASURING,
    stacker_types.MeasurementKind: stacker_types.MeasurementKind.HISTOGRAM,
    stacker_types.HardwareRevision: stacker_types.HardwareRevision.PVT,
    stacker_types.Direction: stacker_types.Direction.RETRACT,
    stacker_types.TOFSensor: stacker_types.TOFSensor.Z,
    stacker_types.LEDColor: stacker_types.LEDColor.YELLOW,
    stacker_types.TOFSensorMode: stacker_types.TOFSensorMode.MEASURE,
    stacker_types.ActiveRange: stacker_types.ActiveRange.SHORT_RANGE,
    stacker_types.GCODE: stacker_types.GCODE.SET_LED,
    stacker_types.SpadMapID: stacker_types.SpadMapID.SPAD_MAP_ID_3,
    stacker_types.MoveResult: stacker_types.MoveResult.NO_ERROR,
    hw_util.DeckTransformState: hw_util.DeckTransformState.SINGULARITY,
    hw_message_defs.GetMotorUsageResponse: hw_message_defs.GetMotorUsageResponse(
        payload=hw_message_payloads.GetMotorUsageResponsePayload(
            usage_elements=[], num_elements=hw_binding_utils.UInt8Field(0)
        )
    ),
}

# This list should only include types that are either builtins that we work around or error related content thats delt with via pickle
TYPES_TO_SKIP = [ErrorCodes, ErrorCategories, StrEnum]


async def test_serialization_validation_with_mock_data() -> None:  # noqa: C901
    """Test to check if types registered in the hardware class package properly serialize and deserialize.

    A big part of the reason why this test works is because of the above tests verifying the surface of the proxy interface
    only exposes types included in the hardware packages used by the hardware serpent registry.
    """

    class DataTester:
        """Class for testing data serializaiton over pyro"""

        @pyro.expose
        def data_in_data_out(self, value: Any) -> Any:
            return value

    tester = DataTester()

    with pyro.Daemon() as daemon:  # type: ignore
        # Create a pyro daemon hosting the resource
        register_hardware_types()
        daemon.register(tester)

        def _tester_request_daemon_request_loop() -> None:
            try:
                # Maintain a request loop to handle requests on our resource instance from "remote" portion of the test
                daemon.requestLoop()
            finally:
                daemon.close()

        tester_request_loop = threading.Thread(
            target=_tester_request_daemon_request_loop, daemon=True
        )
        tester_request_loop.start()

        tester_proxy = pyro.Proxy(daemon.uriFor(tester))  # type: ignore

        # Get the hardware types covered by the registry
        hardware_registry_class_list = find_opentrons_classes_in_packages(
            HARDWARE_CLASS_PACKAGES
        )
        hardware_registry_class_list = list(set(hardware_registry_class_list))
        enum_registry_class_list = find_enums_in_packages(HARDWARE_ENUM_PACKAGES)
        enum_registry_class_list = list(set(enum_registry_class_list))
        exposed_class_list = hardware_registry_class_list + enum_registry_class_list

        # Validate each class can be sent over pyro and come back deserialized in the expected format
        for clazz in exposed_class_list:
            if clazz not in TYPES_TO_SKIP:
                try:
                    mock_data = CLASS_TYPE_MOCK_TABLE[clazz]
                except KeyError as e:
                    # DEVELOPER NOTE: If you get a type here that you didn't expect to be exposed via pyro, there are two cases to consider:
                    # 1. It was exposed unintentionally, like through a module's driver layer. Public facing functions on module definitions
                    # get automatically exposed, even if nothing in the Protocol Engine or Robot-Server use them. If it's a callable api attribute
                    # then it's types are exposed!
                    # 2. The type was collected by our registration packages even though nothing exposes it. This can happen because we crawl a package
                    # for types like Enums and Pydantic models, in the event that those types need serializing over pyro. If it's an easy type to mock out
                    # then please mock it anyways, something might expose it some day causing other tests to fail!
                    raise KeyError(f"{e} - Mock data missing for type {clazz}")

                deserialized_output = tester_proxy.data_in_data_out(mock_data)
                assert deserialized_output == mock_data

        daemon.close()
