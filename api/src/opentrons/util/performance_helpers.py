"""Performance helpers for tracking robot context."""

import inspect
from pathlib import Path
from opentrons_shared_data.performance.dev_types import (
    SupportsTracking,
    UnderlyingFunction,
    UnderlyingFunctionParameters,
    UnderlyingFunctionReturn,
    RobotContextState,
)
from opentrons_shared_data.robot.dev_types import RobotTypeEnum
import typing
from opentrons.config import (
    get_performance_metrics_data_dir,
    robot_configs,
    feature_flags as ff,
)


_should_track = ff.enable_performance_metrics(
    RobotTypeEnum.robot_literal_to_enum(robot_configs.load().model)
)


class StubbedTracker(SupportsTracking):
    """A stubbed tracker that does nothing."""

    def __init__(self, storage_location: Path, should_track: bool) -> None:
        """Initialize the stubbed tracker."""
        pass

    async def track(
        self,
        func_to_track: UnderlyingFunction,
        state: RobotContextState,
        *args: UnderlyingFunctionParameters.args,
        **kwargs: UnderlyingFunctionParameters.kwargs
    ) -> UnderlyingFunctionReturn:
        """Return the function unchanged."""

        if inspect.iscoroutinefunction(func_to_track):
            return await func_to_track(*args, **kwargs)  # type: ignore
        else:
            return func_to_track(*args, **kwargs)  # type: ignore

    def store(self) -> None:
        """Do nothing."""
        pass


def _handle_package_import() -> typing.Type[SupportsTracking]:
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
        _robot_context_tracker = package_to_use(
            get_performance_metrics_data_dir(), _should_track
        )
    return _robot_context_tracker


# def _build_track_wrapper(
#     func: UnderlyingFunction, state: RobotContextState
# ) -> WrappedFunction:
#     """Decorator to track the given state for the decorated function.

#     Args:
#         func: The function to track.
#         state: The state of the robot context during the function execution.

#     Returns:
#         The decorated function.
#     """

#     async def wrapper(
#         *args: P.args, **kwargs: P.kwargs
#     ) -> T:
#         tracker: SupportsTracking = _get_robot_context_tracker()

#         try:

#             result: T = await tracker.track(
#                 func_to_track=func, state=state, *args, **kwargs
#             )
#         finally:
#             tracker.store()

#         return result

#     return wrapper


def track_analysis(func: UnderlyingFunction) -> UnderlyingFunction:
    """Track the analysis of a protocol and optionally store each run."""

    async def wrapper(
        *args: UnderlyingFunctionParameters.args,
        **kwargs: UnderlyingFunctionParameters.kwargs
    ) -> UnderlyingFunctionReturn:
        tracker: SupportsTracking = _get_robot_context_tracker()

        try:

            result: UnderlyingFunctionReturn = await tracker.track(
                func_to_track=func, state=RobotContextState.ANALYZING_PROTOCOL
            )
        finally:
            tracker.store()

        return result

    return wrapper
