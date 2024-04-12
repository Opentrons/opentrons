"""Module for tracking robot context and execution duration for different operations."""

from functools import wraps
from time import perf_counter_ns, clock_gettime_ns, CLOCK_REALTIME
from typing import Callable, TypeVar
from typing_extensions import ParamSpec
from collections import deque
from performance_metrics.datashapes import (
    RawContextData,
    RobotContextState,
)

P = ParamSpec("P")
R = TypeVar("R")


class RobotContextTracker:
    """Tracks and stores robot context and execution duration for different operations."""

    def __init__(self, should_track: bool = False) -> None:
        """Initializes the RobotContextTracker with an empty storage list."""
        self._storage: deque[RawContextData] = deque()
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
