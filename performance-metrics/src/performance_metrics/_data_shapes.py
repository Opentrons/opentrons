"""Defines the shape of stored data."""

import dataclasses
import typing
from pathlib import Path

from ._types import SupportsCSVStorage, StorableData, RobotActivityState
from ._util import get_timing_function

_timing_function = get_timing_function()


@dataclasses.dataclass(frozen=True)
class RawActivityData(SupportsCSVStorage):
    """Represents raw duration data with activity state information.

    Attributes:
    - function_start_time (int): The start time of the function.
    - duration_measurement_start_time (int): The start time for duration measurement.
    - duration_measurement_end_time (int): The end time for duration measurement.
    - state (RobotActivityStates): The current state of the activity.
    """

    state: RobotActivityState
    func_start: int
    duration: int

    @classmethod
    def headers(self) -> typing.Tuple[str, str, str]:
        """Returns the headers for the raw activity data."""
        return ("state_name", "function_start_time", "duration")

    def csv_row(self) -> typing.Tuple[str, int, int]:
        """Returns the raw activity data as a string."""
        return (
            self.state,
            self.func_start,
            self.duration,
        )

    @classmethod
    def from_csv_row(cls, row: typing.Sequence[StorableData]) -> SupportsCSVStorage:
        """Returns a RawActivityData object from a CSV row."""
        return cls(
            state=typing.cast(RobotActivityState, row[0]),
            func_start=int(row[1]),
            duration=int(row[2]),
        )


@dataclasses.dataclass(frozen=True)
class ProcessResourceUsageSnapshot(SupportsCSVStorage):
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

    @classmethod
    def headers(self) -> typing.Tuple[str, str, str, str, str, str]:
        """Returns the headers for the process resource usage data."""
        return (
            "query_time",
            "command",
            "running_since",
            "user_cpu_time",
            "system_cpu_time",
            "memory_percent",
        )

    def csv_row(self) -> typing.Tuple[int, str, float, float, float, float]:
        """Returns the process resource usage data as a string."""
        return (
            self.query_time,
            self.command,
            self.running_since,
            self.user_cpu_time,
            self.system_cpu_time,
            self.memory_percent,
        )

    @classmethod
    def from_csv_row(cls, row: typing.Sequence[StorableData]) -> SupportsCSVStorage:
        """Returns a ProcessResourceUsageData object from a CSV row."""
        return cls(
            query_time=int(row[0]),
            command=str(row[1]),
            running_since=float(row[2]),
            user_cpu_time=float(row[3]),
            system_cpu_time=float(row[4]),
            memory_percent=float(row[4]),
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
