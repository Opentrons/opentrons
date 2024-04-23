"""Module for tracking robot context and execution duration for different operations."""

from pathlib import Path
import platform

from functools import wraps, partial
from time import perf_counter_ns
from typing import Callable, TypeVar, cast, Literal, Final


from typing_extensions import ParamSpec
from performance_metrics.datashapes import (
    RawContextData,
)
from performance_metrics.metrics_store import MetricsStore
from opentrons_shared_data.performance.dev_types import (
    RobotContextState,
    SupportsTracking,
    MetricsMetadata,
)

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


timing_function = _get_timing_function()


class RobotContextTracker(SupportsTracking):
    """Tracks and stores robot context and execution duration for different operations."""

    METADATA_NAME: Final[Literal["robot_context_data"]] = "robot_context_data"

    def __init__(self, storage_location: Path, should_track: bool = False) -> None:
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
                function_start_time = timing_function()
                duration_start_time = perf_counter_ns()
                try:
                    result = func(*args, **kwargs)
                finally:
                    duration_end_time = perf_counter_ns()
                    self._store.add(
                        RawContextData(
                            func_start=function_start_time,
                            duration=duration_end_time - duration_start_time,
                            state=state,
                        )
                    )

                return result

            return wrapper

        return inner_decorator

    def store(self) -> None:
        """Returns the stored context data and clears the storage list."""
        if not self._should_track:
            return
        self._store.store()
