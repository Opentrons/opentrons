"""Tests for the Pyro instance of the hardware controller."""

import asyncio
import socket
import threading
from typing import Callable, Dict, Union, cast

import pytest
from decoy import Decoy
from mock import AsyncMock
from Pyro5 import api as pyro
from Pyro5 import nameserver

from opentrons_shared_data.pipette import (
    load_data as load_pipette_data,
)
from opentrons_shared_data.pipette import pipette_definition
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
)
from opentrons_shared_data.pipette.types import PipetteModel

from opentrons.calibration_storage import types as cal_types
from opentrons.drivers.asyncio.communication.serial_connection import (
    AsyncResponseSerialConnection,
)
from opentrons.drivers.heater_shaker.simulator import SimulatingDriver
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.thermocycler.simulator import (
    SimulatingDriver as ThermocyclerSimulatingDriver,
)
from opentrons.drivers.vacuum_module.simulator import (
    SimulatingDriver as VacuumModuleSimulatingDriver,
)
from opentrons.drivers.vacuum_module.types import PumpState, VacuumState
from opentrons.hardware_control import ExecutionManager, ThreadManager, modules
from opentrons.hardware_control import types as hw_types
from opentrons.hardware_control.instruments.ot3 import (
    instrument_calibration as ot3_calibration,
)
from opentrons.hardware_control.instruments.ot3.pipette import Pipette
from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control.modules import (
    AbsorbanceReader,
    FlexStacker,
    HeaterShaker,
    TempDeck,
    Thermocycler,
    VacuumModule,
)
from opentrons.hardware_control.modules.thermocycler import ThermocyclerReader
from opentrons.hardware_control.modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
    VacuumModuleStatus,
)
from opentrons.hardware_control.modules.vacuum_module import VacuumModuleReader
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.poller import Poller
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.hardware_control.types import (
    DoorStateNotification,
    HardwareEvent,
    HardwareEventHandler,
    HardwareFeatureFlags,
    OT3Mount,
    SubSystem,
)
from opentrons.types import Mount, Point
from opentrons.util.pyro.pyro_client_async_adapter import (
    AsyncClientPyroFunctionWrapper,
)
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
from opentrons.util.pyro.pyro_proxy_utility import wait_for_proxy
from opentrons.util.pyro.pyro_synchronous_adapter import (
    DaemonUtility,
    PyroSynchronousObject,
    convert_result_to_proxy,
    pyro_behavior,
)

TEST_PYRO_TIMEOUT = 5

OT3_PIP_CAL = ot3_calibration.PipetteOffsetByPipetteMount(
    offset=Point(0, 0, 0),
    source=cal_types.SourceType.user,
    status=cal_types.CalibrationStatus(),
)


@pytest.fixture
def managed_obj(ot3_hardware: ThreadManager[OT3API]) -> OT3API:
    """OT3API fixture for tests."""
    managed = ot3_hardware.managed_obj
    assert managed
    return managed


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


@pytest.fixture
def hardware_pipette_ot3() -> Callable[
    [
        pipette_definition.PipetteModelVersionType,
        ot3_calibration.PipetteOffsetByPipetteMount,
        str,
    ],
    Pipette,
]:
    def _create_pipette(
        model: pipette_definition.PipetteModelVersionType,
        calibration: ot3_calibration.PipetteOffsetByPipetteMount = OT3_PIP_CAL,
        id: str = "testID",
    ) -> Pipette:
        return Pipette(
            load_pipette_data.load_definition(
                model.pipette_type,
                model.pipette_channels,
                model.pipette_version,
                model.oem_type,
            ),
            calibration,
            id,
        )

    return _create_pipette


@pytest.fixture
def module_disconnected_callback(decoy: Decoy) -> ModuleDisconnectedCallback:
    return decoy.mock(cls=ModuleDisconnectedCallback)


@pytest.fixture
def module_error_callback(decoy: Decoy) -> ModuleErrorCallback:
    return decoy.mock(cls=ModuleErrorCallback)


@pytest.fixture
def mock_execution_manager(decoy: Decoy) -> ExecutionManager:
    return decoy.mock(cls=ExecutionManager)


@pytest.fixture
def connection() -> AsyncMock:
    return AsyncMock(spec=AsyncResponseSerialConnection)


