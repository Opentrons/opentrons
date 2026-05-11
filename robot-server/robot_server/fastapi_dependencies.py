"""Shared FastAPI dependency functions used across routers."""

from typing import TypeAlias, Union

from pydantic import BaseModel

from robot_server.runs.action_models import CreateRunActionRequest, RunActionType

# POST bodies for routes that may share :func:`get_body_has_user_notes`.
# Add concrete models when another endpoint reuses this helper.
RequestBodyUnion: TypeAlias = Union[CreateRunActionRequest, BaseModel]


def body_is_play_with_user_notes(body: CreateRunActionRequest) -> bool:
    """True when the run-action create body is play and includes ``userNotes``."""
    if body.data.actionType == RunActionType.PLAY and body.userNotes is not None:
        return True
    return False


def get_body_has_user_notes(request_body: RequestBodyUnion) -> bool:
    """FastAPI dependency: play + ``userNotes`` for run-action create bodies."""
    # TODO(TZ, 5-8-26): validate access control enabled
    if isinstance(request_body, CreateRunActionRequest):
        return body_is_play_with_user_notes(request_body)
    return False
