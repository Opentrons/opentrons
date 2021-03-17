import asyncio

import pytest
from mock import AsyncMock
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.emulation.app import TEMPDECK_PORT
from opentrons.hardware_control.modules import TempDeck


@pytest.fixture
async def tempdeck(loop: asyncio.BaseEventLoop, emulation_app) -> TempDeck:
    td = await TempDeck.build(
        port=f"socket://127.0.0.1:{TEMPDECK_PORT}",
        execution_manager=AsyncMock(),
        usb_port=USBPort(name="", port_number=1, sub_names=[], device_path="",
                         hub=1),
        loop=loop
    )
    yield td


def test_device_info(tempdeck):
    assert {'model': 'temp_emulator', 'serial': 'fake_serial',
            'version': '1'} == tempdeck.device_info
