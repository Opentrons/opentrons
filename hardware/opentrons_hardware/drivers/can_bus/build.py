"""Factory for building a driver."""

from . import settings
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
        )
