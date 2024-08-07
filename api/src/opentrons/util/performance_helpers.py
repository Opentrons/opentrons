"""Performance helpers for tracking robot activity."""

import functools
from pathlib import Path

from opentrons_shared_data.robot.types import RobotTypeEnum
import typing
from opentrons.config import (
    get_performance_metrics_data_dir,
    robot_configs,
    feature_flags as ff,
)

if typing.TYPE_CHECKING:
    from performance_metrics import RobotActivityState, SupportsTracking


_UnderlyingFunctionParameters = typing.ParamSpec("_UnderlyingFunctionParameters")
_UnderlyingFunctionReturn = typing.TypeVar("_UnderlyingFunctionReturn")
_UnderlyingFunction = typing.Callable[
    _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
]


_should_track = ff.enable_performance_metrics(
    RobotTypeEnum.robot_literal_to_enum(robot_configs.load().model)
)


class _StubbedTracker:
    """A stubbed tracker that does nothing."""

    def __init__(self, storage_location: Path, should_track: bool) -> None:
        """Initialize the stubbed tracker."""
        pass

    def track(
        self,
        state: "RobotActivityState",
    ) -> typing.Callable[
        [_UnderlyingFunction[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn]],
        _UnderlyingFunction[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn],
    ]:
        """Return the original function."""

        def inner_decorator(
            func: _UnderlyingFunction[
                _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
            ]
        ) -> _UnderlyingFunction[
            _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
        ]:
            """Return the original function."""
            return func

        return inner_decorator

    def store(self) -> None:
        """Do nothing."""
        pass


# Ensure that _StubbedTracker implements SupportsTracking
# but do not create a runtime dependency on performance_metrics
if typing.TYPE_CHECKING:
    _: typing.Type["SupportsTracking"] = _StubbedTracker


def _handle_package_import() -> typing.Type["SupportsTracking"]:
    """Handle the import of the performance_metrics package.

    If the package is not available, return a stubbed tracker.
    """
    try:
        from performance_metrics import RobotActivityTracker

        return RobotActivityTracker
    except ImportError:
        return _StubbedTracker


_package_to_use = _handle_package_import()
_robot_activity_tracker: typing.Optional["SupportsTracking"] = None

# TODO: derek maggio (06-03-2024): investigate if _should_track should be
# reevaluated each time _get_robot_activity_tracker is called. I think this
# might get stuck in a state where after the first call, _should_track is
# always considered the initial value. It might miss changes to the feature
# flag. The easiest way to test this is on a robot when that is working.


def _get_robot_activity_tracker() -> "SupportsTracking":
    """Singleton for the robot activity tracker."""
    global _robot_activity_tracker
    if _robot_activity_tracker is None:
        _robot_activity_tracker = _package_to_use(
            get_performance_metrics_data_dir(), _should_track
        )
    return _robot_activity_tracker


def _track_a_function(
    state_name: "RobotActivityState",
    func: _UnderlyingFunction[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn],
) -> typing.Callable[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn]:
    """Wrap a passed function with RobotActivityTracker.track.

    This function is a decorator that will track the given state for the
    decorated function.

    Args:
        state_name: The state to annotate the tracked function with.
        func: The function to decorate.

    Returns:
        The decorated function.
    """
    tracker: SupportsTracking = _get_robot_activity_tracker()
    wrapped = tracker.track(state=state_name)(func)

    @functools.wraps(func)
    def wrapper(
        *args: _UnderlyingFunctionParameters.args,
        **kwargs: _UnderlyingFunctionParameters.kwargs
    ) -> _UnderlyingFunctionReturn:
        try:
            return wrapped(*args, **kwargs)
        finally:
            # TODO: derek maggio (06-18-2024): After investigation, it appears on startup
            # that the first call to tracker.store() will not actually store the data.
            # The second call stores both rows of data.

            tracker.store()

    return wrapper


class TrackingFunctions:
    """A class for tracking functions."""

    @staticmethod
    def track_analysis(
        func: _UnderlyingFunction[
            _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
        ]
    ) -> typing.Callable[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn]:
        """Track a function that runs an analysis."""
        return _track_a_function("ANALYZING_PROTOCOL", func)

    @staticmethod
    def track_getting_cached_protocol_analysis(
        func: _UnderlyingFunction[
            _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
        ]
    ) -> typing.Callable[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn]:
        """Track a function that gets cached analysis."""
        return _track_a_function("GETTING_CACHED_ANALYSIS", func)
