"""This module offers a mechanism for measuring and storing the execution durations of both synchronous and asynchronous functions.

The FunctionTimer class is intended to be used as a decorator to wrap functions and measure their execution times. It utilizes `perf_counter_ns` for high-resolution performance counter measurements and `clock_gettime_ns(CLOCK_REALTIME)` for real-time clock measurements. The use of `perf_counter_ns` ensures the highest possible resolution timer, which is essential for accurate duration measurement, especially for short-running functions. `clock_gettime_ns(CLOCK_REALTIME)` is used to capture the actual start time in real-world time, which is useful for correlating events or logs with other time-based data.

"""

from time import perf_counter_ns, clock_gettime_ns, CLOCK_REALTIME
from typing import (
    Awaitable,
    Iterator,
    Protocol,
    Callable,
    Sequence,
    TypeVar,
    List,
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
            function_start_time: The time at which the function started executing.
            duration_measurement_start_time: The time at which the duration measurement started.
            duration_measurement_end_time: The time at which the duration measurement ended.
        """
        pass


class FunctionTimer:
    """A decorator class for measuring and storing the execution duration of functions.

    It supports both synchronous and asynchronous functions.
    """

    def __init__(self, callback: FunctionTimerCallback) -> None:
        """Initializes the FunctionTimer."""
        self._callback = callback

    def _begin_timing(self) -> Tuple[int, int]:
        """Starts the timing process, capturing both the current real-time and a high-resolution performance counter.

        Returns:
            A tuple containing the current real-time (`clock_gettime_ns(CLOCK_REALTIME)`) and an initial performance counter (`perf_counter_ns()`). Both values are measured in nanoseconds. The combination of these counters allows us to accurately measure execution durations while also correlating these measurements to real-world time.
        """
        return clock_gettime_ns(CLOCK_REALTIME), perf_counter_ns()

    def _end_timing(self) -> int:
        """Ends the timing process, capturing the final high-resolution performance counter.

        Returns:
            The final performance counter, measured in nanoseconds. This value is captured using `perf_counter_ns()` to ensure consistency with the initial performance counter, providing an accurate duration measurement.
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

        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            """An asynchronous wrapper function for measuring execution duration.

            If an exception is raised during the execution of the function, it is re-raised after
            the duration measurement is stored.
            """
            function_start_time, duration_measurement_start_time = self._begin_timing()
            try:
                result: R = await func(*args, **kwargs)
            except Exception as e:
                raise e
            finally:
                self._callback(
                    RawDurationData(
                        function_start_time,
                        duration_measurement_start_time,
                        self._end_timing(),
                    )
                )
            return result

        return async_wrapper

    def _sync_wrapper(self, func: Callable[P, R]) -> Callable[P, R]:
        """Wraps a synchronous function for duration measurement.

        Args:
            func: The synchronous function to be wrapped.

        Returns:
            A wrapped version of the input function with duration measurement capability.
        """

        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            """A synchronous wrapper function for measuring execution duration.

            If an exception is raised during the execution of the function, it is re-raised after
            the duration measurement is stored.
            """
            function_start_time, duration_measurement_start_time = self._begin_timing()
            try:
                result: R = func(*args, **kwargs)
            except Exception as e:
                raise e
            finally:
                self._callback(
                    RawDurationData(
                        function_start_time,
                        duration_measurement_start_time,
                        self._end_timing(),
                    )
                )
            return result

        return sync_wrapper

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
