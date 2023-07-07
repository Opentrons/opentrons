"""Factory for building the eeprom driver."""

from typing import Optional, Iterator
from pathlib import Path
from contextlib import contextmanager

from ..gpio import OT3GPIO
from .eeprom import (
    EEPROMDriver,
)


DEFAULT_EEPROM_PATH = Path("/sys/bus/i2c/devices/3-0050/eeprom")


def build_eeprom_driver(
    gpio: Optional[OT3GPIO] = None, eeprom_path: Optional[Path] = None
) -> EEPROMDriver:
    """Create an instance of the eeprom driver"""
    gpio = gpio or OT3GPIO("eeprom_hardware_controller")
    eeprom_path = eeprom_path or DEFAULT_EEPROM_PATH
    eeprom_driver = EEPROMDriver(gpio, eeprom_path=eeprom_path)
    eeprom_driver.setup()
    return eeprom_driver


@contextmanager
def eeprom_driver() -> Iterator[EEPROMDriver]:
    """Context manager creating an eeprom driver."""
    d = build_eeprom_driver()
    try:
        yield d
    finally:
        d.__exit__()
