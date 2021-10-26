""" Type definitions for modules in this tree """
from dataclasses import dataclass
from typing import Dict, NamedTuple, Optional
from enum import Enum


class MoveSplit(NamedTuple):
    split_distance: float
    split_current: float
    split_speed: float
    after_time: float
    fullstep: bool


MoveSplits = Dict[str, MoveSplit]
#: Dict mapping axes to their split parameters


@dataclass
class Temperature:
    """Tempdeck, thermocycler plate, and heater-shaker temperatures"""

    current: float
    target: Optional[float]


@dataclass
class RPM:
    """Heater-shaker plate RPM"""

    current: int
    target: Optional[int]


class HeaterShakerPlateLockStatus(str, Enum):
    """Heater-shaker plate lock status"""

    OPENING = "OPENING"
    IDLE_OPEN = "IDLE_OPEN"
    CLOSING = "CLOSING"
    IDLE_CLOSED = "IDLE_CLOSED"
    IDLE_UNKNOWN = "IDLE_UNKNOWN"
    UNKNOWN = "UNKNOWN"


@dataclass
class PlateTemperature(Temperature):
    """Thermocycler lid temperature"""

    hold: Optional[float]


class ThermocyclerLidStatus(str, Enum):
    """Thermocycler lid status."""

    UNKNOWN = "unknown"
    CLOSED = "closed"
    IN_BETWEEN = "in_between"
    OPEN = "open"
    MAX = "max"
