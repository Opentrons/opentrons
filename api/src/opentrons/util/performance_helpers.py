"""Performance helpers for tracking robot context."""

import functools
from pathlib import Path

from opentrons_shared_data.robot.dev_types import RobotTypeEnum
import typing
from opentrons.config import (
    get_performance_metrics_data_dir,
    robot_configs,
    feature_flags as ff,
)

if typing.TYPE_CHECKING:
    from performance_metrics import RobotContextState, SupportsTracking


_UnderlyingFunctionParameters = typing.ParamSpec("_UnderlyingFunctionParameters")
_UnderlyingFunctionReturn = typing.TypeVar("_UnderlyingFunctionReturn")
_UnderlyingFunction = typing.Callable[
    _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
]


_should_track = ff.enable_performance_metrics(
    RobotTypeEnum.robot_literal_to_enum(robot_configs.load().model)
)


class StubbedTracker:
    """A stubbed tracker that does nothing."""

    def __init__(self, storage_location: Path, should_track: bool) -> None:
        """Initialize the stubbed tracker."""
        pass

    def track(
        self,
        state: "RobotContextState",
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


# Ensure that StubbedTracker implements SupportsTracking
# but do not create a runtime dependency on performance_metrics
if typing.TYPE_CHECKING:
    _: typing.Type["SupportsTracking"] = StubbedTracker


def _handle_package_import() -> typing.Type["SupportsTracking"]:
    """Handle the import of the performance_metrics package.

    If the package is not available, return a stubbed tracker.
    """
    try:
        from performance_metrics import RobotContextTracker

        return RobotContextTracker
    except ImportError:
        return StubbedTracker


package_to_use = _handle_package_import()
_robot_context_tracker: typing.Optional["SupportsTracking"] = None


# TODO: derek maggio (06-03-2024): investigate if _should_track should be
# reevaluated each time _get_robot_context_tracker is called. I think this
# might get stuck in a state where after the first call, _should_track is
# always considered the initial value. It might miss changes to the feature
# flag. The easiest way to test this is on a robot when that is working.


def _get_robot_context_tracker() -> "SupportsTracking":
    """Singleton for the robot context tracker."""
    global _robot_context_tracker
    if _robot_context_tracker is None:
        _robot_context_tracker = package_to_use(
            get_performance_metrics_data_dir(), _should_track
        )
    return _robot_context_tracker


def track_analysis(
    func: _UnderlyingFunction[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn]
) -> _UnderlyingFunction[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn]:
    """Track the analysis of a protocol and store each run."""
    # TODO: derek maggio (06-03-2024): generalize creating wrapper functions for tracking different states
    tracker: SupportsTracking = _get_robot_context_tracker()
    wrapped = tracker.track(state="ANALYZING_PROTOCOL")(func)

    @functools.wraps(func)
    def wrapper(
        *args: _UnderlyingFunctionParameters.args,
        **kwargs: _UnderlyingFunctionParameters.kwargs
    ) -> _UnderlyingFunctionReturn:
        try:
            return wrapped(*args, **kwargs)
        finally:
            tracker.store()

    return wrapper
