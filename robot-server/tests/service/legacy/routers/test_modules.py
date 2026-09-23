import asyncio

import pytest
from mock import PropertyMock

from opentrons.drivers.rpi_drivers.types import PortGroup, USBPort
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.modules import (
    HeaterShaker,
    MagDeck,
    ModuleType,
    TempDeck,
    Thermocycler,
    UpdateError,
    utils,
)
from opentrons_shared_data.errors.exceptions import (
    MissingConfigurationData,
    ModuleNotPresent,
)


@pytest.fixture
async def magdeck():
    usb_port = USBPort(
        name="",
        hub=False,
        port_number=0,
        port_group=PortGroup.UNKNOWN,
        hub_port=None,
        device_path="/dev/ot_module_magdeck1",
    )
    m = await utils.build(
        port="/dev/ot_module_magdeck1",
        usb_port=usb_port,
        type=ModuleType.MAGNETIC,
        simulating=True,
        execution_manager=ExecutionManager(),
        hw_control_loop=asyncio.get_running_loop(),
        error_callback=lambda *args: None,
        disconnected_callback=lambda *args: None,
    )
    MagDeck.current_height = PropertyMock(return_value=321)

    yield m

    await m.cleanup()


@pytest.fixture
async def tempdeck():
    usb_port = USBPort(
        name="",
        hub=False,
        port_number=1,
        port_group=PortGroup.UNKNOWN,
        hub_port=None,
        device_path="/dev/ot_module_tempdeck1",
    )
    t = await utils.build(
        port="/dev/ot_module_tempdeck1",
        usb_port=usb_port,
        type=ModuleType.TEMPERATURE,
        simulating=True,
        execution_manager=ExecutionManager(),
        error_callback=lambda *args: None,
        disconnected_callback=lambda *args: None,
        hw_control_loop=asyncio.get_running_loop(),
    )
    TempDeck.temperature = PropertyMock(return_value=123.0)
    TempDeck.target = PropertyMock(return_value=321.0)

    yield t

    await t.cleanup()


@pytest.fixture
async def thermocycler():
    usb_port = USBPort(
        name="",
        hub=False,
        port_number=2,
        port_group=PortGroup.UNKNOWN,
        hub_port=None,
        device_path="/dev/ot_module_thermocycler1",
    )
    t = await utils.build(
        port="/dev/ot_module_thermocycler1",
        usb_port=usb_port,
        type=ModuleType.THERMOCYCLER,
        simulating=True,
        execution_manager=ExecutionManager(),
        hw_control_loop=asyncio.get_running_loop(),
        error_callback=lambda *args: None,
        disconnected_callback=lambda *args: None,
    )

    Thermocycler.lid_status = PropertyMock(return_value="open")
    Thermocycler.lid_target = PropertyMock(return_value=1.2)
    Thermocycler.lid_temp = PropertyMock(return_value=22.0)
    Thermocycler.temperature = PropertyMock(return_value=100.0)
    Thermocycler.target = PropertyMock(return_value=200.0)
    Thermocycler.hold_time = PropertyMock(return_value=1)
    Thermocycler.ramp_rate = PropertyMock(return_value=3)
    Thermocycler.current_cycle_index = PropertyMock(return_value=1)
    Thermocycler.total_cycle_count = PropertyMock(return_value=3)
    Thermocycler.current_step_index = PropertyMock(return_value=5)
    Thermocycler.total_step_count = PropertyMock(return_value=2)
    yield t

    await t.cleanup()


@pytest.fixture
async def heater_shaker():
    """Get a mocked out heater-shaker hardware control object."""
    usb_port = USBPort(
        name="",
        hub=False,
        port_number=3,
        port_group=PortGroup.UNKNOWN,
        hub_port=None,
        device_path="/dev/ot_module_heatershaker1",
    )
    heatershaker = await utils.build(
        port="/dev/ot_module_heatershaker1",
        usb_port=usb_port,
        type=ModuleType.HEATER_SHAKER,
        simulating=True,
        execution_manager=ExecutionManager(),
        hw_control_loop=asyncio.get_running_loop(),
        error_callback=lambda *args: None,
        disconnected_callback=lambda *args: None,
    )

    HeaterShaker.live_data = PropertyMock(
        return_value={
            "status": "running",
            "data": {
                "temperatureStatus": "heating",
                "speedStatus": "holding at target",
                "labwareLatchStatus": "closed",
                "currentTemp": 25.5,
                "targetTemp": 500,
                "currentSpeed": 10,
                "targetSpeed": 4321,
                "errorDetails": "uh oh",
            },
        }
    )
    yield heatershaker
    await heatershaker.cleanup()


def test_execute_module_command_410s(api_client):
    resp = api_client.post(
        "modules/dummySerialTC",
        json={"command_type": "set_temperature", "args": [30]},
        headers={"Opentrons-Version": "2"},
    )
    assert resp.status_code == 410


def test_post_serial_update_no_bundled_fw(api_client, hardware, magdeck):
    magdeck._bundled_fw = None
    hardware.update_module.side_effect = MissingConfigurationData(
        message="No stored firmware for magdeck dummySerialMD"
    )

    resp = api_client.post("/modules/dummySerialMD/update")

    body = resp.json()
    assert resp.status_code == 500
    assert body == {
        "message": "Update error: Error 4009 MISSING_CONFIGURATION_DATA (MissingConfigurationData): No stored firmware for magdeck dummySerialMD",
        "errorCode": "4009",
    }


def test_post_serial_update_no_modules(api_client, hardware):
    hardware.update_module.side_effect = ModuleNotPresent(
        "dummySerialMD", message="Module with serial dummySerialMD not found"
    )
    resp = api_client.post("/modules/dummySerialMD/update")
    body = resp.json()
    assert resp.status_code == 404
    assert body == {
        "message": "Module with serial dummySerialMD not found",
        "errorCode": "3015",
    }


def test_post_serial_update_no_match(api_client, hardware, tempdeck):
    hardware.update_module.side_effect = ModuleNotPresent(
        "dummySerialMD", message="Module with serial dummySerialMD not found"
    )

    resp = api_client.post("/modules/superDummySerialMD/update")

    body = resp.json()
    assert resp.status_code == 404
    assert body == {
        "message": "Module with serial superDummySerialMD not found",
        "errorCode": "3015",
    }


def test_post_serial_update_error(api_client, hardware, magdeck):
    hardware.update_module.side_effect = UpdateError("not possible")
    resp = api_client.post("/modules/dummySerialMD/update")
    body = resp.json()
    assert resp.status_code == 500
    assert body == {
        "message": "Update error: Error 1005 FIRMWARE_UPDATE_FAILED (UpdateError): not possible",
        "errorCode": "1005",
    }


def test_post_serial_timeout_error(api_client, hardware):
    hardware.update_module.side_effect = asyncio.TimeoutError()

    resp = api_client.post("/modules/dummySerialMD/update")
    body = resp.json()
    assert resp.status_code == 500
    assert body == {"message": "Module not responding", "errorCode": "1005"}


def test_post_serial_update(api_client, hardware, tempdeck):
    async def _runner(*args, **kwargs):
        return

    hardware.update_module.side_effect = _runner
    resp = api_client.post("/modules/dummySerialTD/update")
    hardware.update_module.assert_called_once_with("dummySerialTD")
    body = resp.json()
    assert resp.status_code == 200
    assert body == {"message": "Successfully updated module dummySerialTD"}
