"""Structural types for performance metrics."""

import typing
from pathlib import Path

_UnderlyingFunctionParameters = typing.ParamSpec("_UnderlyingFunctionParameters")
_UnderlyingFunctionReturn = typing.TypeVar("_UnderlyingFunctionReturn")
_UnderlyingFunction = typing.Callable[
    _UnderlyingFunctionParameters, _UnderlyingFunctionReturn
]


RobotActivityState = typing.Literal[
    "ANALYZING_PROTOCOL",
    "GETTING_CACHED_ANALYSIS",
    "RUNNING_PROTOCOL",
    "CALIBRATING",
    "ROBOT_STARTING_UP",
    "ROBOT_SHUTTING_DOWN",
]


class SupportsTracking(typing.Protocol):
    """Protocol for classes that support tracking of robot activity."""

    def __init__(self, storage_location: Path, should_track: bool) -> None:
        """Initialize the tracker."""
        ...

    def track(
        self,
        state: "RobotActivityState",
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
