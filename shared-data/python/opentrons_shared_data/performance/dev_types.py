from typing import Protocol, TypeVar, Callable, Any
from pathlib import Path
from enum import Enum

DecoratedFunction = TypeVar("_T", bound=Callable[..., Any])

class SupportsTracking(Protocol):
    def __init__(self, storage_dir: Path, should_track: bool) -> None:
        ...

    def track(self, state: "RobotContextState") -> Callable[[DecoratedFunction], DecoratedFunction]:
        ...

    def store(self) -> None:
        ...

class robot_context_tracker(SupportsTracking):
    def __init__(self, storage_dir: Path, should_track: bool) -> None:
        pass

    def track(self, state: "RobotContextState") -> Callable[[DecoratedFunction], DecoratedFunction]:
        def inner_decorator(func: DecoratedFunction) -> DecoratedFunction:
            return func
        return inner_decorator

    def store(self) -> None:
        pass

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