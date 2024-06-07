"""Defines the shape of stored data."""

import dataclasses
import typing
from pathlib import Path

from .types import SupportsCSVStorage, StorableData, RobotContextState


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
    def headers(self) -> typing.Tuple[str, str, str]:
        """Returns the headers for the raw context data."""
        return ("state_id", "function_start_time", "duration")

    def csv_row(self) -> typing.Tuple[str, int, int]:
        """Returns the raw context data as a string."""
        return (
            self.state,
            self.func_start,
            self.duration,
        )

    @classmethod
    def from_csv_row(cls, row: typing.Sequence[StorableData]) -> SupportsCSVStorage:
        """Returns a RawContextData object from a CSV row."""
        return cls(
            state=typing.cast(RobotContextState, row[0]),
            func_start=int(row[1]),
            duration=int(row[2]),
        )


@dataclasses.dataclass(frozen=True)
class MetricsMetadata:
    """Dataclass to store metadata about the metrics."""

    name: str
    storage_dir: Path
    headers: typing.Tuple[str, ...]

    @property
    def data_file_location(self) -> Path:
        """The location of the data file."""
        return self.storage_dir / self.name

    @property
    def headers_file_location(self) -> Path:
        """The location of the header file."""
        return self.data_file_location.with_stem(
            self.data_file_location.stem + "_headers"
        )
