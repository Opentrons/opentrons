"""Type definitions used for the eeprom interface module."""

from datetime import datetime
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional


# The version of the properties format
FORMAT_VERSION = 1


# NOTE: a serialized property can be up-to 255 (0xff) bytes long,
# this includes the property id (1b) + data length (1b) + data (1-253b)
MAX_DATA_LEN = 253


class PropId(Enum):
    """The unique property id for a property."""

    INVALID = 0xFF
    FORMAT_VERSION = 1
    SERIAL_NUMBER = 2


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
}

PROP_TYPE_SIZE = {
    PropType.BYTE: 1,
    PropType.CHAR: 1,
    PropType.SHORT: 2,
    PropType.INT: 4,
    PropType.STR: MAX_DATA_LEN,
    PropType.BIN: MAX_DATA_LEN,
}


@dataclass(frozen=True)
class Property:
    """A single piece of data to read/write to eeprom."""

    id: PropId
    type: PropType
    max_size: int
    value: Any


@dataclass
class EEPROMData:
    """Dataclass that represents the serialized data from the eeprom."""

    format_version: int = FORMAT_VERSION
    serial_number: Optional[str] = None
    machine_type: Optional[str] = None
    machine_version: Optional[str] = None
    programmed_date: Optional[datetime] = None
    unit_number: Optional[int] = None