async def test_pyro_behavior_on_modules(
    ot3_hardware: ThreadManager[OT3API],
    mock_driver: SimulatingDriver,
    tc_reader_mocked_driver: modules.thermocycler.ThermocyclerReader,
    hs_reader_mocked_driver: modules.heater_shaker.HeaterShakerReader,
    td_reader_mocked_driver: modules.tempdeck.TempDeckReader,
    vm_reader_mocked_driver: modules.vacuum_module.VacuumModuleReader,
    ar_reader_mocked_driver: modules.absorbance_reader.AbsorbanceReaderReader,
    st_reader_mocked_driver: modules.flex_stacker.FlexStackerReader,
    decoy: Decoy,
) -> None:
    """Test that the pyro_behavior decorator added the expected behavior to modules.

    This behavior should include returning Proxies from the attached_modules attribute,
    and a PSO remover on the local cleanup attribute.
    """

    api = ot3_hardware.wrapped()

    # Module mocks
    api._backend.module_controls = decoy.mock(cls=AttachedModulesControl)
    tc = decoy.mock(cls=Thermocycler)
    hs = decoy.mock(cls=HeaterShaker)
    td = decoy.mock(cls=TempDeck)
    td_2 = decoy.mock(cls=TempDeck)
    vm = decoy.mock(cls=VacuumModule)
    st = decoy.mock(cls=FlexStacker)
    ar = decoy.mock(cls=AbsorbanceReader)
    decoy.when(api._backend.module_controls.available_modules).then_return(
        [tc, hs, td, td_2, vm, st, ar]
    )
    for mod in api._backend.module_controls.available_modules:
        decoy.when(mod._driver).then_return(mock_driver)  # type: ignore

    # Mock out the pollers for these modules that will be stopped
    decoy.when(tc._poller).then_return(Poller(tc_reader_mocked_driver, interval=0.01))
    decoy.when(hs._poller).then_return(Poller(hs_reader_mocked_driver, interval=0.01))
    decoy.when(td._poller).then_return(Poller(td_reader_mocked_driver, interval=0.01))
    decoy.when(td_2._poller).then_return(Poller(td_reader_mocked_driver, interval=0.01))
    decoy.when(vm._poller).then_return(Poller(vm_reader_mocked_driver, interval=0.01))
    decoy.when(st._poller).then_return(Poller(st_reader_mocked_driver, interval=0.01))
    decoy.when(ar._poller).then_return(Poller(ar_reader_mocked_driver, interval=0.01))

    utility = DaemonUtility(daemon=pyro.Daemon())  # type: ignore
    pyro_object = PyroSynchronousObject(api, utility)

    # Assert that the pyro object instance of the OT3API attached_modules results in Proxy objects
    for mod in pyro_object.attached_modules:  # type: ignore
        assert isinstance(mod, pyro.Proxy)

    # Assert that the local instance of each module deletes its PSO when cleaned up
    for mod in api._backend.module_controls.available_modules:
        # assert the module is maintained as a PSO on the daemon
        assert utility.find_PSO(mod) is not None
        # Run the local instance cleanup of the module
        await mod.cleanup()
        # Assert this module has been removed
        assert utility.find_PSO(mod) is None


async def test_pyro_behavior_ot3api_dicts_with_non_builtin_keys(
    managed_obj: OT3API,
) -> None:
    """Test the pyro behavior for dictionaries with keys that are not builtins with pyro by ensuring several
    OT3API commands have the expected results.
    """
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
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", managed_obj, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    server_thread = threading.Thread(target=_pyro_daemon, daemon=True)

    ns_thread.start()
    server_thread.start()

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
    ot3_async = await wait_for_proxy(proxy_name="OT3API", broadcast_mode=False)
    ot3api = cast(OT3API, ot3_async)
    await ot3api.home()

    assert ot3api.get_all_attached_instr() == managed_obj.get_all_attached_instr()
    data: Dict[hw_types.Axis, float] = {
        hw_types.Axis.X: 0,
        hw_types.Axis.Y: 0,
        hw_types.Axis.Z_L: 0,
        hw_types.Axis.Z_R: 0,
        hw_types.Axis.P_L: 0,
        hw_types.Axis.P_R: 0,
        hw_types.Axis.Z_G: 0,
        hw_types.Axis.G: 0,
    }
    # test with kwargs
    assert ot3api.get_deck_from_machine(
        machine_pos=data
    ) == managed_obj.get_deck_from_machine(machine_pos=data)
    # test with args, no kwargs
    assert ot3api.get_deck_from_machine(data) == managed_obj.get_deck_from_machine(data)

    await managed_obj.home()
    assert await ot3api.current_position(
        mount=hw_types.OT3Mount.LEFT, critical_point=None
    ) == await managed_obj.current_position(
        mount=hw_types.OT3Mount.LEFT, critical_point=None
    )
    assert await ot3api.current_position_ot3(
        mount=hw_types.OT3Mount.LEFT, critical_point=None
    ) == await managed_obj.current_position_ot3(
        mount=hw_types.OT3Mount.LEFT, critical_point=None
    )
    assert await ot3api.encoder_current_position(
        mount=hw_types.OT3Mount.LEFT, critical_point=None
    ) == await managed_obj.current_position(
        mount=hw_types.OT3Mount.LEFT, critical_point=None
    )
    assert await ot3api.encoder_current_position_ot3(
        mount=hw_types.OT3Mount.LEFT, critical_point=None
    ) == await managed_obj.current_position(
        mount=hw_types.OT3Mount.LEFT, critical_point=None
    )
    assert ot3api.get_engaged_axes() == managed_obj.get_engaged_axes()
    assert ot3api.engaged_axes == managed_obj.engaged_axes

    assert await ot3api.get_limit_switches() == await managed_obj.get_limit_switches()
    assert ot3api.get_attached_pipettes() == managed_obj.get_attached_pipettes()
    assert ot3api.get_attached_instruments() == managed_obj.get_attached_instruments()
    assert ot3api.attached_pipettes == managed_obj.attached_pipettes
    assert ot3api.attached_subsystems == managed_obj.attached_subsystems

    # Ensure that functions which return "types" work as intended
    value = ot3api.get_robot_type()
    assert isinstance(value, type)

    assert ot3api.get_attached_instruments() == managed_obj.get_attached_instruments()

    # Clean up client resources.
    ot3_async._proxy._pyroRelease()  # type: ignore


