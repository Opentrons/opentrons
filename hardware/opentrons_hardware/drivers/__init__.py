"""Drivers package."""

from typing import Optional, Union

from .can_bus import CanMessenger
from .binary_usb import BinaryMessenger
from .gpio import OT3GPIO, RemoteOT3GPIO
from .eeprom import EEPROMDriver


class SystemDrivers:
    """Holder class for hardware drivers."""

    def __init__(
        self,
        can_messenger: CanMessenger,
        gpio_dev: Union[OT3GPIO, RemoteOT3GPIO],
        eeprom: EEPROMDriver,
        usb_messenger: Optional[BinaryMessenger] = None,
    ) -> None:
        """Constructor"""
        self.can_messenger: CanMessenger = can_messenger
        self.usb_messenger: Optional[BinaryMessenger] = usb_messenger
        self.gpio_dev: Union[OT3GPIO, RemoteOT3GPIO] = gpio_dev
        self.eeprom: EEPROMDriver = eeprom


__all__ = [
    "SystemDrivers",
    "CanMessenger",
    "BinaryMessenger",
    "EEPROMDriver",
    "OT3GPIO",
    "RemoteOT3GPIO",
]
