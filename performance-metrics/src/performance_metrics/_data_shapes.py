"""Defines the shape of stored data."""

import dataclasses
import typing
from pathlib import Path

from ._types import StorableData, RobotActivityState
from ._util import get_timing_function

_timing_function = get_timing_function()


@dataclasses.dataclass(frozen=True)
class CSVStorageBase:
    """Base class for all data classes."""

    @classmethod
    def headers(cls) -> typing.Tuple[str, ...]:
        """Returns the headers for the BaseData class."""
        return tuple([field.name for field in dataclasses.fields(cls)])

    def csv_row(self) -> typing.Tuple[StorableData, ...]:
        """Returns the object as a CSV row."""
        return dataclasses.astuple(self)

    @classmethod
    def from_csv_row(cls, row: typing.Sequence[StorableData]) -> "CSVStorageBase":
        """Returns an object from a CSV row."""
        return cls(*row)


@dataclasses.dataclass(frozen=True)
class RawActivityData(CSVStorageBase):
    """Represents raw duration data with activity state information.

    Attributes:
    - state (RobotActivityStates): The current state of the activity.
    - func_start (int): The start time of the function.
    - duration (int): The start time for duration measurement.
    """

    state: RobotActivityState
    func_start: int
    duration: int


@dataclasses.dataclass(frozen=True)
class ProcessResourceUsageSnapshot(CSVStorageBase):
    """Represents process resource usage data.

    Attributes:
    - query_time (int): The time in nanoseconds since the process started.
    - command (str): The command that was executed.
    - running_since (float): The time in nanoseconds since the process started.
    - user_cpu_time (float): The user CPU time in seconds.
    - system_cpu_time (float): The system CPU time in seconds.
    - memory_percent (float): The memory usage percentage.
    """

    query_time: int  # nanoseconds
    command: str
    running_since: float  # seconds
    user_cpu_time: float  # seconds
    system_cpu_time: float  # seconds
    memory_percent: float


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
