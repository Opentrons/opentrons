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
    """Tempdeck temperature and thermocycler plate temperature."""

    current: float
    target: Optional[float]


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
