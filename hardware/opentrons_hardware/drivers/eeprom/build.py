"""Factory for building the eeprom driver."""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator, Optional

from ..gpio import RemoteOT3GPIO
from .eeprom import (
    EEPROMDriver,
)
from opentrons_hardware.drivers.binary_usb import (
    SerialUsbDriver,
    build_rear_panel_driver,
    build_rear_panel_messenger,
)

DEFAULT_EEPROM_PATH = Path("/sys/bus/i2c/devices/3-0050/eeprom")


async def build_eeprom_driver(
    gpio: Optional[RemoteOT3GPIO] = None, eeprom_path: Optional[Path] = None
) -> EEPROMDriver:
    """Create an instance of the eeprom driver"""
    usb_driver: SerialUsbDriver = await build_rear_panel_driver()
    usb_messenger = build_rear_panel_messenger(usb_driver)
    usb_messenger.start()
    gpio = gpio or RemoteOT3GPIO(usb_messenger, "eeprom_hardware_controller")
    eeprom_path = eeprom_path or DEFAULT_EEPROM_PATH
    eeprom_driver = EEPROMDriver(gpio, eeprom_path=eeprom_path)
    eeprom_driver.setup()
    return eeprom_driver


@asynccontextmanager
async def eeprom_driver() -> AsyncIterator[EEPROMDriver]:
    """Context manager creating an eeprom driver."""
    d = await build_eeprom_driver()
    try:
        yield d
    finally:
        d.__exit__()
