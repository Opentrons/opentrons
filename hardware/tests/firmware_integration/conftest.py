"""Test Echo firmware."""
import pytest
import asyncio
from typing import AsyncGenerator
from opentrons_hardware.drivers.can_bus.settings import DriverSettings
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver


@pytest.fixture
async def driver(
    loop: asyncio.BaseEventLoop,
) -> AsyncGenerator[AbstractCanDriver, None]:
    """Create CanDriver connected to OT-3 Emulator."""
    settings = DriverSettings()
    driver = await build_driver(settings)
    yield driver
    driver.shutdown()
