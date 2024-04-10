"""Defines data classes and enums used in the performance metrics module."""

from enum import Enum
import dataclasses


class RobotContextStates(Enum):
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
    def from_id(cls, state_id: int) -> "RobotContextStates":
        """Returns the enum member matching the given state ID.

        Args:
            state_id: The ID of the state to retrieve.

        Returns:
            RobotContextStates: The enum member corresponding to the given ID.

        Raises:
            ValueError: If no matching state is found.
        """
        for state in RobotContextStates:
            if state.state_id == state_id:
                return state
        raise ValueError(f"Invalid state id: {state_id}")


@dataclasses.dataclass
class RawDurationData:
    """Represents raw duration data for a process or function.

    Attributes:
    - function_start_time (int): The start time of the function.
    - duration_measurement_start_time (int): The start time for duration measurement.
    - duration_measurement_end_time (int): The end time for duration measurement.
    """

    function_start_time: int
    duration_measurement_start_time: int
    duration_measurement_end_time: int


@dataclasses.dataclass
class RawContextData(RawDurationData):
    """Extends RawDurationData with context state information.

    Attributes:
    - state (RobotContextStates): The current state of the context.
    """

    state: RobotContextStates
