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
    MachineType,
    EEPROMData,
)


__all__ = [
    "PropId",
    "PropType",
    "Property",
    "MachineType",
    "EEPROMData",
    "EEPROM",
    "DEFAULT_BUS",
    "DEFAULT_ADDRESS",
]