async def test_pyro_module_properties(
    ot3_hardware: ThreadManager[OT3API],
    mock_thermo_driver: ThermocyclerSimulatingDriver,
    decoy: Decoy,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
) -> None:
    """Test to ensure that proxy module properties like USBPort can be reached and deserialized."""
    sock = socket.socket()
    sock.bind(("localhost", 0))
    host, port = sock.getsockname()
    sock.close()

    pyro.config.NS_HOST = host
    pyro.config.NS_PORT = port

    name_server_ready = threading.Event()
    # Module mocks
    api = ot3_hardware.wrapped()
    api._backend.module_controls = decoy.mock(cls=AttachedModulesControl)

    tc = Thermocycler(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=USBPort(
            name="port1",
            port_number=1,
            port_group="main",
            hub=False,
            hub_port=None,
            device_path="",
        ),
        hw_control_loop=api._loop,
        driver=mock_thermo_driver,
        reader=ThermocyclerReader(driver=mock_thermo_driver),
        poller=Poller(ThermocyclerReader(driver=mock_thermo_driver), interval=0.01),
        device_info={"serial": "awesome_serial_123"},
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    decoy.when(api._backend.module_controls.available_modules).then_return([tc])

    def _nameserver_loop() -> None:
        # start_ns returns (nameserver, daemon, uri)
        _, ns_daemon, _ = nameserver.start_ns(host=host, port=port)  # type: ignore
        name_server_ready.set()
        # Run until the test process exits; thread is marked daemon=True.
        ns_daemon.requestLoop()

    def _pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", ot3_hardware.managed_obj, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    server_thread = threading.Thread(target=_pyro_daemon, daemon=True)

    ns_thread.start()
    server_thread.start()

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
    ot3_async = await wait_for_proxy(proxy_name="OT3API")
    ot3api = cast(OT3API, ot3_async)

    # Ensure that functions which provide proxies also are wrapped asynchronously
    async_remote_tc = cast(Thermocycler, ot3api.attached_modules[0])

    assert async_remote_tc.usb_port.name == "port1"
    assert async_remote_tc.serial_number == "awesome_serial_123"
    assert async_remote_tc.port == "/dev/ot_module_sim_thermocycler0"
    assert async_remote_tc.updating == tc.updating
    assert async_remote_tc.live_data == tc.live_data
    assert async_remote_tc.hopper_door_state is None
    assert async_remote_tc.bundled_fw == tc.bundled_fw
    assert async_remote_tc.name() == "thermocycler"

    ot3_async._proxy._pyroRelease()  # type: ignore


async def test_pyro_vacuum_module_serialization(
    ot3_hardware: ThreadManager[OT3API],
    mock_vm_driver: VacuumModuleSimulatingDriver,
    decoy: Decoy,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
) -> None:
    """Test to ensure that proxy module calls to the vacuum module serialize and deserialize properly."""
    sock = socket.socket()
    sock.bind(("localhost", 0))
    host, port = sock.getsockname()
    sock.close()

    pyro.config.NS_HOST = host
    pyro.config.NS_PORT = port

    name_server_ready = threading.Event()
    # Module mocks
    api = ot3_hardware.wrapped()
    api._backend.module_controls = decoy.mock(cls=AttachedModulesControl)

    vm = VacuumModule(
        port="/dev/ot_module_sim_vac0",
        usb_port=USBPort(
            name="port1",
            port_number=1,
            port_group="main",
            hub=False,
            hub_port=None,
            device_path="",
        ),
        hw_control_loop=api._loop,
        driver=mock_vm_driver,
        reader=VacuumModuleReader(driver=mock_vm_driver),
        poller=Poller(VacuumModuleReader(driver=mock_vm_driver), interval=0.01),
        device_info={"serial": "awesome_serial_123"},
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )

    decoy.when(api._backend.module_controls.available_modules).then_return([vm])

    def _nameserver_loop() -> None:
        # start_ns returns (nameserver, daemon, uri)
        _, ns_daemon, _ = nameserver.start_ns(host=host, port=port)  # type: ignore
        name_server_ready.set()
        # Run until the test process exits; thread is marked daemon=True.
        ns_daemon.requestLoop()

    def _pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", ot3_hardware.managed_obj, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    server_thread = threading.Thread(target=_pyro_daemon, daemon=True)

    ns_thread.start()
    server_thread.start()

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
    ot3_async = await wait_for_proxy(proxy_name="OT3API")
    ot3api = cast(OT3API, ot3_async)

    # Ensure that functions which provide proxies also are wrapped asynchronously
    async_remote_vm = cast(VacuumModule, ot3api.attached_modules[0])

    assert isinstance(async_remote_vm.pump_state, PumpState)
    assert isinstance(async_remote_vm.vacuum_state, VacuumState)
    assert isinstance(async_remote_vm.status, VacuumModuleStatus)

    ot3_async._proxy._pyroRelease()  # type: ignore


async def test_pyro_async_wrapped_calls(  # noqa: C901
    ot3_hardware: ThreadManager[OT3API],
    mock_thermo_driver: ThermocyclerSimulatingDriver,
    decoy: Decoy,
    tc_reader_mocked_driver: modules.thermocycler.ThermocyclerReader,
    hardware_pipette_ot3: Callable[
        [Union[str, pipette_definition.PipetteModelVersionType]], Pipette
    ],
) -> None:
    """Test the pyro behavior for callback and asynchronous module calls through an automatically wrapped proxy child."""
    sock = socket.socket()
    sock.bind(("localhost", 0))
    host, port = sock.getsockname()
    sock.close()

    pyro.config.NS_HOST = host
    pyro.config.NS_PORT = port

    name_server_ready = threading.Event()

    # Module mocks
    api = ot3_hardware.wrapped()
    api._backend.module_controls = decoy.mock(cls=AttachedModulesControl)
    tc = decoy.mock(cls=Thermocycler)
    decoy.when(api._backend.module_controls.available_modules).then_return([tc])
    tc._loop = ot3_hardware.managed_obj._loop  # type: ignore
    decoy.when(tc._driver).then_return(mock_thermo_driver)

    decoy.when(tc._poller).then_return(Poller(tc_reader_mocked_driver, interval=0.01))

    def _nameserver_loop() -> None:
        # start_ns returns (nameserver, daemon, uri)
        _, ns_daemon, _ = nameserver.start_ns(host=host, port=port)  # type: ignore
        name_server_ready.set()
        # Run until the test process exits; thread is marked daemon=True.
        ns_daemon.requestLoop()

    def _pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", ot3_hardware.managed_obj, register_hardware_types)

    class cool_door_class:
        def __init__(self, loop: asyncio.AbstractEventLoop):
            self._loop = loop  # placeholder dummy - never used by this object

        @pyro_behavior(convert_result_to_proxy, False)
        def cool_hardware_event(self) -> HardwareEventHandler:
            def run_handler(
                event: HardwareEvent,
            ) -> None:
                if isinstance(event, DoorStateNotification):
                    return None

            return run_handler

    def _door_daemon() -> None:
        def _door_loop_thread(loop: asyncio.AbstractEventLoop) -> None:
            loop.run_forever()

        new_loop = asyncio.new_event_loop()
        loop_thread = threading.Thread(
            target=_door_loop_thread, args=[new_loop], daemon=True
        )
        loop_thread.start()

        cool_door_instance = cool_door_class(new_loop)
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        try:
            create_pyro_daemon("cool_door", cool_door_instance, register_hardware_types)
        finally:
            new_loop.stop()
            loop_thread.join()

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    server_thread = threading.Thread(target=_pyro_daemon, daemon=True)
    door_thead = threading.Thread(target=_door_daemon, daemon=True)

    ns_thread.start()
    server_thread.start()
    door_thead.start()

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
    ot3_async = await wait_for_proxy(proxy_name="OT3API")
    ot3api = cast(OT3API, ot3_async)
    door_async = await wait_for_proxy(proxy_name="cool_door")

    await ot3api.home()

    # Ensure that functions which provide proxies also are wrapped asynchronously
    async_remote_tc = cast(Thermocycler, ot3api.attached_modules[0])
    # Verify that async calls work on the thermocycler right away
    assert await async_remote_tc.open() == "open"

    async_uploader = async_remote_tc.bootloader()
    assert isinstance(async_uploader, AsyncClientPyroFunctionWrapper)

    # Test registering an outbound function from one remote resource with another remote resouce
    result = await ot3api.register_callback_async(cb=door_async.cool_hardware_event())  # type: ignore

    # Verify the resulting callback proxy (which is wrapped automagically) is wrapped and callable
    assert isinstance(result, AsyncClientPyroFunctionWrapper)
    await result()

    assert (
        ot3api.build_temporary_identity_calibration().deck_calibration.source.value
        == "default"
    )
    assert (
        ot3api.build_temporary_identity_calibration().deck_calibration.status.source
        is None
    )

    old_flags = HardwareFeatureFlags(
        use_old_aspiration_functions=False,
        require_estop=True,
        overpressure_detection_enabled=True,
        stall_detection_enabled=True,
    )
    new_flags = HardwareFeatureFlags(
        use_old_aspiration_functions=True,
        require_estop=True,
        overpressure_detection_enabled=True,
        stall_detection_enabled=True,
    )

    ot3api.hardware_feature_flags = new_flags
    assert ot3api.hardware_feature_flags == new_flags
    ot3api.hardware_feature_flags = old_flags
    assert ot3api.hardware_feature_flags == old_flags

    # Test the firmware update fetching route
    fetching_callback = ot3api.update_firmware_with_fetching(
        {SubSystem.gantry_x, SubSystem.gantry_y}
    )
    fetch_result = await fetching_callback()
    assert isinstance(fetch_result, hw_types.UpdateStatus)

    ot3_async._proxy._pyroRelease()  # type: ignore


async def test_pipette_proxy_dictionary(
    ot3_hardware: ThreadManager[OT3API],
    hardware_pipette_ot3: Callable[
        [Union[str, pipette_definition.PipetteModelVersionType]], Pipette
    ],
) -> None:
    """Test that hardware_pipettes returns pipette proxies over Pyro."""
    sock = socket.socket()
    sock.bind(("localhost", 0))
    host, port = sock.getsockname()
    sock.close()

    pyro.config.NS_HOST = host
    pyro.config.NS_PORT = port

    name_server_ready = threading.Event()

    managed = ot3_hardware.managed_obj
    assert managed is not None

    hw_pipette = hardware_pipette_ot3(
        pipette_load_name.convert_pipette_model(PipetteModel("p1000_single_v1.0"))
    )
    managed._pipette_handler._attached_instruments[OT3Mount.LEFT] = hw_pipette

    def _nameserver_loop() -> None:
        # start_ns returns (nameserver, daemon, uri)
        _, ns_daemon, _ = nameserver.start_ns(host=host, port=port)  # type: ignore
        name_server_ready.set()
        # Run until the test process exits; thread is marked daemon=True.
        ns_daemon.requestLoop()

    def _pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", managed, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    server_thread = threading.Thread(target=_pyro_daemon, daemon=True)

    ns_thread.start()
    server_thread.start()

    # Client-side requests below
    register_hardware_types()
    name_server_ready.wait(timeout=TEST_PYRO_TIMEOUT)
    ot3_async = await wait_for_proxy(proxy_name="OT3API")
    ot3api = cast(OT3API, ot3_async)

    pipettes = ot3api.hardware_pipettes
    left_proxy = pipettes[Mount.LEFT]
    assert left_proxy is not None
    assert pipettes[Mount.RIGHT] is None
    assert left_proxy.pipette_id == hw_pipette.pipette_id
    assert (
        type(left_proxy.working_volume) is float
        and left_proxy.working_volume == hw_pipette.working_volume
    )

    assert ot3api.get_instrument_offset(mount=Mount.LEFT).source.value == "user"  # type: ignore
    assert ot3api.get_instrument_offset(mount=Mount.RIGHT) is None

    ot3_async._proxy._pyroRelease()  # type: ignore
