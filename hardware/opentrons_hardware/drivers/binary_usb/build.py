from .bin_serial import SerialUsbDriver
import asyncio

RP_VID = 0x04D8
RP_PID = 0xEF01


def build_rear_panel_messenger(loop: asyncio.AbstractEventLoop) -> SerialUsbDriver:
    """Create a connection to the rear-panel board over usb."""
    driver: SerialUsbDriver = SerialUsbDriver(loop)
    driver.find_and_connect(RP_VID, RP_PID)
    return driver
