"""The eeprom interface package."""

from .eeprom import (
    EEPROMDriver,
    DEFAULT_BUS,
    DEFAULT_ADDRESS,
    DEFAULT_READ_SIZE,
)

from .types import (
    PropId,
    PropType,
    Property,
    EEPROMData,
    FORMAT_VERSION,
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
