"""Module for measuring and storing execution durations of functions.

Provides a `FunctionTimer` class that can be used as a decorator to measure
the execution time of both synchronous and asynchronous functions, utilizing high-resolution
performance counters for accuracy.
"""

from time import perf_counter_ns, clock_gettime_ns, CLOCK_REALTIME
from typing import (
    Awaitable,
    Protocol,
    Callable,
    TypeVar,
    Tuple,
)
from performance_metrics.datashapes import RawDurationData
from typing_extensions import ParamSpec
import inspect

P = ParamSpec("P")
R = TypeVar("R")


class FunctionTimerCallback(Protocol):
    """Protocol for a class that can store the result of a timing operation.

    Implementing classes must provide a `store` method.
    """

    def __call__(self, data: RawDurationData) -> None:
        """Stores the duration of an operation.

        Args:
            data: The duration data to store.
        """
        pass


class FunctionTimer:
    """A decorator class for measuring and storing the execution duration of functions.

    It supports both synchronous and asynchronous functions.
    """

    def __init__(self, callback: FunctionTimerCallback) -> None:
        """Initializes the FunctionTimer.

        Args:
            callback: The callback function that will store the duration data.
        """
        self._callback = callback

    def _begin_timing(self) -> Tuple[int, int]:
        """Starts the timing process, capturing both the current real-time and a high-resolution performance counter.

        Returns:
            A tuple containing the current real-time (`clock_gettime_ns(CLOCK_REALTIME)`) and an initial performance counter (`perf_counter_ns()`). Both values are measured in nanoseconds.
        """
        return clock_gettime_ns(CLOCK_REALTIME), perf_counter_ns()

    def _end_timing(self) -> int:
        """Ends the timing process, capturing the final high-resolution performance counter.

        Returns:
            The final performance counter, measured in nanoseconds.
        """
        return perf_counter_ns()

    def _async_wrapper(
        self, func: Callable[P, Awaitable[R]]
    ) -> Callable[P, Awaitable[R]]:
        """Wraps an asynchronous function for duration measurement.

        Args:
            func: The asynchronous function to be wrapped.

        Returns:
            A wrapped version of the input function with duration measurement capability.
        """

        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            function_start_time, duration_measurement_start_time = self._begin_timing()
            try:
                result = await func(*args, **kwargs)
            finally:
                self._callback(
                    RawDurationData(
                        function_start_time,
                        duration_measurement_start_time,
                        self._end_timing(),
                    )
                )
            return result

        return wrapper

    def _sync_wrapper(self, func: Callable[P, R]) -> Callable[P, R]:
        """Wraps a synchronous function for duration measurement.

        Args:
            func: The synchronous function to be wrapped.

        Returns:
            A wrapped version of the input function with duration measurement capability.
        """

        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            function_start_time, duration_measurement_start_time = self._begin_timing()
            try:
                result = func(*args, **kwargs)
            finally:
                self._callback(
                    RawDurationData(
                        function_start_time,
                        duration_measurement_start_time,
                        self._end_timing(),
                    )
                )
            return result

        return wrapper

    def measure_duration(self, func: Callable[P, R]) -> Callable[P, R]:
        """Creates a wrapper around a given function to measure the execution duration.

        The wrapper calculates the duration of function execution and stores it using the provided
        storage mechanism. Supports both synchronous and asynchronous functions.

        This method is intended to be used as a decorator.

        Args:
            func: The function whose execution duration is to be measured.

        Returns:
            A wrapped version of the input function with duration measurement capability.
        """
        if inspect.iscoroutinefunction(func):
            return self._async_wrapper(func)  # type: ignore
        else:
            return self._sync_wrapper(func)
