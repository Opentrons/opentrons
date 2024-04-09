"""This module offers a mechanism for measuring and storing the execution durations of both synchronous and asynchronous functions.

The FunctionTimer class is intended to be used as a decorator to wrap functions and measure their execution times.
"""

from time import perf_counter_ns, clock_gettime_ns, CLOCK_REALTIME
from typing import Iterator, Protocol, Callable, TypeVar, List, Tuple
from typing_extensions import ParamSpec
import inspect

P = ParamSpec("P")
R = TypeVar("R")


class CanStoreTimingResult(Protocol):
    """A protocol for a function that can store the result of a timing operation."""

    def store(
        self,
        function_start_time: int,
        duration_measurement_start_time: int,
        duration_measurement_end_time: int,
    ) -> None:
        """Stores the duration of an operation.

        Args:
            function_start_time: The time at which the function started executing.
            duration_measurement_start_time: The time at which the duration measurement started.
            duration_measurement_end_time: The time at which the duration measurement ended.
        """
        pass


class TimingResultStore(CanStoreTimingResult):
    """A class that stores the result of a timing operation."""

    def __init__(self) -> None:
        """Initializes the TimingResultStore with a storage method.

        Args:
            storage_method: A method that stores the result of a timing operation.
        """
        self._storage: List[Tuple[int, int, int]] = []

    def __len__(self) -> int:
        """Returns the number of stored timing results."""
        return len(self._storage)

    def __getitem__(self, index: int) -> Tuple[int, int, int]:
        """Returns the timing result at the specified index."""
        return self._storage[index]

    def __iter__(self) -> Iterator[Tuple[int, int, int]]:
        """Returns an iterator over the stored timing results."""
        return iter(self._storage)

    def store(
        self,
        function_start_time: int,
        duration_measurement_start_time: int,
        duration_measurement_end_time: int,
    ) -> None:
        """Stores the duration of an operation.

        Args:
            function_start_time: The time at which the function started executing.
            duration_measurement_start_time: The time at which the duration measurement started.
            duration_measurement_end_time: The time at which the duration measurement ended.
        """
        self._storage.append(
            (
                function_start_time,
                duration_measurement_start_time,
                duration_measurement_end_time,
            )
        )


class FunctionTimer:
    """A class designed to measure and store the execution duration of functions, both synchronous and asynchronous."""

    def __init__(self, can_store: CanStoreTimingResult) -> None:
        """Initializes the FunctionTimer with a specified storage mechanism for the execution duration.

        Args:
            can_store: A callback function that stores the execution duration.
        """
        self._can_store = can_store

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
                function_start_time = clock_gettime_ns(CLOCK_REALTIME)
                duration_measurement_start_time = perf_counter_ns()
                try:
                    result: R = await func(*args, **kwargs)
                except Exception as e:
                    raise e
                finally:
                    duration_measurement_end_time = perf_counter_ns()
                    self._can_store.store(
                        function_start_time,
                        duration_measurement_start_time,
                        duration_measurement_end_time,
                    )
                return result

            return async_wrapper  # type: ignore
        else:

            def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
                """A synchronous wrapper function for measuring execution duration."""
                function_start_time = clock_gettime_ns(CLOCK_REALTIME)
                duration_measurement_start_time = perf_counter_ns()
                try:
                    result: R = func(*args, **kwargs)
                except Exception as e:
                    raise e
                finally:
                    duration_measurement_end_time = perf_counter_ns()
                    self._can_store.store(
                        function_start_time,
                        duration_measurement_start_time,
                        duration_measurement_end_time,
                    )
                return result

            return sync_wrapper
