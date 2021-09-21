import time
import pytest
import asyncio
from typing import AsyncGenerator
from opentrons_hardware.drivers.can_bus import CanDriver, ArbitrationId, CanMessage


@pytest.fixture
async def driver(
        loop: asyncio.BaseEventLoop
) -> AsyncGenerator[CanDriver, None]:
    driver = await CanDriver.connect_to_emulator()
    yield driver
    driver.shutdown()


@pytest.mark.requires_emulator
async def test_send(driver: CanDriver):
    """
    Verify sending a message to the emulator
    """
    message = CanMessage(
        arbitration_id=ArbitrationId(id=0x1FFFFFFF), data=bytearray([1, 2, 3, 4])
    )
    await driver.send(message)