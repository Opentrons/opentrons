"""The eeprom interface package."""

from .eeprom import (
    EEPROM,
    DEFAULT_BUS,
    DEFAULT_ADDRESS,
)

from .types import (
    PropId,
    PropType,
    Property,
    EEPROMData,
)


__all__ = [
    "PropId",
    "PropType",
    "Property",
    "EEPROMData",
    "EEPROM",
    "DEFAULT_BUS",
    "DEFAULT_ADDRESS",
]
