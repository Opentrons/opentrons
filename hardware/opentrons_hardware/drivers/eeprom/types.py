"""Type definitions used for the eeprom interface module."""

from datetime import datetime
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional


class PropId(Enum):
    """The unique property id for a property."""

    FORMAT_VERSION = 1
    SERIAL_NUMBER = 2
    MACHINE_TYPE = 3
    MACHINE_VERSION = 4
    PROGRAMMED_DATE = 5
    UNIT_NUMBER = 6


class PropType(Enum):
    """The types of properties that can be saved/loaded from the eeprom."""

    BYTE = 1
    CHAR = 2
    SHORT = 3
    INT = 4
    STR = 5
    BIN = 6


PROP_ID_TYPES = {
    PropId.FORMAT_VERSION: PropType.BYTE,
    PropId.SERIAL_NUMBER: PropType.STR,
    PropId.MACHINE_TYPE: PropType.BYTE,
    PropId.MACHINE_VERSION: PropType.STR,
    PropId.PROGRAMMED_DATE: PropType.STR,
    PropId.UNIT_NUMBER: PropType.INT,
}

PROP_TYPE_SIZE = {
    PropType.BYTE: 1,
    PropType.CHAR: 1,
    PropType.SHORT: 2,
    PropType.INT: 4,
    PropType.STR: 254,
    PropType.BIN: 254,
}


@dataclass(frozen=True)
class Property:
    """A single piece of data to read/write to eeprom."""

    id: PropId
    type: PropType
    size: int
    value: Any


@dataclass
class EEPROMData:
    """Dataclass that represents the serialized data from the eeprom."""

    format_version: int = 1
    serial_number: Optional[str] = None
    machine_type: Optional[str] = None
    machine_version: Optional[str] = None
    programmed_date: Optional[datetime] = None
    manufacturing_facility: Optional[str] = None
    unit_number: Optional[int] = None
    unique_id: Optional[str] = None
