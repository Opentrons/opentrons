"""Performance helpers for tracking robot context."""

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


def _handle_package_import() -> Type[SupportsTracking]:
    """Handle the import of the performance_metrics package.

    If the package is not available, return a stubbed tracker.
    """
    try:
        from performance_metrics import RobotContextTracker

        return RobotContextTracker
    except ImportError:
        return StubbedTracker


package_to_use = _handle_package_import()
_robot_context_tracker: SupportsTracking | None = None


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
    """Track the analysis of a protocol."""
    return _get_robot_context_tracker().track(RobotContextState.ANALYZING_PROTOCOL)(
        func
    )
