"""Tests for performance_helpers."""

from pathlib import Path
from opentrons_shared_data.performance.dev_types import RobotContextState
from opentrons.util.performance_helpers import (
    StubbedTracker,
    _get_robot_context_tracker,
)


def test_return_function_unchanged() -> None:
    """Test that the function is returned unchanged when using StubbedTracker."""
    tracker = StubbedTracker(Path("/path/to/storage"), True)

    def func_to_track() -> None:
        pass

    assert (
        tracker.track(RobotContextState.ANALYZING_PROTOCOL)(func_to_track)
        is func_to_track
    )


def test_singleton_tracker() -> None:
    """Test that the tracker is a singleton."""
    tracker = _get_robot_context_tracker()
    tracker2 = _get_robot_context_tracker()
    assert tracker is tracker2
