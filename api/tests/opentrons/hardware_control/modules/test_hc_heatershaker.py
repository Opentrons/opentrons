import asyncio
import pytest
import mock
from typing import Any, AsyncGenerator
import typing
from opentrons.hardware_control import modules, ExecutionManager
from opentrons.hardware_control.modules.types import (
    TemperatureStatus,
    SpeedStatus,
    HeaterShakerStatus,
)
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus, Temperature, RPM


@pytest.fixture
def usb_port() -> USBPort:
    return USBPort(
        name="",
        port_number=0,
        device_path="/dev/ot_module_sim_heatershaker0",
    )


@pytest.fixture
async def simulating_module(
    usb_port: USBPort,
) -> AsyncGenerator[modules.AbstractModule, None]:
    module = await modules.build(
        port=usb_port.device_path,
        usb_port=usb_port,
        type=modules.ModuleType["HEATER_SHAKER"],
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
    )
    assert isinstance(module, modules.AbstractModule)
    try:
        yield module
    finally:
        await module.cleanup()


@pytest.fixture
async def simulating_module_driver_patched(
    simulating_module: modules.HeaterShaker,
) -> AsyncGenerator[modules.AbstractModule, None]:
    driver_mock = mock.MagicMock()
    with mock.patch.object(
        simulating_module, "_driver", driver_mock
    ), mock.patch.object(simulating_module._reader, "_driver", driver_mock):
        yield simulating_module


async def test_sim_state(simulating_module: modules.HeaterShaker) -> None:
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
    await simulating_module.start_set_temperature(10)
    await simulating_module.set_speed(2000)
    await simulating_module.await_temperature(10)
    assert simulating_module.temperature_status == TemperatureStatus.HOLDING
    assert simulating_module.speed_status == SpeedStatus.HOLDING


async def test_labware_latch(simulating_module: modules.HeaterShaker) -> None:
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


@typing.no_type_check
async def test_async_error_response(
    simulating_module_driver_patched: modules.HeaterShaker,
) -> None:
    """Test that asynchronous error is detected by poller and module live data and status are updated."""
    # TODO(mc, 2022-10-13): driver is too deep a level to mock in this test
    # mock the reader, instead
    simulating_module_driver_patched._driver.get_temperature.side_effect = Exception()
    with pytest.raises(Exception):
        await simulating_module_driver_patched._poller.wait_next_poll()

    assert (
        simulating_module_driver_patched.live_data["data"]["errorDetails"]
        == "Exception()"
    )
    assert simulating_module_driver_patched.status == HeaterShakerStatus.ERROR
    simulating_module_driver_patched._driver.get_temperature.side_effect = (
        fake_get_temperature
    )
    simulating_module_driver_patched._driver.get_rpm.side_effect = fake_get_rpm
    simulating_module_driver_patched._driver.get_labware_latch_status.side_effect = (
        fake_get_latch_status
    )
    await simulating_module_driver_patched._poller.wait_next_poll()
    assert simulating_module_driver_patched.live_data["data"]["errorDetails"] is None
    assert simulating_module_driver_patched.status == HeaterShakerStatus.RUNNING
