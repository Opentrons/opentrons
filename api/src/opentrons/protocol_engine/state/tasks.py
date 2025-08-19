"""Task state tracking."""
from dataclasses import dataclass
from ..types import Task, TaskSummary
from ._abstract_store import HasState, HandlesActions
from ..actions import Action, get_state_updates
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.errors.exceptions import NoTaskFoundError


@dataclass
class TaskState:
    """Task state tracking."""

    tasks_by_id: dict[str, Task]


class TaskStore(HasState[TaskState], HandlesActions):
    """Stores tasks."""

    _state: TaskState

    def __init__(self) -> None:
        """Initialize a TaskStore."""
        self._state = TaskState(tasks_by_id={})

    def handle_action(self, action: Action) -> None:
        """Handle an action."""
        for state_update in get_state_updates(action):
            self._handle_state_update(state_update)

    def _handle_state_update(self, state_update: update_types.StateUpdate) -> None:
        """Handle a state update."""
        return


class TaskView:
    """Read-only task state view."""

    _state: TaskState

    def __init__(self, state: TaskState) -> None:
        """Initialize a TaskView."""
        self._state = state

    def get(self, id: str) -> Task:
        """Get a task by ID."""
        try:
            return self._state.tasks_by_id[id]
        except KeyError as e:
            raise NoTaskFoundError(f"No task with ID {id}") from e

    def get_summary(self) -> list[TaskSummary]:
        """Get a summary of all tasks."""
        return [
            TaskSummary(
                id=id,
                createdAt=task.createdAt,
                finishedAt=task.finishedAt,
                error=task.error,
            )
            for id, task in self._state.tasks_by_id.items()
        ]
