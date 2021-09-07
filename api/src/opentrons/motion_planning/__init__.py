"""Motion planning module."""

from .waypoints import (
    DEFAULT_GENERAL_ARC_Z_MARGIN,
    DEFAULT_IN_LABWARE_ARC_Z_MARGIN,
    MINIMUM_Z_MARGIN,
    get_waypoints,
)

from .types import Waypoint, MoveType

from .errors import (
    MotionPlanningError,
    DestinationOutOfBoundsError,
    ArcOutOfBoundsError,
)

__all__ = [
    "DEFAULT_GENERAL_ARC_Z_MARGIN",
    "DEFAULT_IN_LABWARE_ARC_Z_MARGIN",
    "MINIMUM_Z_MARGIN",
    "Waypoint",
    "MoveType",
    "MotionPlanningError",
    "DestinationOutOfBoundsError",
    "ArcOutOfBoundsError",
    "get_waypoints",
]
