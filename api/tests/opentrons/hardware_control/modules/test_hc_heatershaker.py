import pytest
from opentrons.hardware_control import modules, ExecutionManager
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus


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


async def test_labware_latch(simulating_module):
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


async def test_initial_live_data(simulating_module):
    """Should return the simulating module's initial live data."""
    assert simulating_module.live_data == {
        "data": {
            "currentSpeed": 0,
            "currentTemp": 23,
            "targetSpeed": None,
            "targetTemp": None,
        },
        "labwareLatchStatus": HeaterShakerLabwareLatchStatus.IDLE_UNKNOWN,
        "speedStatus": "idle",
        "temperatureStatus": "idle",
    }


async def test_updated_live_data(simulating_module):
    """Should update live data after module commands."""
    await simulating_module.close_labware_latch()
    await simulating_module.start_set_temperature(50)
    await simulating_module.start_set_speed(100)
    await simulating_module.wait_next_poll()
    assert simulating_module.live_data == {
        "data": {
            "currentSpeed": 100,
            "currentTemp": 50,
            "targetSpeed": 100,
            "targetTemp": 50,
        },
        "labwareLatchStatus": HeaterShakerLabwareLatchStatus.IDLE_CLOSED,
        "speedStatus": "holding at target",
        "temperatureStatus": "holding at target",
    }
