"""The eeprom interface package."""

from .eeprom import (
    DEFAULT_ADDRESS,
    DEFAULT_BUS,
    DEFAULT_READ_SIZE,
    EEPROMDriver,
)
from .types import (
    FORMAT_VERSION,
    EEPROMData,
    Property,
    PropId,
    PropType,
)

__all__ = [
    "PropId",
    "PropType",
    "Property",
    "EEPROMData",
    "EEPROMDriver",
    "DEFAULT_BUS",
    "DEFAULT_ADDRESS",
    "DEFAULT_READ_SIZE",
    "FORMAT_VERSION",
]
