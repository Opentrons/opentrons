"""Tests to enforce serialization for dataclasses from the hardware api layer."""

import asyncio
import inspect
import socket
import threading
from dataclasses import is_dataclass
from typing import Any, get_args, get_type_hints

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
