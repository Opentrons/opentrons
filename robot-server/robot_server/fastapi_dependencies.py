"""Shared FastAPI dependencies for robot_server."""

import logging
from datetime import datetime
from typing import Annotated, TypeAlias, Union, cast

from fastapi import Depends
from pydantic import BaseModel

from robot_server.runs.action_models import CreateRunActionRequest, RunActionType

log = logging.getLogger(__name__)

# Request bodies for routes that use :func:`get_run_action_body_has_user_notes`.
# Add concrete models here when another POST shares this dependency.
BodyWithOptionalUserNotes: TypeAlias = Union[CreateRunActionRequest, BaseModel]


def get_run_action_body_has_user_notes(body: BodyWithOptionalUserNotes) -> bool:
    """``True`` when the body is a play run action with ``userNotes`` set."""
    # TODO(TZ, 5-8-26): validate access control enabled
    if isinstance(body, CreateRunActionRequest):
        return body.userNotes is not None and body.data.actionType == RunActionType.PLAY
    return False


def log_run_action_play_user_notes(
    runId: str,
    request_body: CreateRunActionRequest,
    created_at: datetime,
    body_has_user_notes: Annotated[bool, Depends(get_run_action_body_has_user_notes)],
) -> None:
    """Log (and later persist) when a play action includes ``userNotes``."""
    if not body_has_user_notes:
        return
    text = cast(str, request_body.userNotes)
    # TODO(TZ, 5-8-26): persist audit entry.
    log.info(
        "Play action with userNotes "
        "(persist audit entry TODO): run_id=%s recorded_at=%s note_len=%s",
        runId,
        created_at.isoformat(),
        len(text),
    )
