"""Tests for the Pyro instance of the hardware controller."""

import asyncio
import socket
import threading
from typing import Dict, cast

import pytest
from decoy import Decoy
from mock import AsyncMock
from Pyro5 import api as pyro
from Pyro5 import nameserver

from opentrons.drivers.asyncio.communication.serial_connection import (
    AsyncResponseSerialConnection,
)
from opentrons.drivers.heater_shaker.simulator import SimulatingDriver
from opentrons.drivers.thermocycler import driver
from opentrons.hardware_control import ThreadManager, modules
from opentrons.hardware_control import types as hw_types
from opentrons.hardware_control.module_control import AttachedModulesControl
from opentrons.hardware_control.modules import (
    AbsorbanceReader,
    FlexStacker,
    HeaterShaker,
    TempDeck,
    Thermocycler,
    VacuumModule,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.poller import Poller
from opentrons.hardware_control.pyro_utils.serpent_type_registry import (
    register_hardware_types,
)
from opentrons.hardware_control.types import (
    DoorStateNotification,
    HardwareEvent,
    HardwareEventHandler,
)
from opentrons.util.pyro.pyro_client_async_adapter import (
    AsyncClientPyroObject,
    AsyncPyroFunctionWrapper,
)
from opentrons.util.pyro.pyro_daemon_utility import PYRO_TIMEOUT, create_pyro_daemon
from opentrons.util.pyro.pyro_synchronous_adapter import (
    DaemonUtility,
    PyroSynchronousObject,
    convert_result_to_proxy,
    pyro_behavior,
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
async def tc_reader_mocked_driver(
    mock_driver: SimulatingDriver,
) -> modules.thermocycler.ThermocyclerReader:
    """A reader with a mocked driver."""
    return modules.thermocycler.ThermocyclerReader(driver=mock_driver)  # type: ignore


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
def connection() -> AsyncMock:
    return AsyncMock(spec=AsyncResponseSerialConnection)


@pytest.fixture
def mock_thermo_driver(connection: AsyncMock) -> driver.ThermocyclerDriverV2:
    connection.send_command.return_value = ""
    return driver.ThermocyclerDriverV2(connection)


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
        name_server_ready.wait(timeout=PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", managed_obj, register_hardware_types)

    ns_thread = threading.Thread(target=_nameserver_loop, daemon=True)
    server_thread = threading.Thread(target=_pyro_daemon, daemon=True)

    ns_thread.start()
    server_thread.start()

    # Client-side requests below
    register_hardware_types()
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

    uri = pyro.resolve(uri="PYRONAME:OT3API")
    ot3_proxy = pyro.Proxy(uri)  # type: ignore
    ot3_async = AsyncClientPyroObject(ot3_proxy)
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
    ot3_proxy._pyroRelease()  # type: ignore


async def test_pyro_async_wrapped_calls(  # noqa: C901
    ot3_hardware: ThreadManager[OT3API],
    mock_driver: SimulatingDriver,
    decoy: Decoy,
    tc_reader_mocked_driver: modules.thermocycler.ThermocyclerReader,
    mock_thermo_driver: driver.ThermocyclerDriverV2,
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
    for mod in api._backend.module_controls.available_modules:
        decoy.when(mod._driver).then_return(mock_driver)  # type: ignore

    decoy.when(tc._poller).then_return(Poller(tc_reader_mocked_driver, interval=0.01))

    def _nameserver_loop() -> None:
        # start_ns returns (nameserver, daemon, uri)
        _, ns_daemon, _ = nameserver.start_ns(host=host, port=port)  # type: ignore
        name_server_ready.set()
        # Run until the test process exits; thread is marked daemon=True.
        ns_daemon.requestLoop()

    def _pyro_daemon() -> None:
        # Wait for the nameserver to be ready so locate_ns can succeed.
        name_server_ready.wait(timeout=PYRO_TIMEOUT)
        create_pyro_daemon("OT3API", ot3_hardware, register_hardware_types)

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
        name_server_ready.wait(timeout=PYRO_TIMEOUT)
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

    uri = pyro.resolve(uri="PYRONAME:OT3API")
    ot3_proxy = pyro.Proxy(uri)  # type: ignore
    ot3_async = AsyncClientPyroObject(ot3_proxy)
    ot3api = cast(OT3API, ot3_async)
    door_uri = pyro.resolve(uri="PYRONAME:cool_door")
    door_proxy = pyro.Proxy(door_uri)  # type: ignore
    door_async = AsyncClientPyroObject(door_proxy)

    await ot3api.home()

    # Ensure that functions which provide proxies also are wrapped asynchronously
    async_remote_tc = ot3api.attached_modules[0]
    decoy.when(tc._driver).then_return(mock_thermo_driver)
    # Verify that async calls work on the thermocycler right away
    assert await async_remote_tc.open() == "open"

    # Test registering an outbound function from one remote resource with another remote resouce
    result = ot3api.register_callback(cb=door_async.cool_hardware_event())  # type: ignore

    # Verify the resulting callback proxy (which is wrapped automagically) is wrapped and callable
    assert isinstance(result, AsyncPyroFunctionWrapper)
    result()
