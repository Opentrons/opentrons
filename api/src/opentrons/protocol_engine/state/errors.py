"""Protocol engine commands sub-state."""
from __future__ import annotations
from dataclasses import dataclass, replace
from datetime import datetime
from typing import List, Mapping

from ..actions import Action, CommandFailedAction, StopAction
from ..errors import ErrorOccurance
from .abstract_store import HasState, HandlesActions


@dataclass(frozen=True)
class ErrorState:
    """State of all protocol engine error occurances."""

    errors_by_id: Mapping[str, ErrorOccurance]


class ErrorStore(HasState[ErrorState], HandlesActions):
    """Error state container."""

    _state: ErrorState

    def __init__(self) -> None:
        """Initialize a CommandStore and its state."""
        self._state = ErrorState(errors_by_id={})

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        error_occurance = None

        if isinstance(action, CommandFailedAction):
            error_occurance = _create_error_occurance(
                error=action.error,
                error_id=action.error_id,
                created_at=action.completed_at,
            )

        elif isinstance(action, StopAction) and action.error_details is not None:
            error_occurance = _create_error_occurance(
                error=action.error_details.error,
                error_id=action.error_details.error_id,
                created_at=action.error_details.created_at,
            )

        if error_occurance is not None:
            errors_by_id = dict(self._state.errors_by_id)
            errors_by_id[error_occurance.id] = error_occurance
            self._state = replace(self._state, errors_by_id=errors_by_id)


class ErrorView(HasState[ErrorState]):
    """Read-only error state view."""

    _state: ErrorState

    def __init__(self, state: ErrorState) -> None:
        """Initialize the view of command state with its underlying data."""
        self._state = state

    def get_all(self) -> List[ErrorOccurance]:
        """Get a list of all error occurances in state."""
        return list(self._state.errors_by_id.values())


def _create_error_occurance(
    error: Exception,
    error_id: str,
    created_at: datetime,
) -> ErrorOccurance:
    return ErrorOccurance(
        id=error_id,
        errorType=type(error).__qualname__,
        createdAt=created_at,
        detail=str(error),
    )
