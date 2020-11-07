"""Movement planning errors."""
from opentrons.types import Point


class MotionPlanningError(Exception):
    """Sub-class for errors from the movement_planning module."""

    def __init__(
        self,
        origin: Point,
        dest: Point,
        clearance: float,
        min_travel_z: float,
        max_travel_z: float,
        message: str
    ) -> None:
        """Initialize an error with properties of the planned motion."""
        super().__init__(message)
        self.origin = origin
        self.dest = dest
        self.clearance = clearance
        self.min_travel_z = min_travel_z
        self.max_travel_z = max_travel_z


class DestinationOutOfBoundsError(MotionPlanningError, ValueError):
    """An error raised when a requested destination is out of bounds."""

    pass


class ArcOutOfBoundsError(MotionPlanningError, ValueError):
    """An error raised when a calculated movement arc is out of bounds."""

    pass
