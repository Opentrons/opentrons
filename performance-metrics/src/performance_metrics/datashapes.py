"""Defines data classes and enums used in the performance metrics module."""

import dataclasses
from typing import Tuple
from opentrons_shared_data.performance.dev_types import RobotContextState


@dataclasses.dataclass(frozen=True)
class RawContextData:
    """Represents raw duration data with context state information.

    Attributes:
    - function_start_time (int): The start time of the function.
    - duration_measurement_start_time (int): The start time for duration measurement.
    - duration_measurement_end_time (int): The end time for duration measurement.
    - state (RobotContextStates): The current state of the context.
    """

    func_start: int
    duration_start: int
    duration_end: int
    state: RobotContextState

    @classmethod
    def headers(self) -> Tuple[str, str, str]:
        """Returns the headers for the raw context data."""
        return ("state_id", "function_start_time", "duration")

    def csv_row(self) -> Tuple[int, int, int]:
        """Returns the raw context data as a string."""
        return (
            self.state.state_id,
            self.func_start,
            self.duration_end - self.duration_start,
        )
