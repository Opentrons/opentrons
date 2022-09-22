import asyncio
import mock
from typing import AsyncGenerator, cast
from opentrons.drivers.types import Temperature, PlateTemperature, ThermocyclerLidStatus

import pytest

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.thermocycler import SimulatingDriver
from opentrons.hardware_control import modules, ExecutionManager


POLL_PERIOD = 1.0
SIMULATING_POLL_PERIOD = POLL_PERIOD / 20.0


@pytest.fixture
def usb_port() -> USBPort:
    return USBPort(
        name="",
        hub=None,
        port_number=0,
        device_path="/dev/ot_module_sim_thermocycler0",
    )


@pytest.fixture
async def subject(usb_port: USBPort) -> AsyncGenerator[modules.Thermocycler, None]:
    """Test subject"""
    therm = await modules.build(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        which="thermocycler",
        simulating=True,
        loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
    )
    yield cast(modules.Thermocycler, therm)
    await therm.cleanup()


@pytest.fixture
async def subject_mocked_driver(
    usb_port: USBPort,
) -> AsyncGenerator[modules.Thermocycler, None]:
    """Test subject with mocked driver"""
    driver_mock = mock.AsyncMock()
    therm = modules.Thermocycler(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        execution_manager=ExecutionManager(),
        driver=driver_mock,
        device_info={
            "serial": "dummySerialTC",
            "model": "dummyModelTC",
            "version": "dummyVersionTC",
        },
        loop=asyncio.get_running_loop(),
        polling_interval_sec=SIMULATING_POLL_PERIOD,
    )
    try:
        yield therm
    finally:
        await therm.cleanup()


async def test_sim_initialization(subject: modules.Thermocycler) -> None:
    assert isinstance(subject, modules.AbstractModule)


async def test_lid(subject: modules.Thermocycler) -> None:
    await subject.open()
    await subject.wait_next_poll()
    assert subject.lid_status == "open"

    await subject.close()
    await subject.wait_next_poll()
    assert subject.lid_status == "closed"

    await subject.close()
    await subject.wait_next_poll()
    assert subject.lid_status == "closed"

    await subject.open()
    await subject.wait_next_poll()
    assert subject.lid_status == "open"


async def test_sim_state(subject: modules.Thermocycler) -> None:
    assert subject.temperature == 23
    assert subject.target is None
    assert subject.status == "idle"
    assert subject.live_data["status"] == subject.status
    assert subject.live_data["data"]["currentTemp"] == subject.temperature
    assert subject.live_data["data"]["targetTemp"] == subject.target
    status = subject.device_info
    assert status["serial"] == "dummySerialTC"
    assert status["model"] == "dummyModelTC"
    assert status["version"] == "dummyVersionTC"


async def test_sim_update(subject: modules.Thermocycler) -> None:
    await subject.set_temperature(
        temperature=10, hold_time_seconds=None, hold_time_minutes=None, volume=50
    )
    await subject.wait_next_poll()
    assert subject.temperature == 10
    assert subject.target == 10
    assert subject.status == "holding at target"

    await subject.deactivate_block()
    await subject.wait_next_poll()
    assert subject.temperature == 23
    assert subject.target is None
    assert subject.status == "idle"

    await subject.set_lid_temperature(temperature=80)
    assert subject.lid_temp == 80
    assert subject.lid_target == 80

    await subject.deactivate_lid()
    await subject.wait_next_poll()
    assert subject.lid_temp == 23
    assert subject.lid_target is None

    await subject.set_temperature(temperature=10, volume=60, hold_time_seconds=2)
    await subject.set_lid_temperature(temperature=70)
    assert subject.temperature == 10
    assert subject.target == 10
    assert subject.lid_temp == 70
    assert subject.lid_target == 70
    await subject.deactivate()
    await subject.wait_next_poll()
    assert subject.temperature == 23
    assert subject.target is None
    assert subject.status == "idle"
    assert subject.lid_temp == 23
    assert subject.lid_target is None

    await subject.set_target_block_temperature(celsius=50.0)
    assert subject.target == 50.0
    await subject.deactivate_block()
    assert subject.target is None

    await subject.set_target_lid_temperature(celsius=50.0)
    assert subject.lid_target == 50.0
    await subject.deactivate_lid()
    assert subject.lid_target is None


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
    simulator.set_plate_temperature = set_plate_temp_spy  # type: ignore[assignment]
    return simulator


