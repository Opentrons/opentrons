import asyncio
from typing import AsyncIterator, Iterator

import pytest
from mock import AsyncMock
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.emulation.settings import Settings

from opentrons.hardware_control.modules import HeaterShaker


@pytest.fixture
async def heatershaker(
    emulation_app: Iterator[None],
    emulator_settings: Settings,
) -> AsyncIterator[HeaterShaker]:
    module = await HeaterShaker.build(
        port=f"socket://127.0.0.1:{emulator_settings.heatershaker_proxy.driver_port}",
        execution_manager=AsyncMock(),
        usb_port=USBPort(name="", port_number=1, device_path="", hub=1),
        loop=asyncio.get_running_loop(),
        polling_period=0.5,
    )
    yield module
    await module.cleanup()


def test_device_info(heatershaker: HeaterShaker):
    """Confirm device_info returns correct values."""
    assert heatershaker.device_info == {
        "model": "v01",
        "version": "v0.0.1",
        "serial": "heater_shaker_emulator",
    }


async def test_latch_status(heatershaker: HeaterShaker) -> None:
    """It should run open and close latch."""
    await heatershaker.wait_next_poll()
    assert heatershaker.labware_latch_status.value == "idle_open"

    await heatershaker.close_labware_latch()
    assert heatershaker.labware_latch_status.value == "idle_closed"

    await heatershaker.open_labware_latch()
    assert heatershaker.labware_latch_status.value == "idle_open"


async def test_speed(heatershaker: HeaterShaker) -> None:
    """It should speed up, then slow down."""

    await heatershaker.wait_next_poll()
    await heatershaker.set_speed(550)
    assert heatershaker.target_speed == 550

    # The acceptable delta for actual speed is 100
    assert 450 <= heatershaker.speed <= 650


async def test_deactivate_shaker(heatershaker: HeaterShaker) -> None:
    """It should speed up, then slow down."""

    await heatershaker.wait_next_poll()
    await heatershaker.set_speed(150)
    assert heatershaker.target_speed == 150

    await heatershaker.deactivate_shaker()

    # Confirm that target speed is instantly set to None
    assert heatershaker.target_speed is None

    # H/S is set to slow down at 100 rpm/tick
    # If we wait 1 tick it will be at 50rpm
    await heatershaker.wait_next_poll()
    assert heatershaker.target_speed is None
    assert heatershaker.speed == 50

    # If we wait another tick it should go to 50rpm (not -50)
    await heatershaker.wait_next_poll()
    assert heatershaker.target_speed is None
    assert heatershaker.speed == 0


async def test_temp(heatershaker: HeaterShaker) -> None:
    """Test setting temp"""
    await heatershaker.wait_next_poll()
    await heatershaker.start_set_temperature(50.0)

    # Have to wait for next poll because target temp will not update until then
    await heatershaker.wait_next_poll()
    assert heatershaker.target_temperature == 50.0
    assert heatershaker.temperature != 50.0

    await heatershaker.await_temperature(50.0)
    assert heatershaker.target_temperature == 50.0

    # Acceptable delta is 0.7 degrees
    assert 49.3 <= heatershaker.temperature <= 50.7
