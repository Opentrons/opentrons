"""The eeprom interface package."""

from .eeprom import EEPROM

from .types import (
    PropType,
    Property,
    MachineType,
    EEPROMSize,
    EEPROMData,
)


__all__ = [
    "PropType",
    "Property",
    "MachineType",
    "EEPROMSize",
    "EEPROMData",
    "EEPROM",
]
