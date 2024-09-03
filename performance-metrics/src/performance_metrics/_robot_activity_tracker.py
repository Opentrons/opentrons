"""Module for tracking robot activity and execution duration for different operations."""

import inspect
from pathlib import Path

from functools import wraps
from time import perf_counter_ns
import typing

from ._metrics_store import MetricsStore
from ._data_shapes import RawActivityData, MetricsMetadata
from ._types import SupportsTracking, RobotActivityState
from ._util import get_timing_function

_UnderlyingFunctionParameters = typing.ParamSpec("_UnderlyingFunctionParameters")
_UnderlyingFunctionReturn = typing.TypeVar("_UnderlyingFunctionReturn")
_UnderlyingFunction = typing.Callable[
    _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
]


_timing_function = get_timing_function()


class RobotActivityTracker(SupportsTracking):
    """Tracks and stores robot activity and execution duration for different operations."""

    METADATA_NAME: typing.Final[
        typing.Literal["robot_activity_data"]
    ] = "robot_activity_data"

    def __init__(self, storage_location: Path, should_track: bool) -> None:
        """Initializes the RobotActivityTracker with an empty storage list."""
        self._store = MetricsStore[RawActivityData](
            MetricsMetadata(
                name=self.METADATA_NAME,
                storage_dir=storage_location,
                headers=RawActivityData.headers(),
            )
        )
        self._should_track = should_track

        if self._should_track:
            self._store.setup()

    def track(
        self,
        state: RobotActivityState,
    ) -> typing.Callable[
        [_UnderlyingFunction[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn]],
        _UnderlyingFunction[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn],
    ]:
        """Tracks the given function and its execution duration.

        If tracking is disabled, the function is called immediately and its result is returned.

        Args:
            func_to_track: The function to track.
            state: The state of the robot activity during the function execution.
            *args: The arguments to pass to the function.
            **kwargs: The keyword arguments to pass to the function.

        Returns:
            If the function executes successfully, its return value is returned.
            If the function raises an exception, the exception the function raised is raised.
        """

        def inner_decorator(
            func_to_track: _UnderlyingFunction[
                _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
            ]
        ) -> _UnderlyingFunction[
            _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
        ]:
            if not self._should_track:
                return func_to_track

            if inspect.iscoroutinefunction(func_to_track):

                @wraps(func_to_track)
                async def async_wrapper(
                    *args: _UnderlyingFunctionParameters.args,
                    **kwargs: _UnderlyingFunctionParameters.kwargs
                ) -> _UnderlyingFunctionReturn:
                    function_start_time = _timing_function()
                    duration_start_time = perf_counter_ns()
                    try:
                        result = await func_to_track(*args, **kwargs)
                    finally:
                        duration_end_time = perf_counter_ns()

                        self._store.add(
                            RawActivityData(
                                func_start=function_start_time,
                                duration=duration_end_time - duration_start_time,
                                state=state,
                            )
                        )

                    return result  # type: ignore

                return async_wrapper  # type: ignore
            else:

                @wraps(func_to_track)
                def wrapper(
                    *args: _UnderlyingFunctionParameters.args,
                    **kwargs: _UnderlyingFunctionParameters.kwargs
                ) -> _UnderlyingFunctionReturn:
                    function_start_time = _timing_function()
                    duration_start_time = perf_counter_ns()

                    try:
                        result = func_to_track(*args, **kwargs)
                    finally:
                        duration_end_time = perf_counter_ns()

                        self._store.add(
                            RawActivityData(
                                func_start=function_start_time,
                                duration=duration_end_time - duration_start_time,
                                state=state,
                            )
                        )

                    return result

                return wrapper

        return inner_decorator

    def store(self) -> None:
        """Returns the stored activity data and clears the storage list."""
        if not self._should_track:
            return
        self._store.store()
