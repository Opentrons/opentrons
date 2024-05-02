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
    """Arc or direct movement type.

    - GENERAL_ARC: an arc movement between two unrelated locations
    - IN_LABWARE_ARC: an arc movement between two locations in the same labware
    - DIRECT: a direct movement between two locations
    """

    GENERAL_ARC = auto_enum_value()
    IN_LABWARE_ARC = auto_enum_value()
    DIRECT = auto_enum_value()


@dataclass(frozen=True)
@final
class GripperMovementWaypointsWithJawStatus:
    """Gripper motion waypoint with expected jaw status while moving to the waypoint."""

    position: Point
    jaw_open: bool
    dropping: bool
    """This flag should only be set to True if this waypoint involves dropping a piece of labware."""
