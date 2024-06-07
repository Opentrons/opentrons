"""Structural types for performance metrics."""

import typing
from pathlib import Path

_UnderlyingFunctionParameters = typing.ParamSpec("_UnderlyingFunctionParameters")
_UnderlyingFunctionReturn = typing.TypeVar("_UnderlyingFunctionReturn")
_UnderlyingFunction = typing.Callable[
    _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
]

RobotContextState = typing.Literal[
    "ANALYZING_PROTOCOL",
    "RUNNING_PROTOCOL",
    "CALIBRATING",
    "ROBOT_STARTING_UP",
    "ROBOT_SHUTTING_DOWN",
]


class SupportsTracking(typing.Protocol):
    """Protocol for classes that support tracking of robot context."""

    def __init__(self, storage_location: Path, should_track: bool) -> None:
        """Initialize the tracker."""
        ...

    def track(
        self,
        state: "RobotContextState",
    ) -> typing.Callable[
        [_UnderlyingFunction[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn]],
        _UnderlyingFunction[_UnderlyingFunctionParameters, _UnderlyingFunctionReturn],
    ]:
        """Decorator to track the given state for the decorated function."""
        ...

    def store(self) -> None:
        """Store the tracked data."""
        ...


StorableData = typing.Union[int, float, str]


class SupportsCSVStorage(typing.Protocol):
    """A protocol for classes that support CSV storage."""

    @classmethod
    def headers(self) -> typing.Tuple[str, ...]:
        """Returns the headers for the CSV data."""
        ...

    def csv_row(self) -> typing.Tuple[StorableData, ...]:
        """Returns the object as a CSV row."""
        ...

    @classmethod
    def from_csv_row(cls, row: typing.Tuple[StorableData, ...]) -> "SupportsCSVStorage":
        """Returns an object from a CSV row."""
        ...
