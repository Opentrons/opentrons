"""Motion planning base interfaces."""
from dataclasses import dataclass
from enum import Enum, auto as auto_enum_value
from typing import Optional
from typing_extensions import final

from opentrons.types import Point
from opentrons.hardware_control.types import CriticalPoint


@dataclass(frozen=True)
@final
class Waypoint:
    """Motion waypoint with position and optional pipette critical point."""

    position: Point
    critical_point: Optional[CriticalPoint] = None


@final
class MoveType(Enum):
    """
    Arc or direct movement type.

    - GENERAL_ARC: an arc movement between two unrelated locations
    - IN_LABWARE_ARC: an arc movement between two locations in the same labware
    - DIRECT: a direct movement between two locations
    """

    GENERAL_ARC = auto_enum_value()
    IN_LABWARE_ARC = auto_enum_value()
    DIRECT = auto_enum_value()
