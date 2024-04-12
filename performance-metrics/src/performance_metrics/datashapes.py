"""Defines data classes and enums used in the performance metrics module."""

from enum import Enum
import dataclasses
from typing import Tuple


class RobotContextState(Enum):
    """Enum representing different states of a robot's operation context."""

    STARTING_UP = 0, "STARTING_UP"
    CALIBRATING = 1, "CALIBRATING"
    ANALYZING_PROTOCOL = 2, "ANALYZING_PROTOCOL"
    RUNNING_PROTOCOL = 3, "RUNNING_PROTOCOL"
    SHUTTING_DOWN = 4, "SHUTTING_DOWN"

    def __init__(self, state_id: int, state_name: str) -> None:
        self.state_id = state_id
        self.state_name = state_name

    @classmethod
    def from_id(cls, state_id: int) -> "RobotContextState":
        """Returns the enum member matching the given state ID.

        Args:
            state_id: The ID of the state to retrieve.

        Returns:
            RobotContextStates: The enum member corresponding to the given ID.

        Raises:
            ValueError: If no matching state is found.
        """
        for state in RobotContextState:
            if state.state_id == state_id:
                return state
        raise ValueError(f"Invalid state id: {state_id}")


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
