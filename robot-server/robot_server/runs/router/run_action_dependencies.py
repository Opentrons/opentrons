"""FastAPI dependencies for run-related routes (shared body-shape helpers)."""

from typing import Any

from ..action_models import CreateRunActionRequest, RunActionType


def run_action_has_user_confirmation(body: CreateRunActionRequest) -> bool:
    """True when ``body`` is a play action and ``userConfirmation`` is present."""
    if body.data.actionType != RunActionType.PLAY:
        return False
    return body.userConfirmation is not None


def get_body_needs_user_confirmation(request_body: Any) -> bool:
    """FastAPI dependency; see implementation for ``CreateRunActionRequest`` handling."""
    # TODO(TZ, 5-8-26): validate access control enabled
    if not isinstance(request_body, CreateRunActionRequest):
        return run_action_has_user_confirmation(request_body)
    return False
