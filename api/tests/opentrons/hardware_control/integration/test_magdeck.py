import asyncio

import pytest
from mock import AsyncMock
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.emulation.app import MAGDECK_PORT
from opentrons.hardware_control.modules import MagDeck


@pytest.fixture
async def magdeck(loop: asyncio.BaseEventLoop, emulation_app) -> MagDeck:
    td = await MagDeck.build(
        port=f"socket://127.0.0.1:{MAGDECK_PORT}",
        execution_manager=AsyncMock(),
        usb_port=USBPort(name="", port_number=1, sub_names=[], device_path="", hub=1),
        loop=loop
    )
    yield td


def test_device_info(magdeck):
    assert {'model': 'magdeck_emulator', 'serial': 'fake_serial',
            'version': '1'} == magdeck.device_info
