"""Task state tracking."""
from dataclasses import dataclass
from itertools import chain
from ..types import Task, TaskSummary, FinishedTask
from ._abstract_store import HasState, HandlesActions
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.errors.exceptions import NoTaskFoundError
from ..actions import (
    get_state_updates,
    Action,
    StartTaskAction,
    FinishTaskAction,
)


@dataclass
class TaskState:
    """Task state tracking."""

    current_tasks_by_id: dict[str, Task]
    finished_tasks_by_id: dict[str, FinishedTask]


class TaskStore(HasState[TaskState], HandlesActions):
    """Stores tasks."""

    _state: TaskState

    def __init__(self) -> None:
        """Initialize a TaskStore."""
        self._state = TaskState(current_tasks_by_id={}, finished_tasks_by_id={})

    def _handle_state_update(self, state_update: update_types.StateUpdate) -> None:
        """Handle a state update."""
        return

    def _handle_start_task_action(self, action: StartTaskAction) -> None:
        self._state.current_tasks_by_id[action.task.id] = action.task

    def _handle_finish_task_action(self, action: FinishTaskAction) -> None:
        task = self._state.current_tasks_by_id[action.task_id]
        self._state.finished_tasks_by_id[action.task_id] = FinishedTask(
            id=task.id,
            createdAt=task.createdAt,
            finishedAt=action.finished_at,
            error=action.error,
        )
        del self._state.current_tasks_by_id[action.task_id]

    def handle_action(self, action: Action) -> None:
        """Modify the state in reaction to an action."""
        for state_update in get_state_updates(action):
            self._handle_state_update(state_update)
        match action:
            case StartTaskAction():
                self._handle_start_task_action(action)
            case FinishTaskAction():
                self._handle_finish_task_action(action)
            case _:
                pass


class TaskView:
    """Read-only task state view."""

    _state: TaskState

    def __init__(self, state: TaskState) -> None:
        """Initialize a TaskView."""
        self._state = state

    def get_current(self, id: str) -> Task:
        """Get a task by ID."""
        try:
            return self._state.current_tasks_by_id[id]
        except KeyError as e:
            raise NoTaskFoundError(f"No current task with ID {id}") from e

    def get_all_current(self) -> list[Task]:
        """Get all currently running tasks."""
        return [task for task in self._state.current_tasks_by_id.values()]

    def get_finished(self, id: str) -> FinishedTask:
        """Get a finished task by ID."""
        try:
            return self._state.finished_tasks_by_id[id]
        except KeyError as e:
            raise NoTaskFoundError(f"No finished task with ID {id}") from e

    def get_summary(self) -> list[TaskSummary]:
        """Get a summary of all tasks."""
        return [
            TaskSummary(
                id=task_id,
                createdAt=task.createdAt,
                finishedAt=getattr(task, "finishedAt", None),
                error=getattr(task, "error", None),
            )
            for task_id, task in chain(
                self._state.current_tasks_by_id.items(),
                self._state.finished_tasks_by_id.items(),
            )
        ]
