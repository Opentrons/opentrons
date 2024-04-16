"""Module for tracking robot context and execution duration for different operations."""

import csv
from pathlib import Path
import platform

from functools import wraps, partial
from time import perf_counter_ns
import os
from typing import Callable, TypeVar, cast


from typing_extensions import ParamSpec
from collections import deque
from performance_metrics.datashapes import RawContextData, RobotContextState

P = ParamSpec("P")
R = TypeVar("R")


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


class RobotContextTracker:
    """Tracks and stores robot context and execution duration for different operations."""

    def __init__(self, storage_file_path: Path, should_track: bool = False) -> None:
        """Initializes the RobotContextTracker with an empty storage list."""
        self._storage: deque[RawContextData] = deque()
        self._storage_file_path = storage_file_path
        self._should_track = should_track

    def track(self, state: RobotContextState) -> Callable:  # type: ignore
        """Decorator factory for tracking the execution duration and state of robot operations.

        Args:
            state: The state to track for the decorated function.

        Returns:
            Callable: A decorator that wraps a function to track its execution duration and state.
        """

        def inner_decorator(func: Callable[P, R]) -> Callable[P, R]:
            if not self._should_track:
                return func

            @wraps(func)
            def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
                function_start_time = _get_timing_function()()
                duration_start_time = perf_counter_ns()
                try:
                    result = func(*args, **kwargs)
                finally:
                    duration_end_time = perf_counter_ns()
                    self._storage.append(
                        RawContextData(
                            function_start_time,
                            duration_start_time,
                            duration_end_time,
                            state,
                        )
                    )
                return result

            return wrapper

        return inner_decorator

    def store(self) -> None:
        """Returns the stored context data and clears the storage list."""
        stored_data = self._storage.copy()
        self._storage.clear()
        rows_to_write = [context_data.csv_row() for context_data in stored_data]
        os.makedirs(self._storage_file_path.parent, exist_ok=True)
        with open(self._storage_file_path, "a") as storage_file:
            writer = csv.writer(storage_file)
            writer.writerow(RawContextData.headers())
            writer.writerows(rows_to_write)
