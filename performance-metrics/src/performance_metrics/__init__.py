"""Opentrons performance metrics library."""

from pathlib import Path
from .robot_context_tracker import RobotContextTracker

_robot_context_tracker: RobotContextTracker | None = None


def get_robot_context_tracker_singleton(
    storage_dir: Path, should_track: bool
) -> RobotContextTracker:
    """Get the singleton instance of the robot context tracker."""
    global _robot_context_tracker

    if _robot_context_tracker is None:
        _robot_context_tracker = RobotContextTracker(
            storage_dir=storage_dir, should_track=should_track
        )
    return _robot_context_tracker


__all__ = ["get_robot_context_tracker_singleton", "RobotContextTracker"]
