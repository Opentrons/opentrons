"""Type definitions for performance tracking."""
from dataclasses import dataclass
from typing import Protocol, Tuple, TypeVar, Callable, Any
from pathlib import Path
from enum import Enum

F = TypeVar("F", bound=Callable[..., Any])


class SupportsTracking(Protocol):
    """Protocol for classes that support tracking of robot context."""

    def __init__(self, storage_location: Path, should_track: bool) -> None:
        """Initialize the tracker."""
        ...

    def track(self, state: "RobotContextState") -> Callable[[F], F]:
        """Decorator to track the given state for the decorated function."""
        ...

    def store(self) -> None:
        """Store the tracked data."""
        ...


class RobotContextState(Enum):
    """Enum representing different states of a robot's operation context."""

    STARTING_UP = 0, "STARTING_UP"
    CALIBRATING = 1, "CALIBRATING"
    ANALYZING_PROTOCOL = 2, "ANALYZING_PROTOCOL"
    RUNNING_PROTOCOL = 3, "RUNNING_PROTOCOL"
    SHUTTING_DOWN = 4, "SHUTTING_DOWN"

    def __init__(self, state_id: int, state_name: str) -> None:
        """Initialize the enum member."""
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


@dataclass(frozen=True)
class MetricsMetadata:
    """Dataclass to store metadata about the metrics."""

    name: str
    storage_dir: Path
    headers: Tuple[str, ...]

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
