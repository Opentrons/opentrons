"""Module for tracking robot context and execution duration for different operations."""

import inspect
from pathlib import Path
import platform

from functools import partial
from time import perf_counter_ns
from typing import Callable, cast, Literal, Final


from performance_metrics.datashapes import (
    RawContextData,
)
from performance_metrics.metrics_store import MetricsStore
from opentrons_shared_data.performance.dev_types import (
    RobotContextState,
    SupportsTracking,
    MetricsMetadata,
    UnderlyingFunction,
    UnderlyingFunctionParams,
    UnderlyingFunctionReturn,
)


def _get_timing_function() -> Callable[[], int]:
    """Returns a timing function for the current platform."""
    time_function: Callable[[], int]
    if platform.system() == "Linux":
        from time import clock_gettime_ns, CLOCK_REALTIME

        time_function = cast(
            Callable[[], int], partial(clock_gettime_ns, CLOCK_REALTIME)
        )
    else:
        from time import time_ns

        time_function = time_ns

    return time_function


timing_function = _get_timing_function()


class RobotContextTracker(SupportsTracking):
    """Tracks and stores robot context and execution duration for different operations."""

    METADATA_NAME: Final[Literal["robot_context_data"]] = "robot_context_data"

    def __init__(self, storage_location: Path, should_track: bool) -> None:
        """Initializes the RobotContextTracker with an empty storage list."""
        self._store = MetricsStore[RawContextData](
            MetricsMetadata(
                name=self.METADATA_NAME,
                storage_dir=storage_location,
                headers=RawContextData.headers(),
            )
        )
        self._should_track = should_track

        if self._should_track:
            self._store.setup()

    async def __call_function(
        self,
        func_to_track: UnderlyingFunction,
        *args: UnderlyingFunctionParams.args,
        **kwargs: UnderlyingFunctionParams.kwargs
    ) -> UnderlyingFunctionReturn:
        """Calls the given function and returns its result."""
        if inspect.iscoroutinefunction(func_to_track):
            return await func_to_track(*args, **kwargs)  # type: ignore
        else:
            return func_to_track(*args, **kwargs)  # type: ignore

    async def track(
        self,
        func_to_track: UnderlyingFunction,
        state: RobotContextState,
        *args: UnderlyingFunctionParams.args,
        **kwargs: UnderlyingFunctionParams.kwargs
    ) -> UnderlyingFunctionReturn:
        """Tracks the given function and its execution duration.

        If tracking is disabled, the function is called immediately and its result is returned.

        Args:
            func_to_track: The function to track.
            state: The state of the robot context during the function execution.
            *args: The arguments to pass to the function.
            **kwargs: The keyword arguments to pass to the function.

        Returns:
            If the function executes successfully, its return value is returned.
            If the function raises an exception, the exception the function raised is raised.
        """
        if not self._should_track:
            return await self.__call_function(func_to_track, *args, **kwargs)

        function_start_time = timing_function()
        duration_start_time = perf_counter_ns()

        result: UnderlyingFunctionReturn | Exception

        try:
            result = await self.__call_function(func_to_track, *args, **kwargs)
        except Exception as e:
            result = e

        duration_end_time = perf_counter_ns()

        self._store.add(
            RawContextData(
                func_start=function_start_time,
                duration=duration_end_time - duration_start_time,
                state=state,
            )
        )

        if isinstance(result, Exception):
            raise result
        else:
            return result

    def store(self) -> None:
        """Returns the stored context data and clears the storage list."""
        if not self._should_track:
            return
        self._store.store()
