import asyncio

from opentrons.hardware_control.modules.magdeck import MagDeck
import pytest

from opentrons.hardware_control import modules, ExecutionManager
from opentrons.drivers.rpi_drivers.types import USBPort


@pytest.fixture
def usb_port() -> USBPort:
    return USBPort(
        name="",
        port_number=0,
        device_path="/dev/ot_module_sim_magdeck0",
    )


async def test_sim_initialization(usb_port: USBPort) -> None:
    mag = await modules.build(
        port="/dev/ot_module_sim_magdeck0",
        usb_port=usb_port,
        type=modules.ModuleType["MAGNETIC"],
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
    )
    assert isinstance(mag, modules.AbstractModule)


async def test_sim_data(usb_port: USBPort) -> None:
    mag = await modules.build(
        port="/dev/ot_module_sim_magdeck0",
        usb_port=usb_port,
        type=modules.ModuleType["MAGNETIC"],
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
    )
    assert mag.status == "disengaged"
    assert mag.device_info["serial"] == "dummySerialMD"
    # return v1 when sim_model is not passed
    assert mag.device_info["model"] == "mag_deck_v1.1"
    assert mag.device_info["version"] == "dummyVersionMD"
    assert mag.live_data["status"] == mag.status
    assert "data" in mag.live_data


async def test_sim_state_update(usb_port: USBPort) -> None:
    mag = await modules.build(
        port="/dev/ot_module_sim_magdeck0",
        usb_port=usb_port,
        type=modules.ModuleType["MAGNETIC"],
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
    )
    assert isinstance(mag, MagDeck)
    await mag.calibrate()
    assert mag.status == "disengaged"
    await mag.engage(2)
    assert mag.status == "engaged"
    await mag.deactivate()
    assert mag.status == "disengaged"


async def test_revision_model_parsing(usb_port: USBPort) -> None:
    mag = await modules.build(
        port="",
        type=modules.ModuleType["MAGNETIC"],
        simulating=True,
        usb_port=usb_port,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
    )
    assert isinstance(mag, MagDeck)
    mag._device_info["model"] = "mag_deck_v1.1"
    assert mag.model() == "magneticModuleV1"
    mag._device_info["model"] = "mag_deck_v20"
    assert mag.model() == "magneticModuleV2"
    del mag._device_info["model"]
    assert mag.model() == "magneticModuleV1"
