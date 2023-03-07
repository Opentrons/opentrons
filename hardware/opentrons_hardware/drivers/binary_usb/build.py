"""Factory for building drivers and messengers."""
from .bin_serial import SerialUsbDriver
from .binary_messenger import BinaryMessenger
import asyncio

RP_VID = 0x04D8
RP_PID = 0xEF01


async def build_rear_panel_driver() -> SerialUsbDriver:
    """Create a connection to the rear-panel board over USB."""
    driver: SerialUsbDriver = SerialUsbDriver(asyncio.get_running_loop())
    driver.find_and_connect(RP_VID, RP_PID)
    return driver


def build_rear_panel_messenger(driver: SerialUsbDriver) -> BinaryMessenger:
    """Create a message handler with the rear-panel serial driver."""
    usb_messenger = BinaryMessenger(driver)
    return usb_messenger
