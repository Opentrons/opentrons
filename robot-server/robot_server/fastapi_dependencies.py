"""Shared FastAPI dependencies for robot_server."""

from typing import TypeAlias, Union

from pydantic import BaseModel

from robot_server.runs.action_models import CreateRunActionRequest, RunActionType

# Request bodies for routes that use :func:`get_run_action_body_has_user_notes`.
# Add concrete models here when another POST shares this dependency.
BodyWithOptionalUserNotes: TypeAlias = Union[CreateRunActionRequest, BaseModel]


def get_run_action_body_has_user_notes(body: BodyWithOptionalUserNotes) -> bool:
    """``True`` when the body is a play run action with ``userNotes`` set."""
    # TODO(TZ, 5-8-26): validate access control enabled
    if isinstance(body, CreateRunActionRequest):
        return body.userNotes is not None and body.data.actionType == RunActionType.PLAY
    return False
