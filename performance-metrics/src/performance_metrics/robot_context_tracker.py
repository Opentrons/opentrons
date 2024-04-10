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
                function_start_time=raw_duration_data.function_start_time,
                duration_measurement_start_time=raw_duration_data.duration_measurement_start_time,
                duration_measurement_end_time=raw_duration_data.duration_measurement_end_time,
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
                # Create a partially filled function with the current state pre-filled
                partial_store_func = partial(self._store, state)
                # Initialize the FunctionTimer with the partial function as a callback
                timer = FunctionTimer(callback=partial_store_func)
                # Measure and store the duration of the function call
                result = timer.measure_duration(func)(*args, **kwargs)
                return result

            return wrapper

        return inner_decorator
