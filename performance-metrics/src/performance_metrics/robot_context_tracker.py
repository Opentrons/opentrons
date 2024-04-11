"""Module for tracking robot context and execution duration for different operations."""

from functools import wraps, partial
from typing import Callable, TypeVar, List
from typing_extensions import ParamSpec
from performance_metrics.datashapes import (
    RawContextData,
    RobotContextStates,
    RawDurationData,
)
from performance_metrics.function_timer import FunctionTimer

P = ParamSpec("P")
R = TypeVar("R")


class RobotContextTracker:
    """Tracks and stores robot context and execution duration for different operations."""

    def __init__(self) -> None:
        """Initializes the RobotContextTracker with an empty storage list."""
        self._storage: List[RawContextData] = []

    def _store(
        self, state: RobotContextStates, raw_duration_data: RawDurationData
    ) -> None:
        """Stores the context and duration data for a robot operation.

        Args:
            state : The state of the robot during the operation.
            raw_duration_data : The duration data for the operation.
        """
        self._storage.append(
            RawContextData(
                func_start=raw_duration_data.func_start,
                duration_start=raw_duration_data.duration_start,
                duration_end=raw_duration_data.duration_end,
                state=state,
            )
        )

    def track(self, state: RobotContextStates) -> Callable:  # type: ignore
        """Decorator factory for tracking the execution duration and state of robot operations.

        Args:
            state: The state to track for the decorated function.

        Returns:
            Callable: A decorator that wraps a function to track its execution duration and state.
        """

        def inner_decorator(func: Callable[P, R]) -> Callable[P, R]:
            @wraps(func)
            def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:

                try:
                    with FunctionTimer() as timer:
                        result = func(*args, **kwargs)
                finally:
                    self._store(state, timer.get_data())
                return result

            return wrapper

        return inner_decorator
