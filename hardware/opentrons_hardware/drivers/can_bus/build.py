"""Factory for building drivers and messengers."""
from contextlib import asynccontextmanager
from typing import AsyncIterator

from . import settings, CanMessenger
from .abstract_driver import AbstractCanDriver
from .socket_driver import SocketDriver
from .driver import CanDriver


async def build_driver(driver_settings: settings.DriverSettings) -> AbstractCanDriver:
    """Create a driver.

    Args:
        driver_settings: Settings object to use.

    Returns:
        A driver.
    """
    if driver_settings.interface == settings.OPENTRONS_INTERFACE:
        return await SocketDriver.build(
            port=driver_settings.port, host=driver_settings.host
        )
    else:
        return await CanDriver.build(
            interface=driver_settings.interface,
            bitrate=driver_settings.bit_rate,
            channel=driver_settings.channel,
            fcan_clock=driver_settings.fcan_clock,
            sample_rate=driver_settings.sample_rate,
        )


@asynccontextmanager
async def driver(
    driver_settings: settings.DriverSettings,
) -> AsyncIterator[AbstractCanDriver]:
    """Context manager creating a can driver."""
    d = await build_driver(driver_settings)
    try:
        yield d
    finally:
        d.shutdown()


@asynccontextmanager
async def can_messenger(
    driver_settings: settings.DriverSettings,
) -> AsyncIterator[CanMessenger]:
    """Context manager creating a can driver and messenger."""
    async with driver(driver_settings) as d:
        async with CanMessenger(d) as m:
            yield m
