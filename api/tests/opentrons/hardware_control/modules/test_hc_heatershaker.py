import pytest
from opentrons.hardware_control import modules, ExecutionManager
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.types import HeaterShakerPlateLockStatus


@pytest.fixture
def usb_port():
    return USBPort(
        name="",
        sub_names=[],
        hub=None,
        port_number=None,
        device_path="/dev/ot_module_sim_heatershaker0",
    )


@pytest.fixture
async def simulating_module(usb_port, loop):
    module = await modules.build(
        port=usb_port.device_path,
        usb_port=usb_port,
        which="heatershaker",
        simulating=True,
        interrupt_callback=lambda x: None,
        loop=loop,
        execution_manager=ExecutionManager(loop=loop),
    )
    assert isinstance(module, modules.AbstractModule)
    try:
        yield module
    finally:
        await module.cleanup()


async def test_sim_state(simulating_module):
    await simulating_module.wait_next_poll()
    assert simulating_module.temperature == 23
    assert simulating_module.speed == 0
    assert simulating_module.target_temperature is None
    assert simulating_module.target_speed is None
    assert simulating_module.temperature_status == "idle"
    assert simulating_module.speed_status == "idle"
    assert (
        simulating_module.live_data["temperatureStatus"]
        == simulating_module.temperature_status
    )
    assert simulating_module.live_data["speedStatus"] == simulating_module.speed_status
    assert simulating_module.live_data["status"] == simulating_module.status
    assert (
        simulating_module.live_data["data"]["currentTemp"]
        == simulating_module.temperature
    )
    assert (
        simulating_module.live_data["data"]["targetTemp"]
        == simulating_module.target_temperature
    )
    assert (
        simulating_module.live_data["data"]["currentSpeed"] == simulating_module.speed
    )
    assert (
        simulating_module.live_data["data"]["targetSpeed"]
        == simulating_module.target_speed
    )
    assert simulating_module.status == "temperature idle, speed idle"
    status = simulating_module.device_info
    assert status["serial"] == "dummySerialHS"
    # return v1 if sim_model is not passed
    assert status["model"] == "dummyModelHS"
    assert status["version"] == "dummyVersionHS"


async def test_sim_update(simulating_module):
    await simulating_module.set_temperature(10)
    assert simulating_module.temperature == 10
    assert simulating_module.target_temperature == 10
    assert simulating_module.temperature_status == "holding at target"
    assert simulating_module.status == "temperature holding at target, speed idle"
    await simulating_module.set_speed(2000)
    assert simulating_module.speed == 2000
    assert simulating_module.target_speed == 2000
    assert simulating_module.speed_status == "holding at target"
    assert (
        simulating_module.status
        == "temperature holding at target, speed holding at target"
    )
    await simulating_module.deactivate()
    await simulating_module.wait_next_poll()
    assert simulating_module.temperature == 0
    assert simulating_module.speed == 0
    assert simulating_module.target_temperature is None
    assert simulating_module.target_speed is None
    assert simulating_module.temperature_status == "idle"
    assert simulating_module.speed_status == "idle"


async def test_await_both(simulating_module):
    await simulating_module.start_set_temperature(10)
    await simulating_module.start_set_speed(2000)
    await simulating_module.await_speed_and_temperature(10, 2000)
    assert simulating_module.temperature_status == "holding at target"
    assert simulating_module.speed_status == "holding at target"


async def test_plate_lock(simulating_module):
    await simulating_module.open_plate_lock()
    assert (
        await simulating_module._driver.get_plate_lock_status()
        == HeaterShakerPlateLockStatus.IDLE_OPEN
    )
    await simulating_module.close_plate_lock()
    assert (
        await simulating_module._driver.get_plate_lock_status()
        == HeaterShakerPlateLockStatus.IDLE_CLOSED
    )
