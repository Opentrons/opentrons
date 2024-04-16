"""Performance helpers for tracking robot context."""

from pathlib import Path
from opentrons_shared_data.performance.dev_types import (
    SupportsTracking,
    F,
    RobotContextState,
)
from typing import Callable, Type


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


class StubbedTracker(SupportsTracking):
    """A stubbed tracker that does nothing."""

    def __init__(self, storage_dir: Path, should_track: bool) -> None:
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
        _robot_context_tracker = package_to_use(Path("A path"), True)
    return _robot_context_tracker
