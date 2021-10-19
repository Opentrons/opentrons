import asyncio
from typing import Iterator

import pytest
from mock import AsyncMock
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.hardware_control.modules import MagDeck


@pytest.fixture
async def magdeck(loop: asyncio.BaseEventLoop, emulation_app: Iterator[None], emulator_settings: Settings) -> MagDeck:
    module = await MagDeck.build(
        port=f"socket://127.0.0.1:{emulator_settings.magdeck_proxy.driver_port}",
        execution_manager=AsyncMock(),
        usb_port=USBPort(name="", port_number=1, sub_names=[], device_path="", hub=1),
        loop=loop,
    )
    yield module
    await module.cleanup()


def test_device_info(magdeck: MagDeck):
    assert magdeck.device_info == {
        "model": "mag_deck_v20",
        "serial": "magnetic_emulator",
        "version": "2.0.0",
    }


async def test_engage_cycle(magdeck: MagDeck):
    """It should cycle engage and disengage"""
    await magdeck.engage(1)
    assert magdeck.current_height == 1
    assert magdeck.live_data == {
        "data": {"engaged": True, "height": 1.0},
        "status": "engaged",
    }

    await magdeck.deactivate()
    assert magdeck.current_height == 0
    assert magdeck.live_data == {
        "data": {"engaged": False, "height": 0.0},
        "status": "disengaged",
    }
