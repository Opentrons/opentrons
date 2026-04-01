import asyncio
from typing import Any, AsyncGenerator

import pytest
from decoy import Decoy

from opentrons.drivers.asyncio.communication.errors import ErrorResponse, UnhandledGcode
from opentrons.drivers.heater_shaker.simulator import SimulatingDriver
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.types import RPM, HeaterShakerLabwareLatchStatus, Temperature
from opentrons.hardware_control import ExecutionManager, modules, poller
from opentrons.hardware_control.modules.heater_shaker import HeaterShakerReader
from opentrons.hardware_control.modules.types import (
    HeaterShakerStatus,
    ModuleDisconnectedCallback,
    ModuleErrorCallback,
    SpeedStatus,
    TemperatureStatus,
)


@pytest.fixture
def usb_port() -> USBPort:
    """A token USB port."""
    return USBPort(
        name="",
        port_number=0,
        device_path="/dev/ot_module_sim_heatershaker0",
    )


@pytest.fixture
async def simulating_module(
    usb_port: USBPort,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
) -> AsyncGenerator[modules.AbstractModule, None]:
    """Get a mocked simulating subject."""
    module = await modules.build(
        port=usb_port.device_path,
        usb_port=usb_port,
        type=modules.ModuleType["HEATER_SHAKER"],
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    assert isinstance(module, modules.AbstractModule)
    try:
        yield module
    finally:
        await module.cleanup()


@pytest.fixture
def mock_driver(decoy: Decoy) -> SimulatingDriver:
    """Get a mocked simulating driver."""
    return decoy.mock(cls=SimulatingDriver)


@pytest.fixture
async def reader_mocked_driver(mock_driver: SimulatingDriver) -> HeaterShakerReader:
    """A reader with a mocked driver."""
    return HeaterShakerReader(driver=mock_driver)


@pytest.fixture
async def simulating_module_driver_patched(
    mock_driver: SimulatingDriver,
    usb_port: USBPort,
    mock_execution_manager: ExecutionManager,
    module_error_callback: ModuleErrorCallback,
    module_disconnected_callback: ModuleDisconnectedCallback,
    reader_mocked_driver: HeaterShakerReader,
) -> AsyncGenerator[modules.AbstractModule, None]:
    """Get a mocked module with a patched driver."""
    poller_obj = poller.Poller(reader=reader_mocked_driver, interval=0.01)
    module = modules.HeaterShaker(
        port="/dev/ot_module_sim_heatershaker0",
        usb_port=usb_port,
        hw_control_loop=asyncio.get_running_loop(),
        driver=mock_driver,
        reader=reader_mocked_driver,
        poller=poller_obj,
        device_info={},
        execution_manager=mock_execution_manager,
        error_callback=module_error_callback,
        disconnected_callback=module_disconnected_callback,
    )
    await poller_obj.start()
    yield module
    await module.cleanup()


async def test_sim_state(simulating_module: modules.HeaterShaker) -> None:
    """It should forward simulated state."""
    assert simulating_module.temperature == 23
    assert simulating_module.speed == 0
    assert simulating_module.target_temperature is None
    assert simulating_module.target_speed is None
    assert simulating_module.temperature_status == TemperatureStatus.IDLE
    assert simulating_module.speed_status == SpeedStatus.IDLE
    assert simulating_module.status == HeaterShakerStatus.IDLE
    status = simulating_module.device_info
    assert status["serial"] == "dummySerialHS"
    # return v1 if sim_model is not passed
    assert status["model"] == "dummyModelHS"
    assert status["version"] == "dummyVersionHS"


async def test_sim_update(simulating_module: modules.HeaterShaker) -> None:
    """It should update its simulated state."""
    await simulating_module.start_set_temperature(10)
    await simulating_module.await_temperature(10)
    assert simulating_module.temperature == 10
    assert simulating_module.target_temperature == 10
    assert simulating_module.temperature_status == TemperatureStatus.HOLDING
    assert simulating_module.status == HeaterShakerStatus.RUNNING

    await simulating_module.set_speed(2000)
    assert simulating_module.speed == 2000
    assert simulating_module.target_speed == 2000
    assert simulating_module.speed_status == SpeedStatus.HOLDING
    assert simulating_module.status == HeaterShakerStatus.RUNNING

    await simulating_module.deactivate()
    assert simulating_module.temperature == 23
    assert simulating_module.speed == 0
    assert simulating_module.target_temperature is None
    assert simulating_module.target_speed is None
    assert simulating_module.temperature_status == TemperatureStatus.IDLE
    assert simulating_module.speed_status == SpeedStatus.IDLE


async def test_await_both(simulating_module: modules.HeaterShaker) -> None:
    """It should wait for speed and temp."""
    await simulating_module.start_set_temperature(10)
    await simulating_module.set_speed(2000)
    await simulating_module.await_temperature(10)
    assert simulating_module.temperature_status == TemperatureStatus.HOLDING
    assert simulating_module.speed_status == SpeedStatus.HOLDING


async def test_labware_latch(simulating_module: modules.HeaterShaker) -> None:
    """It should handle the latch."""
    await simulating_module.open_labware_latch()
    assert (
        await simulating_module._driver.get_labware_latch_status()
        == HeaterShakerLabwareLatchStatus.IDLE_OPEN
    )
    await simulating_module.close_labware_latch()
    assert (
        await simulating_module._driver.get_labware_latch_status()
        == HeaterShakerLabwareLatchStatus.IDLE_CLOSED
    )


async def test_initial_live_data(simulating_module: modules.HeaterShaker) -> None:
    """Should return the simulating module's initial live data."""
    assert simulating_module.live_data == {
        "data": {
            "labwareLatchStatus": "idle_unknown",
            "speedStatus": "idle",
            "temperatureStatus": "idle",
            "currentSpeed": 0,
            "currentTemp": 23,
            "targetSpeed": None,
            "targetTemp": None,
            "errorDetails": None,
        },
        "status": "idle",
    }


async def test_updated_live_data(simulating_module: modules.HeaterShaker) -> None:
    """Should update live data after module commands."""
    await simulating_module.close_labware_latch()
    await simulating_module.start_set_temperature(50)
    await simulating_module.set_speed(100)
    assert simulating_module.live_data == {
        "data": {
            "labwareLatchStatus": "idle_closed",
            "speedStatus": "holding at target",
            "temperatureStatus": "holding at target",
            "currentSpeed": 100,
            "currentTemp": 50,
            "targetSpeed": 100,
            "targetTemp": 50,
            "errorDetails": None,
        },
        "status": "running",
    }


async def test_deactivated_updated_live_data(
    simulating_module: modules.HeaterShaker,
) -> None:
    """Should update live data after module commands."""
    await simulating_module.close_labware_latch()
    await simulating_module.start_set_temperature(50)
    await simulating_module.set_speed(100)
    assert simulating_module.live_data == {
        "data": {
            "labwareLatchStatus": "idle_closed",
            "speedStatus": "holding at target",
            "temperatureStatus": "holding at target",
            "currentSpeed": 100,
            "currentTemp": 50,
            "targetSpeed": 100,
            "targetTemp": 50,
            "errorDetails": None,
        },
        "status": "running",
    }
    await simulating_module.deactivate()
    assert simulating_module.live_data == {
        "data": {
            "labwareLatchStatus": "idle_closed",
            "speedStatus": "idle",
            "temperatureStatus": "idle",
            "currentSpeed": 0,
            "currentTemp": 23,
            "targetSpeed": None,
            "targetTemp": None,
            "errorDetails": None,
        },
        "status": "idle",
    }


async def fake_get_rpm(*args: Any, **kwargs: Any) -> RPM:
    return RPM(current=500, target=500)


async def fake_get_temperature(*args: Any, **kwargs: Any) -> Temperature:
    return Temperature(current=50, target=50)


async def fake_get_latch_status(
    *args: Any, **kwargs: Any
) -> HeaterShakerLabwareLatchStatus:
    return HeaterShakerLabwareLatchStatus.IDLE_OPEN


async def test_async_error_response(
    simulating_module_driver_patched: modules.HeaterShaker,
    module_error_callback: ModuleErrorCallback,
    mock_driver: SimulatingDriver,
    decoy: Decoy,
) -> None:
    """Test that asynchronous error is detected by poller and module live data and status are updated."""
    exc = Exception("Oh no, an asynchronous error!")
    decoy.when(await mock_driver.get_error_state()).then_return(None)  # type: ignore[func-returns-value]
    decoy.when(await mock_driver.get_rpm()).then_return(RPM(current=500, target=500))
    decoy.when(await mock_driver.get_labware_latch_status()).then_return(
        HeaterShakerLabwareLatchStatus.IDLE_OPEN
    )
    decoy.when(await mock_driver.get_temperature()).then_return(
        Temperature(current=50, target=50)
    )
    await simulating_module_driver_patched._poller.wait_next_poll()
    decoy.when(await mock_driver.get_temperature()).then_raise(exc)
    with pytest.raises(Exception):
        await simulating_module_driver_patched._poller.wait_next_poll()
    decoy.verify(
        module_error_callback(
            exc, "heaterShakerModuleV1", "/dev/ot_module_sim_heatershaker0", None
        )
    )

    assert (
        simulating_module_driver_patched.live_data["data"]["errorDetails"]  # type: ignore[index,typeddict-item]
        == "Oh no, an asynchronous error!"
    )
    assert simulating_module_driver_patched.status == HeaterShakerStatus.ERROR
    decoy.reset()
    decoy.when(await mock_driver.get_error_state()).then_return(None)  # type: ignore[func-returns-value]
    decoy.when(await mock_driver.get_temperature()).then_return(
        Temperature(current=50, target=50)
    )
    decoy.when(await mock_driver.get_rpm()).then_return(RPM(current=500, target=500))
    decoy.when(await mock_driver.get_labware_latch_status()).then_return(
        HeaterShakerLabwareLatchStatus.IDLE_OPEN
    )
    await simulating_module_driver_patched._poller.wait_next_poll()
    assert simulating_module_driver_patched.live_data["data"]["errorDetails"] is None  # type: ignore[index,typeddict-item]
    assert simulating_module_driver_patched.status == HeaterShakerStatus.RUNNING  # type: ignore[comparison-overlap]


async def test_reader_ignores_get_error_state_not_available(
    mock_driver: SimulatingDriver,
    reader_mocked_driver: HeaterShakerReader,
    decoy: Decoy,
) -> None:
    """It should not raise if the module does not support get-error-state."""
    err = UnhandledGcode(
        "/dev/ot_module_sim_heatershaker0", "ERR:001:unhandled gcode", "M411"
    )
    decoy.when(await mock_driver.get_error_state()).then_raise(err)  # type: ignore[func-returns-value]
    await reader_mocked_driver.read()


async def test_reader_raises_error_from_get_error(
    mock_driver: SimulatingDriver,
    module_error_callback: ModuleErrorCallback,
    simulating_module_driver_patched: modules.HeaterShaker,
    decoy: Decoy,
) -> None:
    """It should put the error all the way out to the error callback from the reader."""
    error_state_response = ErrorResponse(
        "/dev/ot_module_sim_heatershaker0", "ERR:666:you know what it is", "M411"
    )
    decoy.when(await mock_driver.get_error_state()).then_raise(error_state_response)  # type: ignore[func-returns-value]
    with pytest.raises(ErrorResponse):
        await simulating_module_driver_patched._poller.wait_next_poll()
    decoy.verify(
        module_error_callback(
            error_state_response,
            model="heaterShakerModuleV1",
            port="/dev/ot_module_sim_heatershaker0",
            serial=None,
        )
    )
