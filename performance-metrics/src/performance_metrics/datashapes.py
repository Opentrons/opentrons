import datetime
import enum
import dataclasses
from typing import Literal


class RobotContextStates(enum.Enum):
    STARTING_UP = (0, Literal["STARTING_UP"])
    CALIBRATING = (1, Literal["CALIBRATING"])
    ANALYZING_PROTOCOL = (2, Literal["ANALYZING_PROTOCOL"])
    RUNNING_PROTOCOL = (3, Literal["RUNNING_PROTOCOL"])
    SHUTTING_DOWN = (4, Literal["SHUTTING_DOWN"])

    def __init__(self, state_id: str, state_name: str) -> None:
        self.state_id = state_id
        self.state_name = state_name

    @classmethod
    def from_id(cls, state_id: int) -> "RobotContextStates":
        for state in RobotContextStates:
            if state.state_id == state_id:
                return state
        raise ValueError(f"Invalid state id: {state_id}")


@dataclasses.dataclass
class RawDurationData:
    function_start_time: int
    duration_measurement_start_time: int
    duration_measurement_end_time: int


@dataclasses.dataclass
class RawContextData(RawDurationData):
    state: int
