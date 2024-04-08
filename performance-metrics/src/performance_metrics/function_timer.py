"""This module offers a mechanism for measuring and storing the execution durations of both synchronous and asynchronous functions.

The FunctionTimer class is intended to be used as a decorator to wrap functions and measure their execution times.
"""

from time import perf_counter_ns
from typing import Protocol, Callable, TypeVar
from typing_extensions import ParamSpec
import inspect

P = ParamSpec("P")
R = TypeVar("R")


class StoreDuration(Protocol):
    """Protocol for a callback function that stores the duration between two timestamps."""

    def __call__(self, start_time: int, end_time: int) -> None:
        """Stores the duration of an operation.

        Args:
            start_time (int): The start timestamp in nanoseconds.
            end_time (int): The end timestamp in nanoseconds.
        """
        pass


class FunctionTimer:
    """A class designed to measure and store the execution duration of functions, both synchronous and asynchronous."""

    def __init__(self, store_duration: StoreDuration) -> None:
        """Initializes the FunctionTimer with a specified storage mechanism for the execution duration.

        Args:
            store_duration: A callback function that stores the execution duration.
        """
        self._store_duration = store_duration

    def measure_duration(self, func: Callable[P, R]) -> Callable[P, R]:
        """Creates a wrapper around a given function to measure its execution duration.

        The wrapper calculates the duration of function execution and stores it using the provided
        storage mechanism. Supports both synchronous and asynchronous functions.

        Args:
            func: The function whose execution duration is to be measured.

        Returns:
            A wrapped version of the input function with duration measurement capability.
        """
        if inspect.iscoroutinefunction(func):

            async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
                """An asynchronous wrapper function for measuring execution duration."""
                start_time = perf_counter_ns()
                try:
                    result: R = await func(*args, **kwargs)
                except Exception as e:
                    raise e
                finally:
                    self._store_duration(start_time, perf_counter_ns())
                return result

            return async_wrapper  # type: ignore
        else:

            def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
                """A synchronous wrapper function for measuring execution duration."""
                start_time = perf_counter_ns()
                try:
                    result: R = func(*args, **kwargs)
                except Exception as e:
                    raise e
                finally:
                    self._store_duration(start_time, perf_counter_ns())
                return result

            return sync_wrapper