@pytest.fixture
async def set_temperature_subject(
    usb_port: USBPort, simulator_set_plate_spy: SimulatingDriver
) -> AsyncGenerator[modules.Thermocycler, None]:
    """Fixture that spys on set_plate_temperature"""
    hw_tc = modules.Thermocycler(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
        driver=simulator_set_plate_spy,
        device_info={},
        polling_interval_sec=0.001,
    )
    yield hw_tc
    await hw_tc.cleanup()


async def test_set_temperature_with_volume(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """It should call set_plate_temperature with volume param"""
    await set_temperature_subject.set_temperature(30, volume=35)
    set_plate_temp_spy.assert_called_once_with(temp=30, hold_time=0, volume=35)


async def test_set_temperature_mixed_hold(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """It should call set_plate_temperature with total second count computed from
    mix of seconds and minutes."""
    await set_temperature_subject.set_temperature(
        30, hold_time_seconds=20, hold_time_minutes=1
    )
    set_plate_temp_spy.assert_called_once_with(temp=30, hold_time=80, volume=None)


async def test_set_temperature_just_seconds_hold(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """ "It should call set_plate_temperature with total second count computed from
    just seconds."""
    await set_temperature_subject.set_temperature(20, hold_time_seconds=30)
    set_plate_temp_spy.assert_called_once_with(temp=20, hold_time=30, volume=None)


async def test_set_temperature_just_minutes_hold(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """ "It should call set_plate_temperature with total second count computed from
    just minutes."""
    await set_temperature_subject.set_temperature(40, hold_time_minutes=5.5)
    set_plate_temp_spy.assert_called_once_with(temp=40, hold_time=330, volume=None)


async def test_set_temperature_fuzzy(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """ "It should call set_plate_temperature with passed in hold time when under
    fuzzy seconds."""
    # Test hold_time < _hold_time_fuzzy_seconds. Here we know
    # that wait_for_hold will be called with the direct hold
    # time rather than increments of 0.1
    set_temperature_subject._wait_for_hold = mock.AsyncMock()  # type: ignore[assignment]
    await set_temperature_subject.set_temperature(40, hold_time_seconds=2)
    set_temperature_subject._wait_for_hold.assert_called_once_with(2)
    set_plate_temp_spy.assert_called_once_with(temp=40, hold_time=2, volume=None)


async def test_cycle_temperature(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
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


async def fake_get_plate_temperature(*args, **kwargs):
    return PlateTemperature(current=50, target=50)


async def fake_get_lid_temperature(*args, **kwargs):
    return Temperature(current=50, target=50)


async def fake_get_lid_status(*args, **kwargs):
    return ThermocyclerLidStatus.OPEN


@pytest.mark.parametrize(
    "mock_get_plate_temp,mock_get_lid_temp,mock_get_lid_status",
    [
        (fake_get_plate_temperature, Exception(), fake_get_lid_status),
        (Exception(), fake_get_lid_temperature, fake_get_lid_status),
        (fake_get_plate_temperature, fake_get_lid_temperature, Exception()),
    ],
)
async def test_sync_error_response_to_poller(
    subject_mocked_driver: modules.Thermocycler,
    mock_get_plate_temp,
    mock_get_lid_temp,
    mock_get_lid_status,
):
    """Test that poll after synchronous temperature response with error updates module live data and status."""
    subject_mocked_driver._driver.get_plate_temperature.return_value = (
        mock_get_plate_temp
    )
    subject_mocked_driver._driver.get_lid_temperature.return_value = mock_get_lid_temp
    subject_mocked_driver._driver.get_lid_status.return_value = mock_get_lid_status

    async def fake_temperature_setter(*args, **kwargs):
        pass

    subject_mocked_driver._driver.set_plate_temperature.return_value = (  # to trigger the poll
        fake_temperature_setter
    )

    with pytest.raises(Exception):
        await subject_mocked_driver.set_temperature(20)
    assert subject_mocked_driver.live_data["status"] == "error"
    assert subject_mocked_driver.status == modules.TemperatureStatus.ERROR


async def test_async_error_response_to_poller(
    subject_mocked_driver: modules.Thermocycler,
):
    """Test that asynchronous error is detected by poller and module live data and status are updated."""
    subject_mocked_driver._driver.get_lid_temperature.return_value = (
        fake_get_lid_temperature
    )
    subject_mocked_driver._driver.get_lid_status.return_value = fake_get_lid_status
    subject_mocked_driver._driver.get_plate_temperature.return_value = Exception()
    with pytest.raises(Exception):
        await subject_mocked_driver.wait_next_poll()
    assert subject_mocked_driver.live_data["status"] == "error"
    assert subject_mocked_driver.status == modules.TemperatureStatus.ERROR
