"""Module for tracking robot context and execution duration for different operations."""

import csv
from pathlib import Path
import os

from functools import wraps
from time import perf_counter_ns, clock_gettime_ns, CLOCK_REALTIME
from typing import Callable, TypeVar
from typing_extensions import ParamSpec
from collections import deque
from performance_metrics.constants import PerformanceMetricsFilename
from performance_metrics.datashapes import (
    RawContextData,
    RobotContextState,
)

P = ParamSpec("P")
R = TypeVar("R")


class RobotContextTracker:
    """Tracks and stores robot context and execution duration for different operations."""

    def __init__(self, storage_dir: Path, should_track: bool = False) -> None:
        """Initializes the RobotContextTracker with an empty storage list."""
        self._storage: deque[RawContextData] = deque()
        self.storage_file_path = (
            PerformanceMetricsFilename.ROBOT_CONTEXT.get_storage_file_path(storage_dir)
        )
        self._should_track = should_track

    def _track(self, state: RobotContextState) -> Callable:  # type: ignore
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
                function_start_time = clock_gettime_ns(CLOCK_REALTIME)
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

    def track_analysis(self) -> Callable:  # type: ignore
        """Decorator for tracking the analysis of a protocol."""
        return self._track(RobotContextState.ANALYZING_PROTOCOL)

    def track_startup(self) -> Callable:  # type: ignore
        """Decorator for tracking the startup of the robot."""
        return self._track(RobotContextState.STARTING_UP)

    def store(self) -> None:
        """Returns the stored context data and clears the storage list."""
        stored_data = self._storage.copy()
        self._storage.clear()
        rows_to_write = [context_data.csv_row() for context_data in stored_data]
        os.makedirs(self.storage_file_path.parent, exist_ok=True)
        with open(self.storage_file_path, "a") as storage_file:
            writer = csv.writer(storage_file)
            writer.writerow(RawContextData.headers())
            writer.writerows(rows_to_write)
