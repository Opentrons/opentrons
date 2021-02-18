import asyncio

import pytest
from mock import AsyncMock
from opentrons.hardware_control.emulation.app import TEMPDECK_PORT
from opentrons.hardware_control.modules import TempDeck


@pytest.fixture
async def tempdeck(loop: asyncio.BaseEventLoop, emulation_app) -> TempDeck:
    td = await TempDeck.build(
        port=f"socket://127.0.0.1:{TEMPDECK_PORT}",
        execution_manager=AsyncMock(),
        loop=loop
    )
    yield td


def test_device_info(tempdeck):
    assert {'model': 'temp_emulator', 'serial': 'fake_serial',
            'version': '1'} == tempdeck.device_info
