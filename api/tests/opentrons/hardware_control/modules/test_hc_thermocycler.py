import asyncio
from typing import Any, AsyncGenerator, cast

import mock
import pytest
from decoy import Decoy

from opentrons.drivers.asyncio.communication.errors import ErrorResponse, UnhandledGcode
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.thermocycler import SimulatingDriver
from opentrons.drivers.types import PlateTemperature, Temperature, ThermocyclerLidStatus
from opentrons.hardware_control import ExecutionManager, modules
from opentrons.hardware_control.modules.thermocycler import (
    ThermocyclerError,
    ThermocyclerReader,
)
from opentrons.hardware_control.modules.types import (
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
)
from opentrons.hardware_control.poller import Poller

POLL_PERIOD = 1.0
SIMULATING_POLL_PERIOD = POLL_PERIOD / 20.0


@pytest.fixture
def usb_port() -> USBPort:
    """Token USB port."""
    return USBPort(
        name="",
        port_number=0,
        device_path="/dev/ot_module_sim_thermocycler0",
    )


@pytest.fixture
async def subject(
    usb_port: USBPort,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
    mock_execution_manager: ExecutionManager,
) -> AsyncGenerator[modules.Thermocycler, None]:
    """V1 test subject."""
    therm = await modules.build(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        type=modules.ModuleType["THERMOCYCLER"],
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    yield cast(modules.Thermocycler, therm)
    await therm.cleanup()


@pytest.fixture
async def subject_v2(
    usb_port: USBPort,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
    mock_execution_manager: ExecutionManager,
) -> AsyncGenerator[modules.Thermocycler, None]:
    """V2 test subject."""
    therm = await modules.build(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        type=modules.ModuleType["THERMOCYCLER"],
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
        sim_model="thermocyclerModuleV2",
    )
    yield cast(modules.Thermocycler, therm)
    await therm.cleanup()


async def test_sim_initialization(subject: modules.Thermocycler) -> None:
    """It should build a sim object."""
    assert isinstance(subject, modules.AbstractModule)


async def test_lid(subject: modules.Thermocycler) -> None:
    """It should handle lid status."""
    await subject.open()
    assert subject.lid_status == "open"

    await subject.close()
    assert subject.lid_status == "closed"

    await subject.close()
    assert subject.lid_status == "closed"

    await subject.open()
    assert subject.lid_status == "open"


async def test_plate_lift(
    subject: modules.Thermocycler, subject_v2: modules.Thermocycler
) -> None:
    """It should handle plate lift."""
    # First test Gen1 behavior
    await subject.close()
    with pytest.raises(NotImplementedError):
        await subject.lift_plate()

    await subject.open()
    with pytest.raises(NotImplementedError):
        await subject.lift_plate()

    # Now emulate a V2 thermocycler
    await subject_v2.close()
    with pytest.raises(ErrorResponse):
        await subject_v2.lift_plate()

    await subject_v2.open()
    await subject_v2.lift_plate()


async def test_raise_plate(
    subject: modules.Thermocycler, subject_v2: modules.Thermocycler
) -> None:
    """It should handle plate raise."""
    # First test Gen1 behavior
    await subject.open()
    with pytest.raises(NotImplementedError):
        await subject.raise_plate()

    with pytest.raises(NotImplementedError):
        await subject.return_from_raise_plate()

    # Now emulate a V2 thermocycler
    await subject_v2.close()
    with pytest.raises(RuntimeError):
        await subject_v2.raise_plate()

    await subject_v2.open()
    assert subject_v2.lid_status == "open"

    await subject_v2.raise_plate()
    assert subject_v2.lid_status == "open"
    await subject_v2.return_from_raise_plate()
    assert subject_v2.lid_status == "open"


async def test_sim_state(subject: modules.Thermocycler) -> None:
    """It should forward simulated state."""
    assert subject.temperature == 23
    assert subject.target is None
    assert subject.status == "idle"
    assert subject.live_data["status"] == subject.status
    live_data = subject.live_data["data"]
    assert modules.ModuleDataValidator.is_thermocycler_data(live_data)
    assert live_data["currentTemp"] == subject.temperature
    assert live_data["targetTemp"] == subject.target
    status = subject.device_info
    assert status["serial"] == "dummySerialTC"
    assert status["model"] == "dummyModelTC"
    assert status["version"] == "dummyVersionTC"


async def test_sim_update(subject: modules.Thermocycler) -> None:
    """It should update simulated state."""
    await subject.set_temperature(
        temperature=10, hold_time_seconds=None, hold_time_minutes=None, volume=50
    )
    assert subject.temperature == 10
    assert subject.target == 10
    assert subject.status == "holding at target"

    await subject.deactivate_block()
    assert subject.temperature == 23
    assert subject.target is None
    assert subject.status == "idle"

    await subject.set_lid_temperature(temperature=80)
    assert subject.lid_temp == 80
    assert subject.lid_target == 80

    await subject.deactivate_lid()
    assert subject.lid_temp == 23
    assert subject.lid_target is None

    await subject.set_temperature(temperature=10, volume=60, hold_time_seconds=2)
    await subject.set_lid_temperature(temperature=70)
    assert subject.temperature == 10
    assert subject.target == 10
    assert subject.lid_temp == 70
    assert subject.lid_target == 70
    await subject.deactivate()
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
    """Build a driver simulator."""
    return SimulatingDriver()


@pytest.fixture
def set_plate_temp_spy(simulator: SimulatingDriver) -> mock.AsyncMock:
    """Build a spy for set plate temp."""
    return mock.AsyncMock(wraps=simulator.set_plate_temperature)


@pytest.fixture
def simulator_set_plate_spy(
    simulator: SimulatingDriver, set_plate_temp_spy: mock.AsyncMock
) -> SimulatingDriver:
    """Fixture that attaches spy to simulator."""
    simulator.set_plate_temperature = set_plate_temp_spy  # type: ignore[method-assign]
    return simulator


@pytest.fixture
def get_error_state_spy(simulator: SimulatingDriver) -> mock.AsyncMock:
    """Build a spy for get error state."""
    return mock.AsyncMock(wraps=simulator.get_error_state)


@pytest.fixture
def simulator_get_error_spy(
    simulator: SimulatingDriver, get_error_state_spy: mock.AsyncMock
) -> SimulatingDriver:
    """Fixture that attaches a get error spy to the simulator."""
    simulator.get_error_state = get_error_state_spy  # type: ignore[method-assign]
    return simulator


@pytest.fixture
async def set_temperature_subject(
    usb_port: USBPort,
    simulator_set_plate_spy: SimulatingDriver,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
) -> AsyncGenerator[modules.Thermocycler, None]:
    """Fixture that spys on set_plate_temperature"""
    reader = ThermocyclerReader(driver=simulator_set_plate_spy)
    poller = Poller(reader=reader, interval=0.01)

    hw_tc = modules.Thermocycler(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        hw_control_loop=asyncio.get_running_loop(),
        driver=simulator_set_plate_spy,
        reader=reader,
        poller=poller,
        device_info={},
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )

    await poller.start()
    yield hw_tc
    await hw_tc.cleanup()


@pytest.fixture
async def get_error_subject(
    usb_port: USBPort,
    simulator_get_error_spy: SimulatingDriver,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
) -> AsyncGenerator[modules.Thermocycler, None]:
    """Fixture that spys on get error."""
    reader = ThermocyclerReader(driver=simulator_get_error_spy)
    poller = Poller(reader=reader, interval=0.01)
    hw_tc = modules.Thermocycler(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        hw_control_loop=asyncio.get_running_loop(),
        driver=simulator_get_error_spy,
        reader=reader,
        poller=poller,
        device_info={},
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    await poller.start()
    yield hw_tc
    await hw_tc.cleanup()


@pytest.fixture
def mock_driver(simulator: SimulatingDriver) -> mock.AsyncMock:
    """Build a fully mocked driver."""
    return mock.AsyncMock(spec=simulator)


@pytest.fixture
async def subject_mocked_driver(
    usb_port: USBPort,
    mock_driver: mock.AsyncMock,
    mock_execution_manager: ExecutionManager,
    module_disconnected_callback: ModuleDisconnectedCallback,
    module_error_callback: ModuleErrorCallback,
) -> AsyncGenerator[modules.Thermocycler, None]:
    """Test subject with mocked driver"""
    reader = ThermocyclerReader(driver=mock_driver)
    poller = Poller(reader=reader, interval=SIMULATING_POLL_PERIOD)
    therm = modules.Thermocycler(
        port="/dev/ot_module_sim_thermocycler0",
        usb_port=usb_port,
        driver=mock_driver,
        reader=reader,
        poller=poller,
        device_info={
            "serial": "dummySerialTC",
            "model": "dummyModelTC",
            "version": "dummyVersionTC",
        },
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        disconnected_callback=module_disconnected_callback,
        error_callback=module_error_callback,
    )
    mock_driver.get_lid_temperature.return_value = Temperature(current=10, target=None)
    mock_driver.get_lid_status.return_value = ThermocyclerLidStatus.OPEN
    mock_driver.get_plate_temperature.return_value = PlateTemperature(
        current=5, target=None, hold=None
    )

    await poller.start()
    try:
        yield therm
    finally:
        await therm.cleanup()


async def test_set_temperature_with_volume(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """It should call set_plate_temperature with volume param"""
    await set_temperature_subject.set_temperature(30, volume=35)
    set_plate_temp_spy.assert_called_once_with(
        temp=30, hold_time=0, volume=35, ramp_rate=None
    )


async def test_set_temperature_with_ramp_rate(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """It should call set_plate_temperature with volume param"""
    set_temperature_subject._device_info = {
        "serial": "dummySerialTC",
        "model": "dummyModelTC",
        "version": "v1.0.8",
    }
    await set_temperature_subject.set_temperature(30, volume=35, ramp_rate=5.0)
    set_plate_temp_spy.assert_called_once_with(
        temp=30, hold_time=0, volume=35, ramp_rate=5.0
    )


async def test_set_temperature_with_ramp_rate_with_old_firmware(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """It should call set_plate_temperature with volume param"""
    set_temperature_subject._device_info = {
        "serial": "dummySerialTC",
        "model": "dummyModelTC",
        "version": "v1.0.7",
    }
    with pytest.raises(ThermocyclerError):
        await set_temperature_subject.set_temperature(30, volume=35, ramp_rate=5.0)


async def test_set_temperature_mixed_hold(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """It should call set_plate_temperature with total second count computed from
    mix of seconds and minutes."""
    await set_temperature_subject.set_temperature(
        30, hold_time_seconds=20, hold_time_minutes=1
    )
    set_plate_temp_spy.assert_called_once_with(
        temp=30, hold_time=80, volume=None, ramp_rate=None
    )


async def test_set_temperature_just_seconds_hold(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """ "It should call set_plate_temperature with total second count computed from
    just seconds."""
    await set_temperature_subject.set_temperature(20, hold_time_seconds=30)
    set_plate_temp_spy.assert_called_once_with(
        temp=20, hold_time=30, volume=None, ramp_rate=None
    )


async def test_set_temperature_just_minutes_hold(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """ "It should call set_plate_temperature with total second count computed from
    just minutes."""
    await set_temperature_subject.set_temperature(40, hold_time_minutes=5.5)
    set_plate_temp_spy.assert_called_once_with(
        temp=40, hold_time=330, volume=None, ramp_rate=None
    )


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
            mock.call(temp=42, hold_time=30, volume=123, ramp_rate=None),
            mock.call(temp=50, hold_time=60, volume=123, ramp_rate=None),
            mock.call(temp=60, hold_time=150, volume=123, ramp_rate=None),
            mock.call(temp=70, hold_time=0, volume=123, ramp_rate=None),
        ]
        * 5
    )


async def test_execute_profile(
    set_temperature_subject: modules.Thermocycler, set_plate_temp_spy: mock.AsyncMock
) -> None:
    """It should send a series of set_plate_temperatures from a profile."""
    await set_temperature_subject.execute_profile(
        [
            {"temperature": 42, "hold_time_seconds": 30},
            {
                "repetitions": 5,
                "steps": [
                    {"temperature": 20, "hold_time_minutes": 1},
                    {"temperature": 30, "hold_time_seconds": 1},
                ],
            },
            {"temperature": 90, "hold_time_seconds": 2},
            {
                "repetitions": 10,
                "steps": [
                    {"temperature": 10, "hold_time_minutes": 2},
                    {"temperature": 20, "hold_time_seconds": 5},
                ],
            },
        ],
        volume=123,
    )
    assert set_plate_temp_spy.call_args_list == [
        mock.call(temp=42, hold_time=30, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=60, volume=123, ramp_rate=None),
        mock.call(temp=30, hold_time=1, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=60, volume=123, ramp_rate=None),
        mock.call(temp=30, hold_time=1, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=60, volume=123, ramp_rate=None),
        mock.call(temp=30, hold_time=1, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=60, volume=123, ramp_rate=None),
        mock.call(temp=30, hold_time=1, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=60, volume=123, ramp_rate=None),
        mock.call(temp=30, hold_time=1, volume=123, ramp_rate=None),
        mock.call(temp=90, hold_time=2, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
        mock.call(temp=10, hold_time=120, volume=123, ramp_rate=None),
        mock.call(temp=20, hold_time=5, volume=123, ramp_rate=None),
    ]


async def test_sync_error_response_to_poller(
    subject_mocked_driver: modules.Thermocycler,
    mock_driver: mock.AsyncMock,
) -> None:
    """Test that poll after synchronous temperature response with error updates module live data and status."""
    mock_driver.get_plate_temperature.return_value = PlateTemperature(
        current=50, target=50, hold=None
    )
    mock_driver.get_lid_temperature.side_effect = Exception()
    mock_driver.get_lid_status.return_value = ThermocyclerLidStatus.OPEN

    async def fake_temperature_setter(*args: Any, **kwargs: Any) -> None:
        pass

    mock_driver.set_plate_temperature.return_value = (  # to trigger the poll
        fake_temperature_setter
    )

    with pytest.raises(Exception):
        await subject_mocked_driver.set_temperature(20)
    assert subject_mocked_driver.live_data["status"] == "error"
    assert subject_mocked_driver.status == modules.TemperatureStatus.ERROR


async def test_async_error_response_to_poller(
    subject_mocked_driver: modules.Thermocycler,
    mock_driver: mock.AsyncMock,
    module_error_callback: ModuleErrorCallback,
    decoy: Decoy,
) -> None:
    """Test that asynchronous error is detected by poller and module live data and status are updated."""
    mock_driver.get_lid_temperature.return_value = Temperature(current=50, target=50)
    mock_driver.get_lid_status.return_value = ThermocyclerLidStatus.OPEN
    mock_driver.model.return_value = "some-model"
    exc = Exception("oh no!")
    mock_driver.get_plate_temperature.side_effect = exc
    with pytest.raises(Exception):
        await subject_mocked_driver._poller.wait_next_poll()
    assert subject_mocked_driver.live_data["status"] == "error"
    assert subject_mocked_driver.status == modules.TemperatureStatus.ERROR
    decoy.verify(
        module_error_callback(
            exc,
            "some-model",
            "/dev/ot_module_sim_thermocycler0",
            "dummySerialTC",
        )
    )


def test_can_use_ramp_rate(subject: modules.Thermocycler) -> None:
    """It should handle various malformed versions without failing."""
    subject._device_info["version"] = "v1.0.9"
    assert subject.can_use_ramp_rate()
    subject._device_info["version"] = "v1.0.7"
    assert subject.can_use_ramp_rate() is False
    subject._device_info["version"] = "asdasvasd"
    assert subject.can_use_ramp_rate() is False
    subject._device_info["version"] = ""
    assert subject.can_use_ramp_rate() is False
    del subject._device_info["version"]
    assert subject.can_use_ramp_rate() is False


async def test_reader_ignores_get_error_state_not_available(
    get_error_state_spy: mock.AsyncMock,
    simulator_get_error_spy: SimulatingDriver,
) -> None:
    """It should not raise if the module does not support get-error-state."""
    reader = ThermocyclerReader(driver=simulator_get_error_spy)
    get_error_state_spy.side_effect = UnhandledGcode(
        "/dev/ot_module_sim_thermocycler0", "ERR001:unhandled gcode", "M411"
    )
    await reader.read()


async def test_reader_raises_error_from_get_error(
    get_error_subject: modules.Thermocycler,
    get_error_state_spy: mock.AsyncMock,
    module_error_callback: ModuleErrorCallback,
    decoy: Decoy,
) -> None:
    """It should put the error all the way out to the error callback from the reader."""
    error_state_response = ErrorResponse(
        "/dev/ot_module_sim_thermocycler0", "ERR:666:you know what it is", "M411"
    )
    get_error_state_spy.side_effect = error_state_response
    with pytest.raises(ErrorResponse):
        await get_error_subject._poller.wait_next_poll()
    decoy.verify(
        module_error_callback(
            error_state_response,
            model="thermocyclerModuleV1",
            port="/dev/ot_module_sim_thermocycler0",
            serial=None,
        )
    )
