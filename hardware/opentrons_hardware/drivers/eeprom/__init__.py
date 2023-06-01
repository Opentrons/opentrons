"""The eeprom interface package."""

from .eeprom import EEPROM

from .types import (
    PropId,
    PropType,
    Property,
    MachineType,
    EEPROMSize,
    EEPROMData,
)


__all__ = [
    "PropId",
    "PropType",
    "Property",
    "MachineType",
    "EEPROMSize",
    "EEPROMData",
    "EEPROM",
]
