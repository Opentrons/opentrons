"""Tests for performance_helpers."""

from pathlib import Path

from opentrons.util.performance_helpers import (
    _get_robot_activity_tracker,
    _StubbedTracker,
)


def test_return_function_unchanged() -> None:
    """Test that the function is returned unchanged when using _StubbedTracker."""
    tracker = _StubbedTracker(Path("/path/to/storage"), True)

    def func_to_track() -> None:
        pass

    assert tracker.track("ANALYZING_PROTOCOL")(func_to_track) is func_to_track


def test_singleton_tracker() -> None:
    """Test that the tracker is a singleton."""
    tracker = _get_robot_activity_tracker()
    tracker2 = _get_robot_activity_tracker()
    assert tracker is tracker2
