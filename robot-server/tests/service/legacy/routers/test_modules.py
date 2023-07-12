from pathlib import Path
from mock import patch, PropertyMock, MagicMock

import pytest
import asyncio
from decoy import matchers
from opentrons.hardware_control import ExecutionManager
from opentrons.hardware_control.modules import (
    ModuleType,
    MagDeck,
    Thermocycler,
    TempDeck,
    HeaterShaker,
)
from opentrons.hardware_control.modules import utils, UpdateError, BundledFirmware
from opentrons.drivers.rpi_drivers.types import USBPort, PortGroup


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


def test_execute_module_command(api_client, hardware, magdeck):
    hardware.attached_modules = [magdeck]

    resp = api_client.post(
        "/modules/dummySerialMD",
        json={"command_type": "deactivate"},
        headers={"Opentrons-Version": "2"},
    )
    body = resp.json()
    assert resp.status_code == 200
    assert "message" in body
    assert body["message"] == "Success"


def test_execute_module_command_no_modules(api_client, hardware):
    hardware.attached_modules = []

    resp = api_client.post(
        "/modules/dummySerialMD",
        json={"command_type": "deactivate"},
        headers={"Opentrons-Version": "2"},
    )
    body = resp.json()
    assert resp.status_code == 404
    assert "message" in body
    assert body["message"] == "No connected modules"


def test_execute_module_command_bad_serial(api_client, hardware, magdeck):
    hardware.attached_modules = [magdeck]

    resp = api_client.post(
        "/modules/tooDummySerialMD",
        json={"command_type": "deactivate"},
        headers={"Opentrons-Version": "2"},
    )
    body = resp.json()
    assert resp.status_code == 404
    assert "message" in body
    assert body["message"] == "Specified module not found"


def test_execute_module_command_bad_command(api_client, hardware, magdeck):
    hardware.attached_modules = [magdeck]

    command_type = "something that doesn't exist"

    resp = api_client.post(
        "/modules/dummySerialMD",
        json={"command_type": command_type},
        headers={"Opentrons-Version": "2"},
    )
    body = resp.json()
    assert resp.status_code == 400
    assert "message" in body
    assert body["message"] == f"Module does not have command: {command_type}"


def test_execute_module_command_bad_args(api_client, hardware, thermocycler):
    hardware.attached_modules = [thermocycler]

    thermocycler.set_temperature = MagicMock(side_effect=TypeError("found a 'str'"))

    resp = api_client.post(
        "modules/dummySerialTC",
        json={"command_type": "set_temperature", "args": ["30"]},
        headers={"Opentrons-Version": "2"},
    )
    body = resp.json()
    assert resp.status_code == 400
    assert "message" in body
    assert "TypeError" in body["message"]


def test_execute_module_command_valid_args(api_client, hardware, thermocycler):
    hardware.attached_modules = [thermocycler]

    thermocycler.set_temperature = MagicMock(return_value=None)

    resp = api_client.post(
        "modules/dummySerialTC",
        json={"command_type": "set_temperature", "args": [30]},
        headers={"Opentrons-Version": "2"},
    )
    assert resp.status_code == 200


def test_post_serial_update_no_bundled_fw(api_client, hardware, magdeck):
    magdeck._bundled_fw = None

    hardware.attached_modules = [magdeck]
    resp = api_client.post("/modules/dummySerialMD/update")

    body = resp.json()
    assert resp.status_code == 500
    assert body == {
        "message": "Bundled fw file not found for module of type: magdeck",
        "errorCode": "1005",
    }


def test_post_serial_update_no_modules(api_client, hardware):
    resp = api_client.post("/modules/dummySerialMD/update")

    body = resp.json()
    assert resp.status_code == 404
    assert body == {"message": "Module dummySerialMD not found", "errorCode": "3015"}


def test_post_serial_update_no_match(api_client, hardware, tempdeck):
    hardware.attached_modules = [tempdeck]

    resp = api_client.post("/modules/superDummySerialMD/update")

    body = resp.json()
    assert resp.status_code == 404
    assert body == {
        "message": "Module superDummySerialMD not found",
        "errorCode": "3015",
    }


def test_post_serial_update_error(api_client, hardware, magdeck):
    async def thrower(*args, **kwargs):
        raise UpdateError("not possible")

    magdeck._bundled_fw = BundledFirmware("1234", Path("c:/aaa"))

    hardware.attached_modules = [magdeck]

    with patch("opentrons.hardware_control.modules.update_firmware") as p:
        p.side_effect = thrower
        resp = api_client.post("/modules/dummySerialMD/update")

        body = resp.json()
        assert resp.status_code == 500
        assert body == {"message": "Update error: not possible", "errorCode": "1005"}


def test_post_serial_timeout_error(api_client, hardware, magdeck):
    async def thrower(*args, **kwargs):
        raise asyncio.TimeoutError()

    magdeck._bundled_fw = BundledFirmware("1234", Path("c:/aaa"))

    hardware.attached_modules = [magdeck]

    with patch("opentrons.hardware_control.modules.update_firmware") as p:
        p.side_effect = thrower
        resp = api_client.post("/modules/dummySerialMD/update")

        body = resp.json()
        assert resp.status_code == 500
        assert body == {"message": "Module not responding", "errorCode": "1005"}


def test_post_serial_update(api_client, hardware, tempdeck):
    hardware.attached_modules = [tempdeck]

    tempdeck._bundled_fw = BundledFirmware("1234", Path("c:/aaa"))

    with patch("opentrons.hardware_control.modules.update_firmware") as p:
        resp = api_client.post("/modules/dummySerialTD/update")

        p.assert_called_once_with(
            tempdeck,
            tempdeck._bundled_fw.path,
            matchers.IsA(asyncio.AbstractEventLoop),
        )

        body = resp.json()
        assert resp.status_code == 200
        assert body == {"message": "Successfully updated module dummySerialTD"}
