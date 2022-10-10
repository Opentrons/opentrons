import asyncio
from mock import AsyncMock

import pytest

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.temp_deck import AbstractTempDeckDriver
from opentrons.hardware_control import modules, ExecutionManager


@pytest.fixture
def usb_port():
    return USBPort(
        name="",
        hub=None,
        port_number=0,
        device_path="/dev/ot_module_sim_tempdeck0",
    )


@pytest.fixture
async def subject(usb_port: USBPort) -> modules.AbstractModule:
    """Test subject"""
    temp = await modules.build(
        port="/dev/ot_module_sim_tempdeck0",
        usb_port=usb_port,
        type=modules.ModuleType.TEMPERATURE,
        simulating=True,
        loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
    )
    yield temp
    await temp.cleanup()


async def test_sim_initialization(subject: modules.AbstractModule):
    assert isinstance(subject, modules.AbstractModule)


async def test_sim_state(subject: modules.AbstractModule):
    await subject.wait_next_poll()
    assert subject.temperature == 0
    assert subject.target is None
    assert subject.status == "idle"
    assert subject.live_data["status"] == subject.status
    assert subject.live_data["data"]["currentTemp"] == subject.temperature
    assert subject.live_data["data"]["targetTemp"] == subject.target
    status = subject.device_info
    assert status["serial"] == "dummySerialTD"
    # return v1 if sim_model is not passed
    assert status["model"] == "temp_deck_v1.1"
    assert status["version"] == "dummyVersionTD"


async def test_sim_update(subject: modules.AbstractModule):
    await subject.start_set_temperature(10)
    await subject.await_temperature(None)
    assert subject.temperature == 10
    assert subject.target == 10
    assert subject.status == "holding at target"
    await subject.deactivate()
    assert subject.temperature == 23
    assert subject.target is None
    assert subject.status == "idle"


async def test_revision_model_parsing(subject: modules.AbstractModule):
    subject._device_info["model"] = "temp_deck_v20"
    assert subject.model() == "temperatureModuleV2"
    subject._device_info["model"] = "temp_deck_v4.0"
    assert subject.model() == "temperatureModuleV1"
    del subject._device_info["model"]
    assert subject.model() == "temperatureModuleV1"
    subject._device_info["model"] = "temp_deck_v1.1"
    assert subject.model() == "temperatureModuleV1"


async def test_poll_error(usb_port: USBPort) -> None:
    mock_driver = AsyncMock(spec=AbstractTempDeckDriver)
    mock_driver.get_temperature.side_effect = ValueError("hello!")

    tempdeck = modules.TempDeck(
        port="",
        usb_port=usb_port,
        execution_manager=AsyncMock(spec=ExecutionManager),
        driver=mock_driver,
        device_info={},
        loop=asyncio.get_running_loop(),
        polling_frequency=1,
    )
    with pytest.raises(ValueError, match="hello!"):
        await tempdeck.wait_next_poll()

    await tempdeck.cleanup()
