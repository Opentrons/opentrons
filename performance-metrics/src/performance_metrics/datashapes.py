"""Defines the shape of stored data."""

import dataclasses
from typing import Sequence, Tuple, Protocol, Union
from opentrons_shared_data.performance.dev_types import RobotContextState

StorableData = Union[int, float, str]


class SupportsCSVStorage(Protocol):
    """A protocol for classes that support CSV storage."""

    @classmethod
    def headers(self) -> Tuple[str, ...]:
        """Returns the headers for the CSV data."""
        ...

    def csv_row(self) -> Tuple[StorableData, ...]:
        """Returns the object as a CSV row."""
        ...

    @classmethod
    def from_csv_row(cls, row: Tuple[StorableData, ...]) -> "SupportsCSVStorage":
        """Returns an object from a CSV row."""
        ...


@dataclasses.dataclass(frozen=True)
class RawContextData(SupportsCSVStorage):
    """Represents raw duration data with context state information.

    Attributes:
    - function_start_time (int): The start time of the function.
    - duration_measurement_start_time (int): The start time for duration measurement.
    - duration_measurement_end_time (int): The end time for duration measurement.
    - state (RobotContextStates): The current state of the context.
    """

    state: RobotContextState
    func_start: int
    duration: int

    @classmethod
    def headers(self) -> Tuple[str, str, str]:
        """Returns the headers for the raw context data."""
        return ("state_id", "function_start_time", "duration")

    def csv_row(self) -> Tuple[int, int, int]:
        """Returns the raw context data as a string."""
        return (
            self.state.state_id,
            self.func_start,
            self.duration,
        )

    @classmethod
    def from_csv_row(cls, row: Sequence[StorableData]) -> SupportsCSVStorage:
        """Returns a RawContextData object from a CSV row."""
        return cls(
            state=RobotContextState.from_id(int(row[0])),
            func_start=int(row[1]),
            duration=int(row[2]),
        )
