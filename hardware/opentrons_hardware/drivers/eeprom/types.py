"""Type definitions used for the eeprom interface module."""

from datetime import datetime
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Type, Dict, Any



class PropId(Enum):
    """The unique property id for a property."""

    FORMAT_VERSION = 1
    MACHINE_TYPE = 2
    MACHINE_VERSION = 3
    PROGRAMMED_DATE = 4
    UNIT_NUMBER = 5


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
    PropType.STR: -1,
    PropType.BIN: -1,
}


@dataclass(frozen=True)
class Property:
    """A single piece of data to read/write to eeprom."""

    id: PropId
    type: PropType
    size: int
    value: Any


class MachineType(Enum):
    """Type of machine we are running on."""

    FLEX = "flex"


class EEPROMSize(Enum):
    """The size in kbyes the eeprom running on this device has."""

    FLEXA1 = 16


@dataclass(frozen=True)
class EEPROMData:
    """Dataclass that represents the serialized data from the eeprom."""

    som_manufacturer_id: str
    opentrons_serial_id: str
    programmed_date: datetime
    device_type: MachineType

    def to_dict(self) -> Dict[str, Any]:
        """Turn the properties into a dictionary."""
        return dict()
