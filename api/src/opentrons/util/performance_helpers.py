"""Performance helpers for tracking robot context."""

import functools
from pathlib import Path
from opentrons_shared_data.performance.dev_types import (
    SupportsTracking,
    F,
    RobotContextState,
)
from opentrons_shared_data.robot.dev_types import RobotTypeEnum
from typing import Callable, Type
from opentrons.config import (
    feature_flags as ff,
    get_performance_metrics_data_dir,
    robot_configs,
)


_should_track = ff.enable_performance_metrics(
    RobotTypeEnum.robot_literal_to_enum(robot_configs.load().model)
)
STORE_EACH = _should_track


def _handle_package_import() -> Type[SupportsTracking]:
    """Handle the import of the performance_metrics package.

    If the package is not available, return a stubbed tracker.
    """
    try:
        from performance_metrics import RobotContextTracker

        return RobotContextTracker
    except ImportError:
        return StubbedTracker


package_to_use: Type[SupportsTracking] = _handle_package_import()
_robot_context_tracker: SupportsTracking | None = None


class StubbedTracker(SupportsTracking):
    """A stubbed tracker that does nothing."""

    def __init__(self, storage_location: Path, should_track: bool) -> None:
        """Initialize the stubbed tracker."""
        pass

    def track(self, state: RobotContextState) -> Callable[[F], F]:
        """Return the function unchanged."""

        def inner_decorator(func: F) -> F:
            """Return the function unchanged."""
            return func

        return inner_decorator

    def store(self) -> None:
        """Do nothing."""
        pass


def _get_robot_context_tracker() -> SupportsTracking:
    """Singleton for the robot context tracker."""
    global _robot_context_tracker
    if _robot_context_tracker is None:
        # TODO: replace with path lookup and should_store lookup
        _robot_context_tracker = package_to_use(
            get_performance_metrics_data_dir(), _should_track
        )
    return _robot_context_tracker


def track_analysis(func: F) -> F:
    """Track the analysis of a protocol and optionally store each run."""
    # This will probably not stick around very long but it gives me
    # the ability to test this on a robot

    # Typing a decorator that wraps a decorator with args, nope
    @functools.wraps(func)
    def wrapper(*args, **kwargs):  # type: ignore # noqa: ANN002, ANN003, ANN201
        tracker = _get_robot_context_tracker()
        tracked_func = tracker.track(RobotContextState.ANALYZING_PROTOCOL)(func)

        result = tracked_func(*args, **kwargs)

        if STORE_EACH:
            tracker.store()

        return result

    return wrapper  # type: ignore
