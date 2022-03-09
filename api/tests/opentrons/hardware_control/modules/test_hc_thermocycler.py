import pytest
import mock
from opentrons.drivers.thermocycler import SimulatingDriver
from opentrons.hardware_control import modules, ExecutionManager

from opentrons.drivers.rpi_drivers.types import USBPort


@pytest.fixture
def usb_port() -> USBPort:
    return USBPort(
        name="",
        hub=None,
        port_number=0,
        device_path="/dev/ot_module_sim_thermocycler0",
    )


async def test_sim_initialization(loop, usb_port):
    therm = await modules.build(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        which="thermocycler",
        simulating=True,
        loop=loop,
        execution_manager=ExecutionManager(),
    )

    assert isinstance(therm, modules.AbstractModule)


async def test_lid(loop, usb_port):
    therm = await modules.build(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        which="thermocycler",
        simulating=True,
        loop=loop,
        execution_manager=ExecutionManager(),
    )

    await therm.open()
    await therm.wait_next_poll()
    assert therm.lid_status == "open"

    await therm.close()
    await therm.wait_next_poll()
    assert therm.lid_status == "closed"

    await therm.close()
    await therm.wait_next_poll()
    assert therm.lid_status == "closed"

    await therm.open()
    await therm.wait_next_poll()
    assert therm.lid_status == "open"


async def test_sim_state(loop, usb_port):
    therm = await modules.build(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        which="thermocycler",
        simulating=True,
        loop=loop,
        execution_manager=ExecutionManager(),
    )

    assert therm.temperature is None
    assert therm.target is None
    assert therm.status == "error"
    assert therm.live_data["status"] == therm.status
    assert therm.live_data["data"]["currentTemp"] == therm.temperature
    assert therm.live_data["data"]["targetTemp"] == therm.target
    status = therm.device_info
    assert status["serial"] == "dummySerialTC"
    assert status["model"] == "dummyModelTC"
    assert status["version"] == "dummyVersionTC"


async def test_sim_update(loop, usb_port):
    therm = await modules.build(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        which="thermocycler",
        simulating=True,
        loop=loop,
        execution_manager=ExecutionManager(),
    )

    await therm.set_temperature(
        temperature=10, hold_time_seconds=None, hold_time_minutes=None, volume=50
    )
    await therm.wait_next_poll()
    assert therm.temperature == 10
    assert therm.target == 10
    assert therm.status == "holding at target"
    # await asyncio.wait_for(therm.wait_for_temp(), timeout=0.2)
    await therm.deactivate_block()
    await therm.wait_next_poll()
    assert therm.temperature == 23
    assert therm.target is None
    assert therm.status == "idle"

    await therm.set_lid_temperature(temperature=80)
    assert therm.lid_temp == 80
    assert therm.lid_target == 80

    await therm.deactivate_lid()
    await therm.wait_next_poll()
    assert therm.lid_temp == 23
    assert therm.lid_target is None

    await therm.set_temperature(temperature=10, volume=60, hold_time_seconds=2)
    await therm.set_lid_temperature(temperature=70)
    assert therm.temperature == 10
    assert therm.target == 10
    assert therm.lid_temp == 70
    assert therm.lid_target == 70
    await therm.deactivate()
    await therm.wait_next_poll()
    assert therm.temperature == 23
    assert therm.target is None
    assert therm.status == "idle"
    assert therm.lid_temp == 23
    assert therm.lid_target is None


@pytest.fixture
def simulator() -> SimulatingDriver:
    return SimulatingDriver()


@pytest.fixture
def set_plate_temp_spy(simulator: SimulatingDriver) -> mock.AsyncMock:
    return mock.AsyncMock(wraps=simulator.set_plate_temperature)


@pytest.fixture
def simulator_set_plate_spy(
    simulator: SimulatingDriver, set_plate_temp_spy: mock.AsyncMock
) -> SimulatingDriver:
    """Fixture that attaches spy to simulator."""
    simulator.set_plate_temperature = set_plate_temp_spy
    return simulator


@pytest.fixture
async def set_temperature_subject(
    loop, usb_port: USBPort, simulator_set_plate_spy: SimulatingDriver
) -> modules.Thermocycler:
    """Fixture that spys on set_plate_temperature"""
    hw_tc = modules.Thermocycler(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        loop=loop,
        execution_manager=ExecutionManager(),
        driver=simulator_set_plate_spy,
        device_info={},
        polling_interval_sec=0.001,
    )
    return hw_tc


async def test_set_temperature_with_volume(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
):
    """It should call set_plate_temperature with volume param"""
    await set_temperature_subject.set_temperature(30, volume=35)
    set_plate_temp_spy.assert_called_once_with(temp=30, hold_time=0, volume=35)


async def test_set_temperature_mixed_hold(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
):
    """It should call set_plate_temperature with total second count computed from
    mix of seconds and minutes."""
    await set_temperature_subject.set_temperature(
        30, hold_time_seconds=20, hold_time_minutes=1
    )
    set_plate_temp_spy.assert_called_once_with(temp=30, hold_time=80, volume=None)


async def test_set_temperature_just_seconds_hold(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
):
    """ "It should call set_plate_temperature with total second count computed from
    just seconds."""
    await set_temperature_subject.set_temperature(20, hold_time_seconds=30)
    set_plate_temp_spy.assert_called_once_with(temp=20, hold_time=30, volume=None)


async def test_set_temperature_just_minutes_hold(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
):
    """ "It should call set_plate_temperature with total second count computed from
    just minutes."""
    await set_temperature_subject.set_temperature(40, hold_time_minutes=5.5)
    set_plate_temp_spy.assert_called_once_with(temp=40, hold_time=330, volume=None)


async def test_set_temperature_fuzzy(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
):
    """ "It should call set_plate_temperature with passed in hold time when under
    fuzzy seconds."""
    # Test hold_time < _hold_time_fuzzy_seconds. Here we know
    # that wait_for_hold will be called with the direct hold
    # time rather than increments of 0.1
    set_temperature_subject._wait_for_hold = mock.AsyncMock()
    await set_temperature_subject.set_temperature(40, hold_time_seconds=2)
    set_temperature_subject._wait_for_hold.assert_called_once_with(2)
    set_plate_temp_spy.assert_called_once_with(temp=40, hold_time=2, volume=None)


async def test_cycle_temperature(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
):
    """It should send a series of set_plate_temperature commands from
    a configuration."""
    await set_temperature_subject.cycle_temperatures(
        steps=[
            {"temperature": 42, "hold_time_seconds": 30},
            {"temperature": 50, "hold_time_minutes": 1},
            {"temperature": 60, "hold_time_seconds": 30, "hold_time_minutes": 2},
            {
                "temperature": 70,
            },
        ],
        repetitions=5,
        volume=123,
    )

    assert (
        set_plate_temp_spy.call_args_list
        == [
            mock.call(temp=42, hold_time=30, volume=123),
            mock.call(temp=50, hold_time=60, volume=123),
            mock.call(temp=60, hold_time=150, volume=123),
            mock.call(temp=70, hold_time=0, volume=123),
        ]
        * 5
    )
